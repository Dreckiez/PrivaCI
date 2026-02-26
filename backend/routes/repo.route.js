import express from "express";
import { getRepoDetail, getRepos, syncRepos } from "../controllers/repo.controller.js";

const router = express.Router();

router.get("/", getRepos);
router.get("/:id/details", getRepoDetail);
router.post("/sync", syncRepos);

export default router;