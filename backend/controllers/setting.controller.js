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

export const getIgnoreRules = async (req, res) => {
    try {
        const userId = req.session.user.dbID;
        const result = await pool.query('SELECT * FROM ignore_rules WHERE user_id = $1 ORDER BY id DESC', [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch ignore rules" });
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

export const addIgnoreRule = async (req, res) => {
    const userId = req.session.user.dbID;
    const { path } = req.body;

    try {
        if (!path) {
            return res.status(400).json({ error: "Path cannot be empty" });
        }

        try {
            new RegExp(path);
        } catch (syntaxError) {
            return res.status(400).json({ error: "Fatal: Invalid Regex syntax provided for ignore path." });
        }

        const result = await pool.query(
            'INSERT INTO ignore_rules (user_id, pattern) VALUES ($1, $2) RETURNING *',
            [userId, path]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to add ignore rule" });
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

export const deleteIgnoreRule = async (req, res) => {
    const userId = req.session.user.dbID;
    const ruleId = req.params.id;

    try {
        await pool.query('DELETE FROM ignore_rules WHERE id = $1 AND user_id = $2', [ruleId, userId]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Delete Ignore Rule Error:", error);
        res.status(500).json({ error: "Failed to delete ignore rule" });
    }
};