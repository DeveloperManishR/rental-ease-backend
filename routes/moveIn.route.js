import express from "express";
import {
    createMoveIn,
    getMyMoveIns,
    getMoveInById,
    getMoveInByProperty,
    uploadDocuments,
    acceptAgreement,
    updateInventory,
} from "../controllers/moveIn.controller.js";
import { hasAccess } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { createMoveInSchema } from "../validations/moveIn.validation.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

/* ── Tenant Routes ── */
router.post("/", hasAccess(["tenant"]), validate(createMoveInSchema), createMoveIn);
router.get("/my", hasAccess(["tenant"]), getMyMoveIns);
router.get("/:id", hasAccess(["tenant", "owner", "admin"]), getMoveInById);
router.put("/:id/documents", hasAccess(["tenant"]), upload.array("documents", 10), uploadDocuments);
router.put("/:id/agreement", hasAccess(["tenant"]), acceptAgreement);
router.put("/:id/inventory", hasAccess(["tenant"]), updateInventory);

/* ── Owner / Admin Routes ── */
router.get("/property/:propertyId", hasAccess(["owner", "admin"]), getMoveInByProperty);

export default router;
