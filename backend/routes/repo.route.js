import express from "express";
import { getRepos } from "../controllers/repo.controller";

const router = express.Router();

router.get("/", getRepos);

export default router;