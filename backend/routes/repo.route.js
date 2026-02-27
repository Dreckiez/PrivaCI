import express from "express";
import { getRepoDetail, getRepos, scanAllBranches, scanBranch, syncRepos } from "../controllers/repo.controller.js";

const router = express.Router();

router.get("/", getRepos);
router.get("/:id/details", getRepoDetail);
router.post("/:id/scanBranch", scanBranch);
router.post("/:id/scanAll", scanAllBranches);
router.post("/sync", syncRepos);

export default router;