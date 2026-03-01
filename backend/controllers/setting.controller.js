import { pool } from "../libs/db.js";

export const getCustomRules = async (req, res) => {
    try {
        const userId = req.session.user.dbID;
        const result = await pool.query('SELECT * FROM custom_rules WHERE user_id = $1 ORDER BY id DESC', [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch rules" });
    }
};

export const addCustomRule = async (req, res) => {
    const userId = req.session.user.dbID;
    const { name, regex, severity } = req.body;

    try {
        // Basic validation
        if (!name || !regex || !['WARNING', 'CRITICAL'].includes(severity)) {
            return res.status(400).json({ error: "Invalid input data" });
        }

        try {
            new RegExp(regex);
        } catch (syntaxError) {
            return res.status(400).json({ error: "Fatal: Invalid Regex syntax provided." });
        }

        const result = await pool.query(
            'INSERT INTO custom_rules (user_id, name, regex, severity) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, name, regex, severity]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Add Rule Error:", error);
        res.status(500).json({ error: "Failed to add rule" });
    }
};

export const deleteCustomRule = async (req, res) => {
    const userId = req.session.user.dbID;
    const ruleId = req.params.id;

    try {
        await pool.query('DELETE FROM custom_rules WHERE id = $1 AND user_id = $2', [ruleId, userId]);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete rule" });
    }
};