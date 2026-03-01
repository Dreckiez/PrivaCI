import { pool } from "../libs/db";

export const getScans = async (req, res) => {
    const userId = req.user.id; 

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
                repo_id,
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