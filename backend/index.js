import { config } from "./config/config.js";
import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import { pool } from "./libs/db.js";
import authRoute from "./routes/auth.route.js";
import repoRoute from "./routes/repo.route.js";

const app = express();

const server = http.createServer(app);

app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json());

app.set("trust proxy", 1);

app.use(session({
  name: "sid",
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

app.use("/api/auth", authRoute);
app.use("/api/repo", repoRoute);

async function startServer() {
  try {
    await pool.query('SELECT 1'); // triggers connection
    console.log('🟢 DB ready');

    server.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT} ...`);
    });
  } catch (err) {
    console.error('🔴 DB connection failed:', err);
    process.exit(1); // crash so Render/Vercel restarts
  }
}

startServer();

