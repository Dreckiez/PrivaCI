import { execFile } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { decryptToken } from "../utils/auth.util.js";
import { pool } from "../libs/db.js";
import { BASE_TOML } from "./rule.util.js";

const execFilePromise = util.promisify(execFile);

const redactSecret = (secret) => {
    if (!secret) return '***';
    if (secret.length <= 6) return '*'.repeat(secret.length);
    return secret.substring(0, 3) + '*'.repeat(secret.length - 6) + secret.substring(secret.length - 3);
};

const scrub = (val, token) => val && token ? val.split(token).join('***REDACTED***') : val;


const runGitleaks = async (args, reportFilePath, timeoutMs = 30000) => {
    try {
        await execFilePromise('gitleaks', args, {timeout: timeoutMs});
        return [];
    } catch (error) {
        if (error.code === 1) {
            try {
                const content = await fs.readFile(reportFilePath, 'utf-8');
                return content.trim() ? JSON.parse(content) : [];
            } catch (fsErr) {
                return [];
            }
        } else {
            if (error.killed) throw new Error("Gitleaks scan timed out.");
            throw new Error(`Gitleaks crashed: ${error.message}`);
        }
    }
};

export const executeBaselineScan = async (repo, branches, userId) => {
    let tempDir = null;
    const accessToken = decryptToken(repo.access_token);
    const results = [];

    try {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `privaci-${repo.name}-baseline-`));
        const reportPath = path.join(tempDir, 'gitleaks-report.json');
        const repoUrl = `https://github.com/${repo.owner}/${repo.name}.git`;

        const cloneArgs = [
            '-c', 'credential.helper=',
            '-c', `url.https://x-access-token:${accessToken}@github.com/.insteadOf=https://github.com/`,
            'clone',
            '--quiet',
            '--depth', '1',
            '--no-single-branch',
            repoUrl,
            tempDir
        ];

        try {
            await execFilePromise('git', cloneArgs, {
                timeout: 300000, 
                env: {
                    ...process.env,
                    GIT_TERMINAL_PROMPT: '0',
                    GIT_ASKPASS: 'echo'
                }
            });
        } catch (execError) {
            const safeError = new Error('Git baseline clone failed');
            safeError.message = scrub(execError.message, accessToken);
            safeError.code = execError.code;
            throw safeError;
        }

        // Prepare Custom Rules ONCE for the entire batch
        let tomlContent = BASE_TOML;
        const rulesRes = await pool.query('SELECT * FROM custom_rules WHERE user_id = $1', [userId]);
        if (rulesRes.rowCount > 0) {
            rulesRes.rows.forEach(rule => {
                tomlContent += `\n[[rules]]\n`;
                tomlContent += `id = "custom_${rule.id}"\n`;
                tomlContent += `description = "${rule.name}"\n`;
                tomlContent += `regex = ${JSON.stringify(rule.regex)}\n`;
                tomlContent += `tags = ["PII", "${rule.severity}"]\n`;
            });
        }
        const customConfigPath = path.join(tempDir, 'custom-rules.toml');
        const customReportPath = path.join(tempDir, 'custom-report.json');
        await fs.writeFile(customConfigPath, tomlContent);

        for (const branch of branches) {
            const gitPath = path.join(tempDir, '.git');
            const safeGitPath = `${tempDir}-git-engine`;
            try {
                // Instantly swap branches locally (10s timeout)
                await execFilePromise('git', ['checkout', branch], { cwd: tempDir, timeout: 10000 });
                const { stdout: commitHashOutput } = await execFilePromise('git', ['rev-parse', 'HEAD'], { cwd: tempDir });
                const commitHash = commitHashOutput.trim().substring(0, 7);

                await fs.rename(gitPath, safeGitPath).catch(() => {});

                let allRawFindings = [];

                // SCAN 1: Keys (30s timeout)
                const defaultArgs = ['dir', tempDir, '--report-path', reportPath, '--report-format', 'json'];
                const defaultReport = await runGitleaks(defaultArgs, reportPath); 
                if (defaultReport.length > 0) allRawFindings.push(...defaultReport.map(f => ({ ...f, _source: 'DEFAULT' })));

                // SCAN 2: PII (30s timeout)
                const customArgs = ['dir', tempDir, '--config', customConfigPath, '--report-path', customReportPath, '--report-format', 'json'];
                const customReport = await runGitleaks(customArgs, customReportPath);
                if (customReport.length > 0) allRawFindings.push(...customReport.map(f => ({ ...f, _source: 'PII_SCAN' })));

                await fs.rename(safeGitPath, gitPath).catch(() => {});

                // Parse Findings
                let findingsData = [];
                let piiCount = 0;
                let keyCount = 0;
                let overallStatus = 'SAFE';

                if (allRawFindings.length > 0) {
                    const uniqueFindings = new Map();
                    allRawFindings.forEach(leak => {
                        let type = leak._source === 'PII_SCAN' ? 'PII' : 'KEY';
                        let severity = leak._source === 'PII_SCAN' ? (leak.Tags?.includes('CRITICAL') ? 'CRITICAL' : 'WARNING') : 'CRITICAL';
                        
                        const uniqueKey = `${leak.File}-${leak.StartLine}-${leak.RuleID}-${type}`;
                        if (!uniqueFindings.has(uniqueKey)) {
                            if (type === 'PII') piiCount++;
                            else keyCount++;

                            const cleanRelativePath = path.relative(tempDir, leak.File).split(path.sep).join('/');
                            
                            const rawSecret = leak.Secret;
                            const redactedVersion = redactSecret(rawSecret);
                            
                            let safeCodeSnippet = redactedVersion; 
                            
                            if (leak.Match && rawSecret) {
                                safeCodeSnippet = `${leak.StartLine} |  ${leak.Match.replace(rawSecret, redactedVersion)}`;
                            }
                            
                            uniqueFindings.set(uniqueKey, {
                                type, file: cleanRelativePath, line: leak.StartLine,
                                severity, description: leak.Description || `Exposed ${leak.RuleID} detected.`,
                                snippet: safeCodeSnippet
                            });
                        }
                    });
                    findingsData = Array.from(uniqueFindings.values());
                    overallStatus = findingsData.some(f => f.severity === 'CRITICAL') ? 'CRITICAL' : 'WARNING';
                }

                // DB Transaction FOR THIS SPECIFIC BRANCH
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');

                    const ignoredRes = await client.query(`
                        SELECT f.file, f.line, f.description 
                        FROM findings f
                        JOIN scans s ON f.scan_id = s.id
                        WHERE s.repo_id = $1 AND s.branch = $2 AND f.status = 'IGNORED'
                    `, [repo.id, branch]);

                    const ignoredSet = new Set(
                        ignoredRes.rows.map(r => `${r.file}-${r.line}-${r.description}`)
                    );

                    await client.query(`
                        DELETE FROM findings 
                        WHERE scan_id IN (SELECT id FROM scans WHERE repo_id = $1 AND branch = $2)
                    `, [repo.id, branch]);
                    
                    await client.query(`
                        DELETE FROM scans 
                        WHERE repo_id = $1 AND branch = $2
                    `, [repo.id, branch]);

                    const scanRes = await client.query(`
                        INSERT INTO scans (repo_id, branch, commit_hash, status, pii_count, key_count)
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
                    `, [repo.id, branch, commitHash, overallStatus, piiCount, keyCount]);
                    
                    if (findingsData.length > 0) {
                        const values = [];
                        const placeholders = [];
                        let paramIndex = 1;
                        findingsData.forEach(f => {
                            const findingSignature = `${f.file}-${f.line}-${f.description}`;
                            const findingStatus = ignoredSet.has(findingSignature) ? 'IGNORED' : 'OPEN';
                            placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                            values.push(scanRes.rows[0].id, f.type, f.file, f.line, f.severity, f.description, f.snippet, findingStatus);
                        });
                        await client.query(`INSERT INTO findings (scan_id, type, file, line, severity, description, snippet, status) VALUES ${placeholders.join(', ')}`, values);
                    }
                    await client.query('COMMIT');
                } catch (dbError) {
                    await client.query('ROLLBACK');
                    throw dbError; // Fails this branch, caught by wrapper
                } finally {
                    client.release();
                }

                results.push({ branch, status: overallStatus, vulnerabilities: findingsData.length });

            } catch (branchError) {
                console.error(`Branch Scan Error [${branch}]:`, branchError.message);
                results.push({ branch, status: 'ERROR', error: "Timeout or crash" });
            }
        }

        // Mark entire repo as tracked once baseline completes
        await pool.query(`UPDATE repos SET is_tracked = TRUE WHERE id = $1`, [repo.id]);
        return results;

    } finally {
        if (tempDir) await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 }).catch(console.error);
    }
};

