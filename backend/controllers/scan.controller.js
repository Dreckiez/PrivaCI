import { pool } from "../libs/db.js";

export const getScans = async (req, res) => {
    const userId = req.session.user.dbID; 

    try {
        // 1. Fetch all aggregate stats in ONE single query for maximum performance
        const statsQuery = `
            SELECT 
                COUNT(*) as total_scans,
                COUNT(*) FILTER (WHERE s.scanned_at >= CURRENT_DATE) as today_scans,
                COUNT(*) FILTER (WHERE s.status = 'CRITICAL') as critical_scans,
                COUNT(*) FILTER (WHERE s.status = 'SAFE') as safe_scans
            FROM scans s
            JOIN repos r ON s.repo_id = r.id
            WHERE r.user_id = $1;
        `;
        const statsRes = await pool.query(statsQuery, [userId]);
        const stats = statsRes.rows[0];

        // 2. Fetch the 5 latest scans with their repository names
        const recentScansQuery = `
            WITH RepoLatest AS (
                SELECT s.repo_id, MAX(s.scanned_at) AS repo_latest_activity
                FROM scans s
                JOIN repos r ON s.repo_id = r.id
                WHERE r.user_id = $1
                GROUP BY s.repo_id
            ),
            RankedScans AS (
                SELECT 
                    r.id AS repo_id,
                    r.github_repo_id,
                    r.name AS repo_name,
                    s.branch,
                    s.commit_hash,
                    s.status,
                    s.pii_count,
                    s.key_count,
                    s.scanned_at,
                    rl.repo_latest_activity,
                    CASE s.status
                        WHEN 'CRITICAL' THEN 3
                        WHEN 'WARNING' THEN 2
                        WHEN 'SAFE' THEN 1
                        ELSE 0
                    END AS severity_score
                FROM scans s
                JOIN repos r ON s.repo_id = r.id
                JOIN RepoLatest rl ON rl.repo_id = r.id
                WHERE r.user_id = $1
            ),
            WorstBranchPerRepo AS (
                SELECT DISTINCT ON (repo_id)
                    repo_id,
                    github_repo_id,
                    repo_name,
                    branch,
                    commit_hash,
                    status,
                    pii_count,
                    key_count,
                    scanned_at,
                    repo_latest_activity
                FROM RankedScans
                ORDER BY 
                    repo_id,
                    severity_score DESC,
                    scanned_at DESC,
                    commit_hash DESC
            )
            SELECT 
                github_repo_id,
                repo_name,
                branch,
                commit_hash,
                status,
                pii_count,
                key_count,
                scanned_at
            FROM WorstBranchPerRepo
            ORDER BY repo_latest_activity DESC
            LIMIT 5;
        `;
        const recentRes = await pool.query(recentScansQuery, [userId]);

        // 3. Format and return the payload to Angular
        return res.status(200).json({
            stats: {
                // Postgres COUNT returns BigInt strings, so we parse them to JS numbers
                totalScans: parseInt(stats.total_scans) || 0,
                todayScans: parseInt(stats.today_scans) || 0,
                criticalScans: parseInt(stats.critical_scans) || 0,
                safeScans: parseInt(stats.safe_scans) || 0,
            },
            recentScans: recentRes.rows
        });

    } catch (error) {
        console.error("Dashboard Overview Error:", error.message);
        return res.status(500).json({ error: "Failed to fetch dashboard overview data." });
    }
}

export const updateFindingStatus = async (req, res) => {
    const { findingId, status } = req.body;

    if (!findingId || !['OPEN', 'IGNORED', 'FIXED'].includes(status)) {
        return res.status(400).json({ error: "Invalid status or missing ID." });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const findingRes = await client.query(
            'SELECT scan_id FROM findings WHERE id = $1', 
            [findingId]
        );

        if (findingRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Finding not found." });
        }
        
        const scanId = findingRes.rows[0].scan_id;
        
        await pool.query('UPDATE findings SET status = $1 WHERE id = $2', [status, findingId]);

        // 2. Dynamically recalculate the remaining OPEN stats for this scan
        const statsRes = await client.query(`
            SELECT 
                COUNT(*) FILTER (WHERE type = 'PII' AND status = 'OPEN') as pii_count,
                COUNT(*) FILTER (WHERE type = 'KEY' AND status = 'OPEN') as key_count,
                BOOL_OR(severity = 'CRITICAL' AND status = 'OPEN') as has_critical,
                BOOL_OR(severity = 'WARNING' AND status = 'OPEN') as has_warning
            FROM findings
            WHERE scan_id = $1
        `, [scanId]);

        const stats = statsRes.rows[0];
        const piiCount = parseInt(stats.pii_count || 0);
        const keyCount = parseInt(stats.key_count || 0);
        
        // 3. Determine the new overall branch status
        let newStatus = 'SAFE';
        if (stats.has_critical) newStatus = 'CRITICAL';
        else if (stats.has_warning) newStatus = 'WARNING';

        // 4. Update the parent scan record so the UI badges reflect reality
        await client.query(`
            UPDATE scans 
            SET pii_count = $1, key_count = $2, status = $3 
            WHERE id = $4
        `, [piiCount, keyCount, newStatus, scanId]);

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: `Finding marked as ${status}` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Status Update Error:", error.message);
        return res.status(500).json({ error: "Failed to update status." });
    } finally {
        client.release();
    }
};