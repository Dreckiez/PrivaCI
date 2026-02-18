import { config } from "./config/config.js";
import express from "express";
import session from "express-session";
import cors from "cors";
import http from "http";
import authRoute from "./routes/auth.route.js";

const app = express();

const server = http.createServer(app);

app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json());

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

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT} ...`);
});