import { pool } from "../libs/db.js";
import { decryptToken } from "../utils/auth.util.js";

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
                SELECT type, file, line, severity, description, snippet 
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