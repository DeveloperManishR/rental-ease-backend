import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";

import publicRoutes from "./public.route.js";
import authRoutes from "./auth.route.js";
import propertyRoutes from "./property.route.js";
import visitRequestRoutes from "./visitRequest.route.js";
import ticketRoutes from "./ticket.route.js";
import moveInRoutes from "./moveIn.route.js";
import adminRoutes from "./admin.route.js";

const router = express.Router();

/* ── Public (no auth) ── */
router.use("/public", publicRoutes);

/* ── All routes below require authentication ── */
router.use(authenticate);

router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/visits", visitRequestRoutes);
router.use("/tickets", ticketRoutes);
router.use("/move-in", moveInRoutes);
router.use("/admin", adminRoutes);

export default router;
