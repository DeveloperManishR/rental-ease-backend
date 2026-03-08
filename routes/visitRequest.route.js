import express from "express";
import {
    createVisitRequest,
    getMyVisitRequests,
    getVisitRequestsForOwner,
    updateVisitStatus,
} from "../controllers/visitRequest.controller.js";
import { hasAccess } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
    createVisitRequestSchema,
    updateVisitStatusSchema,
} from "../validations/visitRequest.validation.js";

const router = express.Router();

/* ── Tenant Routes ── */
router.post("/", hasAccess(["tenant"]), validate(createVisitRequestSchema), createVisitRequest);
router.get("/my", hasAccess(["tenant"]), getMyVisitRequests);

/* ── Owner Routes ── */
router.get("/owner", hasAccess(["owner"]), getVisitRequestsForOwner);
router.put("/:id/status", hasAccess(["owner"]), validate(updateVisitStatusSchema), updateVisitStatus);

export default router;
