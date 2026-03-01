import { pool } from "../libs/db.js";
import axios from "axios";
import { decryptToken } from "../utils/auth.util.js";
import { executeBaselineScan, executeBranchScan } from "../utils/scan.util.js";

export const scanBranch = async (req, res) => {
    const githubRepoId = req.params.id;
    const branch = req.body.branch || 'main'; 
    const userId = req.session.user.dbID;

    try {
        const repoRes = await pool.query(`
            SELECT r.id, r.name, r.owner, u.access_token 
            FROM repos r JOIN users u ON r.user_id = u.id
            WHERE r.github_repo_id = $1 AND r.user_id = $2
        `, [githubRepoId, userId]);
        
        if (repoRes.rowCount === 0) return res.status(404).json({ error: "Repository not found" });

        const result = await executeBranchScan(repoRes.rows[0], branch, userId);
        res.status(200).json({ success: true, message: "Scan complete", data: result });

    } catch (error) {
        console.error("Single Scan Error:", error);
        res.status(500).json({ success: false, error: "Failed to scan branch." });
    }
};

export const scanAllBranches = async (req, res) => {
    const githubRepoId = req.params.id;
    const userId = req.session.user.dbID;

    try {
        const repoRes = await pool.query(`
            SELECT r.id, r.name, r.owner, u.access_token 
            FROM repos r JOIN users u ON r.user_id = u.id
            WHERE r.github_repo_id = $1 AND r.user_id = $2
        `, [githubRepoId, userId]);
        
        if (repoRes.rowCount === 0) return res.status(404).json({ error: "Repository not found" });
        const repo = repoRes.rows[0];

        // Fetch all branches from GitHub
        const decryptedToken = decryptToken(repo.access_token);
        const ghBranchesRes = await axios.get(`https://api.github.com/repos/${repo.owner}/${repo.name}/branches`, {
            headers: { Authorization: `Bearer ${decryptedToken}` }
        });
        const branches = ghBranchesRes.data.map(b => b.name);

        const results = await executeBaselineScan(repo, branches, userId);

        res.status(200).json({ 
            success: true, 
            message: `Baseline scan complete for ${branches.length} branches.`, 
            data: results 
        });

    } catch (error) {
        console.error("Batch Scan Error:", error);
        res.status(500).json({ success: false, error: "Failed to perform baseline scan." });
    }
};

