import dotenv from "dotenv";

dotenv.config();

export const config = {
    PORT: process.env.PORT || 3000,
    CLIENT_URL: process.env.FRONTEND_URL || "http://localhost:4200",
    SESSION_SECRET: process.env.SESSION_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
};