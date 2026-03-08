import express from "express";
import {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketById,
    addMessage,
    closeTicket,
} from "../controllers/ticket.controller.js";
import { hasAccess } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
    createTicketSchema,
    addMessageSchema,
} from "../validations/ticket.validation.js";

const router = express.Router();

/* ── Tenant Routes ── */
router.post("/", hasAccess(["tenant"]), validate(createTicketSchema), createTicket);
router.get("/my", hasAccess(["tenant"]), getMyTickets);

/* ── Admin Routes ── */
router.get("/", hasAccess(["admin"]), getAllTickets);
router.put("/:id/close", hasAccess(["admin"]), closeTicket);

/* ── Shared Routes (Tenant + Admin) ── */
router.get("/:id", hasAccess(["tenant", "admin"]), getTicketById);
router.post("/:id/message", hasAccess(["tenant", "admin"]), validate(addMessageSchema), addMessage);

export default router;
