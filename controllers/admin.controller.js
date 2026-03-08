import User from "../models/user.model.js";
import Property from "../models/property.model.js";
import VisitRequest from "../models/visitRequest.model.js";
import Ticket from "../models/ticket.model.js";
import {
    sucessResponse,
    errorResponse,
    HTTP_STATUS,
} from "../utils/response.js";

/* ======================================================
   Dashboard Stats (Admin)
====================================================== */
export const getDashboardStats = async (req, res) => {
    try {
        const [totalTenants, totalOwners, totalProperties, totalVisitRequests, totalTickets, openTickets] =
            await Promise.all([
                User.countDocuments({ role: "tenant" }),
                User.countDocuments({ role: "owner" }),
                Property.countDocuments(),
                VisitRequest.countDocuments(),
                Ticket.countDocuments(),
                Ticket.countDocuments({ status: "open" }),
            ]);

        const propertyStats = {
            review: await Property.countDocuments({ status: "review" }),
            published: await Property.countDocuments({ status: "published" }),
            rejected: await Property.countDocuments({ status: "rejected" }),
            cancelled: await Property.countDocuments({ status: "cancelled" }),
        };

        // Recent 5 properties pending review
        const pendingReview = await Property.find({ status: "review" })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("ownerId", "name email");

        const stats = {
            totalTenants,
            totalOwners,
            totalProperties,
            totalVisitRequests,
            totalTickets,
            openTickets,
            propertyStats,
            pendingReview,
        };

        return sucessResponse(res, HTTP_STATUS.OK, "Dashboard stats fetched successfully", stats);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get All Users (Admin – paginated)
====================================================== */
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;

        const query = {};
        if (role) query.role = role;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            select: "-password -refreshToken -__v",
        };

        const users = await User.paginate(query, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Users fetched successfully", users);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get All Properties (Admin – all statuses, paginated)
====================================================== */
export const getAllProperties = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = {};
        if (status) query.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: { path: "ownerId", select: "name email phone" },
        };

        const properties = await Property.paginate(query, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Properties fetched successfully", properties);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get Single Property (Admin)
====================================================== */
export const getPropertyByIdForAdmin = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id).populate(
            "ownerId",
            "name email phone"
        );

        if (!property) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Property not found");
        }

        return sucessResponse(res, HTTP_STATUS.OK, "Property fetched successfully", property);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
    Review Property (Admin) – Approve → published / Reject → cancelled
====================================================== */
export const reviewProperty = async (req, res) => {
    try {
        const { action } = req.body; // "approve" or "reject"

        if (!["approve", "reject"].includes(action)) {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Action must be "approve" or "reject"');
        }

        const property = await Property.findById(req.params.id);

        if (!property) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Property not found");
        }

        if (property.status !== "review") {
            return errorResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                `Cannot review property with status "${property.status}". Only properties in "review" status can be reviewed.`
            );
        }

        property.status = action === "approve" ? "published" : "cancelled";
        await property.save();

        const message =
            action === "approve"
                ? "Property approved and published successfully"
                : "Property rejected and moved to cancelled status";

        return sucessResponse(res, HTTP_STATUS.OK, message, property);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};
