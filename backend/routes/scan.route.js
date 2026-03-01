import express from "express";
import { getScans } from "../controllers/scan.controller";

const router = express.Router();

router.get("/", getScans);

export default router;