export const getRepos = async (req, res) => {

    const userId = req.session.user.dbID;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    try {
        const countResult = await pool.query(
            "SELECT COUNT(*) FROM repos WHERE user_id = $1", 
            [userId]
        );
        
        const totalItems = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limit);

        const reposResult = await pool.query(`
            SELECT 
                r.id, 
                r.github_repo_id, 
                r.name, 
                r.owner, 
                r.is_private, 
                r.main_language, 
                r.is_tracked, 
                r.created_at,
                s.status AS scan_status,
                s.scanned_at AS last_scanned_at
            FROM repos r
            LEFT JOIN LATERAL (
                SELECT status, scanned_at 
                FROM scans 
                WHERE repo_id = r.id 
                ORDER BY scanned_at DESC 
                LIMIT 1
            ) s ON true
            WHERE r.user_id = $1 
            ORDER BY r.github_updated_at DESC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        res.status(200).json({
            success: true,
            data: reposResult.rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        // console.error("Database Error (Fetch Repos):", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch repositories." });
    }
};

export const getRepoDetail = async (req, res) => {

    const githubRepoId = req.params.id;
    let selectedBranch = req.query.branch; 
    const userId = req.session.user.dbID;

    try {
        // 1. Get Repo Details AND the User's Encrypted Token in one query
        const repoRes = await pool.query(`
            SELECT r.id, r.name, r.owner, u.access_token 
            FROM repos r
            JOIN users u ON r.user_id = u.id
            WHERE r.github_repo_id = $1 AND r.user_id = $2
        `, [githubRepoId, userId]);
        
        if (repoRes.rowCount === 0) return res.status(404).json({error: "Repository not found"});
        const repo = repoRes.rows[0];

        // 2. ALWAYS fetch branches from GitHub (The Ultimate Source of Truth)
        let branches = [];
        try {
            const decryptedToken = decryptToken(repo.access_token);
            const ghBranchesRes = await axios.get(`https://api.github.com/repos/${repo.owner}/${repo.name}/branches`, {
                headers: { Authorization: `Bearer ${decryptedToken}` }
            });
            branches = ghBranchesRes.data.map(b => b.name);
        } catch (ghErr) {
            console.error("GitHub API Error (Branches):", ghErr.message);
            // Only fallback to DB history if GitHub is completely down
            const fallbackRes = await pool.query(`SELECT DISTINCT branch FROM scans WHERE repo_id = $1`, [repo.id]);
            branches = fallbackRes.rowCount > 0 ? fallbackRes.rows.map(r => r.branch) : ['main'];
        }

        // 3. Determine the active branch
        if (selectedBranch && !branches.includes(selectedBranch)) {
            selectedBranch = null; 
        }

        // Default to a safe branch if none was provided (or if the requested one was invalid)
        if (!selectedBranch && branches.length > 0) {
            selectedBranch = branches.includes('main') ? 'main' : 
                             (branches.includes('master') ? 'master' : branches[0]);
        }

        // 4. Query the scans table for the latest status of ALL branches
        const branchesRes = await pool.query(`
            SELECT DISTINCT ON (branch) branch, status 
            FROM scans 
            WHERE repo_id = $1 
            ORDER BY branch, scanned_at DESC
        `, [repo.id]);

        // 5. Calculate Overall Status (Ignoring branches that were deleted on GitHub!)
        let overallStatus = 'UNSCANNED';
        if (branchesRes.rowCount > 0) {
            // Only look at scan results for branches that still actually exist on GitHub
            const activeScans = branchesRes.rows.filter(r => branches.includes(r.branch));
            
            if (activeScans.length > 0) {
                if (activeScans.some(r => r.status === 'CRITICAL')) overallStatus = 'CRITICAL';
                else if (activeScans.some(r => r.status === 'WARNING')) overallStatus = 'WARNING';
                else overallStatus = 'SAFE'; 
            }
        }

        // 6. Get the latest scan data for the *CURRENTLY SELECTED* branch
        const scanRes = await pool.query(`
            SELECT id, commit_hash, scanned_at, status 
            FROM scans 
            WHERE repo_id = $1 AND branch = $2 
            ORDER BY scanned_at DESC LIMIT 1
        `, [repo.id, selectedBranch]);

        let scanDetails = null;
        let findings = [];
        let branchStatus = 'UNSCANNED';

        if (scanRes.rowCount > 0) {
            scanDetails = scanRes.rows[0];
            branchStatus = scanDetails.status;

            const findingsRes = await pool.query(`
                SELECT id, type, file, line, severity, description, snippet, status
                FROM findings 
                WHERE scan_id = $1
            `, [scanDetails.id]);
            findings = findingsRes.rows;
        }

        // 7. Send the unified payload
        res.status(200).json({
            success: true,
            data: {
                repoName: repo.name,
                overallStatus: overallStatus,
                branches: branches,
                selectedBranch: selectedBranch,
                branchStatus: branchStatus,
                currentScan: scanDetails ? {
                    commitHash: scanDetails.commit_hash,
                    scannedAt: scanDetails.scanned_at,
                    findings: findings
                } : null
            }
        });

    } catch (error) {
        // console.error("Database Error (Repo Details):", error.message);
        res.status(500).json({ success: false, error: "Failed to fetch repository details." });
    }
}

export const syncRepos = async (req, res) => {
    const userId = req.session.user.dbID;

    try {
        // 1. Get the user's encrypted token from the DB
        const userRes = await pool.query('SELECT access_token FROM users WHERE id = $1', [userId]);
        
        if (userRes.rowCount === 0) return res.status(404).json({ error: "User not found" });
        
        const encryptedToken = userRes.rows[0].access_token;
        const accessToken = decryptToken(encryptedToken);

        // 2. Fetch all repos from GitHub (Handling Pagination)
        let allRepos = [];
        let page = 1;
        
        while (page <= 10) { // Limit to 10 pages for safety
            const reposResponse = await axios.get(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (reposResponse.data.length === 0) break;
            allRepos.push(...reposResponse.data);
            page++;
        }

        if (allRepos.length === 0) {
            return res.status(200).json({ success: true, message: "No repositories found on GitHub." });
        }

        // 3. Batch Update PostgreSQL
        const client = await pool.connect();
        
        try {
            await client.query("BEGIN");

            const values = [];
            const placeholders = [];
            let paramIndex = 1;

            allRepos.forEach(repo => {
                placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                
                values.push(
                    repo.id, 
                    userId, 
                    repo.name, 
                    repo.owner.login, 
                    repo.private, 
                    repo.language || 'Unknown',
                    repo.updated_at
                );
            });

            const batchInsertQuery = `
                INSERT INTO repos (github_repo_id, user_id, name, owner, is_private, main_language, github_updated_at)
                VALUES ${placeholders.join(', ')}
                ON CONFLICT (github_repo_id) 
                DO UPDATE SET 
                    name = EXCLUDED.name,
                    owner = EXCLUDED.owner,
                    is_private = EXCLUDED.is_private,
                    main_language = EXCLUDED.main_language,
                    github_updated_at = EXCLUDED.github_updated_at;
            `;

            await client.query(batchInsertQuery, values);
            await client.query("COMMIT");

            res.status(200).json({ success: true, message: "Repositories synced successfully." });

        } catch (dbError) {
            await client.query("ROLLBACK");
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("Sync Error:", error.message);
        res.status(500).json({ success: false, error: "Failed to sync repositories with GitHub." });
    }
};