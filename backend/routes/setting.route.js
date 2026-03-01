import express from "express";
import { getCustomRules, addCustomRule, deleteCustomRule } from "../controllers/setting.controller.js";

const router = express.Router();

router.get("/custom-rules", getCustomRules);
router.post("/custom-rules", addCustomRule);
router.delete("/custom-rules/:id", deleteCustomRule);

export default router;