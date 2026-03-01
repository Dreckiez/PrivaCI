import express from "express";
import { login, githubCallback, userInfo, logout, deleteAccount } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/login", login);
router.get("/github/callback", githubCallback);
router.get("/me", userInfo);
router.post("/logout", logout);
router.delete("/account", deleteAccount);

export default router;