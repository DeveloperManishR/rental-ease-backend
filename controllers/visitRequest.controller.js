import VisitRequest from "../models/visitRequest.model.js";
import Property from "../models/property.model.js";
import {
    sucessResponse,
    errorResponse,
    HTTP_STATUS,
} from "../utils/response.js";

/* ======================================================
   Create Visit Request (Tenant)
====================================================== */
export const createVisitRequest = async (req, res) => {
    try {
        const { propertyId, preferredDate } = req.body;

        const parsedPreferredDate = new Date(preferredDate);
        if (Number.isNaN(parsedPreferredDate.getTime())) {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Invalid preferred date");
        }

        const preferredDay = new Date(
            parsedPreferredDate.getFullYear(),
            parsedPreferredDate.getMonth(),
            parsedPreferredDate.getDate()
        );
        const today = new Date();
        const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        if (preferredDay < todayDay) {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Preferred date cannot be in the past");
        }

        // Check property exists and is published
        const property = await Property.findById(propertyId);
        if (!property) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Property not found");
        }
        if (property.status !== "published") {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Property is not available for visits");
        }

        // Prevent duplicate visit requests
        const existingRequest = await VisitRequest.findOne({
            tenantId: req.user._id,
            propertyId,
            status: { $in: ["requested", "scheduled"] },
        });
        if (existingRequest) {
            return errorResponse(res, HTTP_STATUS.CONFLICT, "You already have an active visit request for this property");
        }

        const visitRequest = await VisitRequest.create({
            tenantId: req.user._id,
            propertyId,
            preferredDate: parsedPreferredDate,
            status: "requested",
        });

        return sucessResponse(res, HTTP_STATUS.CREATED, "Visit request created successfully", visitRequest);
    } catch (error) {
        console.error("Create Visit Request Error:", error);
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get My Visit Requests (Tenant)
====================================================== */
export const getMyVisitRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { tenantId: req.user._id };
        if (status) query.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: {
                path: "propertyId",
                select: "title city rent images",
            },
        };

        const visitRequests = await VisitRequest.paginate(query, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Visit requests fetched successfully", visitRequests);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get Visit Requests for Owner's Properties (Owner)
====================================================== */
export const getVisitRequestsForOwner = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        // Get all property IDs owned by this user
        const ownerProperties = await Property.find({ ownerId: req.user._id }).select("_id");
        const propertyIds = ownerProperties.map((p) => p._id);

        const query = { propertyId: { $in: propertyIds } };
        if (status) query.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: [
                { path: "propertyId", select: "title city rent" },
                { path: "tenantId", select: "name email phone" },
            ],
        };

        const visitRequests = await VisitRequest.paginate(query, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Visit requests fetched successfully", visitRequests);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Update Visit Request Status (Owner)
   Workflow: requested → scheduled → visited → decision
====================================================== */
export const updateVisitStatus = async (req, res) => {
    try {
        const { status, ownerNote } = req.body;

        const visitRequest = await VisitRequest.findById(req.params.id).populate("propertyId");

        if (!visitRequest) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Visit request not found");
        }

        // Check that the owner owns this property
        if (visitRequest.propertyId.ownerId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "You can only update visits for your own properties");
        }

        // Enforce status workflow
        const workflow = {
            requested: "scheduled",
            scheduled: "visited",
            visited: "decision",
        };

        const expectedNext = workflow[visitRequest.status];
        if (!expectedNext || status !== expectedNext) {
            return errorResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                `Cannot transition from "${visitRequest.status}" to "${status}". Expected next status: "${expectedNext || "none (terminal state)"}"`
            );
        }

        visitRequest.status = status;
        if (ownerNote !== undefined) visitRequest.ownerNote = ownerNote;
        await visitRequest.save();

        return sucessResponse(res, HTTP_STATUS.OK, "Visit status updated successfully", visitRequest);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};
