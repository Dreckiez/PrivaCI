import { config } from "./config/config.js";
import express from "express";
import cors from "cors";
import http from "http";
import authRoute from "./routes/auth.route.js";

const app = express();

const server = http.createServer(app);

app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoute);

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT} ...`);
});