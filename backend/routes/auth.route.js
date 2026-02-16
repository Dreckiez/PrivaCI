import express from "express";
import { login, githubCallback } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/login", login);
router.get("/github/callback", githubCallback);

export default router;