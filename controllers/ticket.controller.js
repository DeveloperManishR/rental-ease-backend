import Ticket from "../models/ticket.model.js";
import {
    sucessResponse,
    errorResponse,
    HTTP_STATUS,
} from "../utils/response.js";

/* ======================================================
   Create Ticket (Tenant)
====================================================== */
export const createTicket = async (req, res) => {
    try {
        const { title, message } = req.body;

        const ticket = await Ticket.create({
            tenantId: req.user._id,
            title,
            messages: [
                {
                    senderId: req.user._id,
                    message,
                },
            ],
            status: "open",
        });

        return sucessResponse(res, HTTP_STATUS.CREATED, "Ticket created successfully", ticket);
    } catch (error) {
        console.error("Create Ticket Error:", error);
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get My Tickets (Tenant)
====================================================== */
export const getMyTickets = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { tenantId: req.user._id };
        if (status) query.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
        };

        const tickets = await Ticket.paginate(query, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Tickets fetched successfully", tickets);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get All Tickets (Admin)
====================================================== */
export const getAllTickets = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = {};
        if (status) query.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: { path: "tenantId", select: "name email phone" },
        };

        const tickets = await Ticket.paginate(query, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Tickets fetched successfully", tickets);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get Ticket by ID
====================================================== */
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("tenantId", "name email phone")
            .populate("messages.senderId", "name email role");

        if (!ticket) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Ticket not found");
        }

        // Tenants can only view their own tickets
        if (req.user.role === "tenant" && ticket.tenantId._id.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Access denied");
        }

        return sucessResponse(res, HTTP_STATUS.OK, "Ticket fetched successfully", ticket);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Add Message to Ticket (Tenant / Admin)
====================================================== */
export const addMessage = async (req, res) => {
    try {
        const { message } = req.body;

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Ticket not found");
        }

        if (ticket.status === "closed") {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Cannot add message to a closed ticket");
        }

        // Tenants can only message on their own tickets
        if (req.user.role === "tenant" && ticket.tenantId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Access denied");
        }

        ticket.messages.push({
            senderId: req.user._id,
            message,
        });

        await ticket.save();

        return sucessResponse(res, HTTP_STATUS.OK, "Message added successfully", ticket);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Close Ticket (Admin)
====================================================== */
export const closeTicket = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Ticket not found");
        }

        if (ticket.status === "closed") {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Ticket is already closed");
        }

        ticket.status = "closed";
        await ticket.save();

        return sucessResponse(res, HTTP_STATUS.OK, "Ticket closed successfully", ticket);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};
