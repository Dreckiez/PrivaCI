import express from "express";
import { getRepoDetail, getRepos } from "../controllers/repo.controller.js";

const router = express.Router();

router.get("/", getRepos);
router.get("/:id/details", getRepoDetail);

export default router;