import axios from "axios";
import crypto from "crypto"
import { config } from "../config/config.js";

// 1. Redirect to GitHub
export const login = (req, res) => {

    const state = crypto.randomBytes(16).toString("hex");

    req.session.oauthState = state;

    const url = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&scope=repo,user:email&state=${state}`;
    res.redirect(url);
};

// 2. Handle the Callback
export const githubCallback = async (req, res) => {
    const { code, state } = req.query;

    if (!state || state !== req.session.oauthState) return res.status(403).send("Invalid state");

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
        const { userResponse } = await axios.get("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const githubID = userResponse.id;
        const username = userResponse.login;
        const avatar = userResponse.avatar_url;

        req.session.regenerate(() => {
            req.session.user = {
                githubID,
                username,
                avatar
            };

            req.session.githubToken = accessToken;

            res.redirect(`${config.CLIENT_URL}/dashboard`);
        });
    } catch (error) {
        console.error("Auth Error:", error.message);
        res.redirect(`${config.CLIENT_URL}/login?error=auth_failed`);
    }
};