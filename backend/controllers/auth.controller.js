import axios from "axios";
import { config } from "../config/config.js";

// 1. Redirect to GitHub
export const login = (req, res) => {
    const url = `https://github.com/login/oauth/authorize?client_id=${config.GITHUB_CLIENT_ID}&scope=repo,user:email`;
    res.redirect(url);
};

// 2. Handle the Callback
export const githubCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ message: "No code provided" });
    }

    try {
        // Exchange code for token
        const { data } = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
            client_id: config.GITHUB_CLIENT_ID,
            client_secret: config.GITHUB_CLIENT_SECRET,
            code,
        },
        { headers: { Accept: "application/json" } }
        );

        const accessToken = data.access_token;

        // Get User Details
        const userResponse = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
        });

        const username = userResponse.data.login;

        // Redirect to Frontend
        res.redirect(`${config.CLIENT_URL}/login?token=${accessToken}&username=${username}`);

    } catch (error) {
        console.error("Auth Error:", error.message);
        res.redirect(`${config.CLIENT_URL}/login?error=auth_failed`);
    }
};