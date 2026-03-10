import express from "express";
import { getCustomRules, addCustomRule, deleteCustomRule, getIgnoreRules, addIgnoreRule, deleteIgnoreRule } from "../controllers/setting.controller.js";

const router = express.Router();

router.get("/custom-rules", getCustomRules);
router.post("/custom-rules", addCustomRule);
router.delete("/custom-rules/:id", deleteCustomRule);

router.get("/ignore-rules", getIgnoreRules);
router.post("/ignore-rules", addIgnoreRule);
router.delete("/ignore-rules/:id", deleteIgnoreRule);

export default router;