import express from "express";
import {
    createProperty,
    getMyProperties,
    getAllPublishedProperties,
    getPropertyById,
    updateProperty,
    deleteProperty,
    submitForReview,
} from "../controllers/property.controller.js";
import { hasAccess } from "../middlewares/auth.middleware.js";
import { uploadPropertyImages } from "../middlewares/upload.middleware.js";

const router = express.Router();

/* ── Owner Routes ── */
router.post("/", hasAccess(["owner"]), uploadPropertyImages.array("images", 4), createProperty);
router.get("/my", hasAccess(["owner"]), getMyProperties);
router.put("/:id", hasAccess(["owner"]), uploadPropertyImages.array("images", 4), updateProperty);
router.delete("/:id", hasAccess(["owner"]), deleteProperty);
router.put("/:id/submit", hasAccess(["owner"]), submitForReview);

/* ── Public / Tenant Routes ── */
router.get("/", getAllPublishedProperties);
router.get("/:id", getPropertyById);

export default router;
