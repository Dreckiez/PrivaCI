import axios from "axios";
import crypto from "crypto"
import { config } from "../config/config.js";
import { encryptToken } from "../utils/auth.util.js";
import { pool } from "../libs/db.js";

// 1. Redirect to GitHub
export const login = (req, res) => {

    const state = crypto.randomBytes(16).toString("hex");

    req.session.oauthState = state;

    const url = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&scope=repo,user:email&state=${state}`;
    res.redirect(url);
};

export const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ success: false });

        res.clearCookie('sid');
        res.json({success: true});
    });
}

// 2. Handle the Callback
export const githubCallback = async (req, res) => {
    const { code, state } = req.query;

    if (!state || state !== req.session.oauthState) return res.redirect(`${config.CLIENT_URL}/login?error=invalid_state`);

    delete req.session.oauthState;

    if (!code) {
        return res.redirect(`${config.CLIENT_URL}/login?error=access_denied`);
    }

    try {
        // Exchange code for token
        const { data } = await axios.post("https://github.com/login/oauth/access_token", {
                client_id: config.GITHUB_CLIENT_ID,
                client_secret: config.GITHUB_CLIENT_SECRET,
                code,
            },
            { headers: { Accept: "application/json" } }
        );

        const accessToken = data.access_token;

        if (!accessToken) {
            return res.redirect(`${config.CLIENT_URL}/login?error=invalid_token`);
        }

        // Get User Details
        const userResponse = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const githubID = userResponse.data.id;
        const username = userResponse.data.login;
        const avatar = userResponse.data.avatar_url;

        const encryptedToken = encryptToken(accessToken);

        const userCheck = await pool.query("SELECT id FROM users WHERE github_user_id = $1", [githubID]);
        const isReturningUser = userCheck.rowCount > 0;

        let allRepos = [];
        
        if (!isReturningUser) {
            let page = 1;
            
            while (page <= 10) {
                const reposResponse = await axios.get(`https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
    
                if (reposResponse.data.length === 0) break;
                allRepos.push(...reposResponse.data);
                page++;
            }
        }

        let dbUserId;

        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const userResult = await client.query(`
                INSERT INTO users (github_user_id, username, avatar_url, access_token)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (github_user_id) 
                DO UPDATE SET 
                    username = EXCLUDED.username, 
                    avatar_url = EXCLUDED.avatar_url, 
                    access_token = EXCLUDED.access_token
                RETURNING id;
            `, [githubID, username, avatar, encryptedToken]);

            dbUserId = userResult.rows[0].id;
            
            if (!isReturningUser && allRepos.length > 0) {
                const values = [];
                const placeholders = [];
                let paramIndex = 1;

                allRepos.forEach(repo => {
                    placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
                    values.push(repo.id, dbUserId, repo.name, repo.owner.login, repo.private, repo.language || 'Unknown', repo.updated_at);
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

                // Execute the single massive query
                await client.query(batchInsertQuery, values);
            }

            await client.query("COMMIT");

        } catch (dbError) {
            await client.query("ROLLBACK");
            throw dbError;
        }
        finally {
            client.release();
        }

        req.session.regenerate(() => {
            req.session.user = {
                dbID: dbUserId,
                githubID,
                username,
                avatar
            };

            res.redirect(`${config.CLIENT_URL}/dashboard`);
        });
    } catch (error) {
        // console.error("Auth Error:", error.message);
        res.redirect(`${config.CLIENT_URL}/login?error=auth_failed`);
    }
};

export const deleteAccount = async (req, res) => {
    const userId = req.session?.user?.dbID;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        req.session.destroy((err) => {
            if (err) throw err;
            res.clearCookie('sid');
            return res.status(200).json({ message: "Account purged." });
        });
    } catch (error) {
        console.error("Nuke Error:", error);
        res.status(500).json({ error: "System failure during account purge." });
    }
};

export const userInfo = async (req, res) => {
    if (!req.session.user) return res.status(401).json({authenticated: false});

    return res.status(200).json({authenticated: true, user: req.session.user});
}