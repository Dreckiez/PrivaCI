import express from "express";
import { getScans, updateFindingStatus } from "../controllers/scan.controller.js";

const router = express.Router();

router.get("/", getScans);
router.post("/findings", updateFindingStatus);

export default router;