import { pool } from "../libs/db.js";

export const getRepos = async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

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
                id, 
                github_repo_id, 
                name, 
                owner, 
                is_private, 
                main_language, 
                is_tracked, 
                created_at
            FROM repos 
            WHERE user_id = $1 
            ORDER BY github_updated_at DESC
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