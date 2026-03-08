import express from "express";
import {
    getDashboardStats,
    getAllUsers,
    getAllProperties,
    getPropertyByIdForAdmin,
    reviewProperty,
} from "../controllers/admin.controller.js";
import { hasAccess } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ── All routes require admin role ── */
router.use(hasAccess(["admin"]));

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.get("/properties", getAllProperties);
router.get("/properties/:id", getPropertyByIdForAdmin);
router.put("/properties/:id/review", reviewProperty);

export default router;