export const executeBranchScan = async (repo, branch, userId) => {
    let tempDir = null;
    const accessToken = decryptToken(repo.access_token);

    try {
        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `privaci-${repo.name}-${branch.replace(/[^a-zA-Z0-9-]/g, '_')}-`));
        const reportPath = path.join(tempDir, 'gitleaks-report.json');
        const repoUrl = `https://github.com/${repo.owner}/${repo.name}.git`;

        const cloneArgs = [
            '-c', 'credential.helper=',
            '-c', `url.https://x-access-token:${accessToken}@github.com/.insteadOf=https://github.com/`,
            'clone',
            // '--quiet',
            '--depth', '1',
            '--branch', branch,
            repoUrl,
            tempDir
        ];

        console.log("Before git clone");

        try {
            await execFilePromise('git', cloneArgs, {
                timeout: 300000,
                env: {
                    ...process.env,
                    GIT_TERMINAL_PROMPT: '0',
                    GIT_ASKPASS: 'echo'
                }
            });
        } catch (execError) {
            const safeError = new Error('Git branch clone failed');
            const rawMessage = `${execError.message}\nGit Output: ${execError.stderr || 'None'}\nKilled by Timeout: ${execError.killed}`;
            safeError.message = scrub(rawMessage, accessToken);
            safeError.code = execError.code;
            throw safeError;
        }

        const { stdout: commitHashOutput } = await execFilePromise('git', ['rev-parse', 'HEAD'], { cwd: tempDir });
        const commitHash = commitHashOutput.trim().substring(0, 7);
        await fs.rm(path.join(tempDir, '.git'), { recursive: true, force: true }).catch(() => {});

        let allRawFindings = [];

        // SCAN 1: Default
        const defaultArgs = ['dir', tempDir, '--report-path', reportPath, '--report-format', 'json'];
        const defaultReport = await runGitleaks(defaultArgs, reportPath);
        if (defaultReport.length > 0) {
            allRawFindings.push(...defaultReport.map(f => ({ ...f, _source: 'DEFAULT' })));
        }

        // SCAN 2: PII & Custom Rules
        let tomlContent = BASE_TOML;
        const rulesRes = await pool.query('SELECT * FROM custom_rules WHERE user_id = $1', [userId]);
        if (rulesRes.rowCount > 0) {
            rulesRes.rows.forEach(rule => {
                tomlContent += `\n[[rules]]\n`;
                tomlContent += `id = "custom_${rule.id}"\n`;
                tomlContent += `description = "${rule.name}"\n`;
                tomlContent += `regex = ${JSON.stringify(rule.regex)}\n`;
                tomlContent += `tags = ["PII", "${rule.severity}"]\n`;
            });
        }

        const customConfigPath = path.join(tempDir, 'custom-rules.toml');
        const customReportPath = path.join(tempDir, 'custom-report.json');
        await fs.writeFile(customConfigPath, tomlContent);

        const customArgs = ['dir', tempDir, '--config', customConfigPath, '--report-path', customReportPath, '--report-format', 'json'];
        const customReport = await runGitleaks(customArgs, customReportPath);
        if (customReport.length > 0) {
            allRawFindings.push(...customReport.map(f => ({ ...f, _source: 'PII_SCAN' })));
        }

        // Parse Findings
        let findingsData = [];
        let piiCount = 0;
        let keyCount = 0;
        let overallStatus = 'SAFE';

        if (allRawFindings.length > 0) {
            const uniqueFindings = new Map();
            allRawFindings.forEach(leak => {
                let type, severity;
                if (leak._source === 'PII_SCAN') {
                    type = 'PII';
                    severity = (leak.Tags || []).includes('CRITICAL') ? 'CRITICAL' : 'WARNING';
                } else {
                    type = 'KEY';
                    severity = 'CRITICAL';
                }

                const uniqueKey = `${leak.File}-${leak.StartLine}-${leak.RuleID}-${type}`;
                if (!uniqueFindings.has(uniqueKey)) {
                    if (type === 'PII') piiCount++;
                    else keyCount++;
                    
                    const cleanRelativePath = path.relative(tempDir, leak.File).split(path.sep).join('/');

                    const rawSecret = leak.Secret;
                    const redactedVersion = redactSecret(rawSecret);
                    
                    let safeCodeSnippet = redactedVersion; 
                    
                    if (leak.Match && rawSecret) {
                        safeCodeSnippet = `${leak.StartLine} |  ${leak.Match.replace(rawSecret, redactedVersion)}`;
                    }

                    uniqueFindings.set(uniqueKey, {
                        type,
                        file: cleanRelativePath,
                        line: leak.StartLine,
                        severity,
                        description: leak.Description || `Exposed ${leak.RuleID} detected.`,
                        snippet: safeCodeSnippet
                    });
                }
            });
            findingsData = Array.from(uniqueFindings.values());
            overallStatus = findingsData.some(f => f.severity === 'CRITICAL') ? 'CRITICAL' : 'WARNING';
        }

        // DB Transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const ignoredRes = await client.query(`
                SELECT f.file, f.line, f.description 
                FROM findings f
                JOIN scans s ON f.scan_id = s.id
                WHERE s.repo_id = $1 AND s.branch = $2 AND f.status = 'IGNORED'
            `, [repo.id, branch]);

            const ignoredSet = new Set(
                ignoredRes.rows.map(r => `${r.file}-${r.line}-${r.description}`)
            );

            await client.query(`
                DELETE FROM findings 
                WHERE scan_id IN (SELECT id FROM scans WHERE repo_id = $1 AND branch = $2)
            `, [repo.id, branch]);
            
            await client.query(`
                DELETE FROM scans 
                WHERE repo_id = $1 AND branch = $2
            `, [repo.id, branch]);

            const scanRes = await client.query(`
                INSERT INTO scans (repo_id, branch, commit_hash, status, pii_count, key_count)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id;
            `, [repo.id, branch, commitHash, overallStatus, piiCount, keyCount]);
            
            const scanId = scanRes.rows[0].id;

            if (findingsData.length > 0) {
                const values = [];
                const placeholders = [];
                let paramIndex = 1;
                findingsData.forEach(f => {
                    const findingSignature = `${f.file}-${f.line}-${f.description}`;
                    const findingStatus = ignoredSet.has(findingSignature) ? 'IGNORED' : 'OPEN';
                    placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                    values.push(scanId, f.type, f.file, f.line, f.severity, f.description, f.snippet, findingStatus);
                });
                await client.query(`
                    INSERT INTO findings (scan_id, type, file, line, severity, description, snippet, status)
                    VALUES ${placeholders.join(', ')}
                `, values);
            }

            await client.query(`UPDATE repos SET is_tracked = TRUE WHERE id = $1`, [repo.id]);
            await client.query('COMMIT');

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

        return { branch, status: overallStatus, vulnerabilities: findingsData.length };

    } finally {
        if (tempDir) await fs.rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 }).catch(console.error);
    }
};