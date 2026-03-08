import express from "express";
import {
   getProfile,
   updateProfile,
   resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

/* ── Profile ── */
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

/* ── Password ── */
router.put("/reset-password", resetPassword);

export default router;
