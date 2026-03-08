import MoveIn from "../models/moveIn.model.js";
import Property from "../models/property.model.js";
import {
    sucessResponse,
    errorResponse,
    HTTP_STATUS,
} from "../utils/response.js";
import { uploadFileToCloudinary } from "../config/cloudinary.js";

/* ======================================================
   Create Move-In (Tenant)
====================================================== */
export const createMoveIn = async (req, res) => {
    try {
        const { propertyId } = req.body;

        // Check property exists and is published
        const property = await Property.findById(propertyId);
        if (!property) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Property not found");
        }
        if (property.status !== "published") {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Property is not available");
        }

        // Check for existing move-in
        const existingMoveIn = await MoveIn.findOne({
            tenantId: req.user._id,
            propertyId,
        });
        if (existingMoveIn) {
            return errorResponse(res, HTTP_STATUS.CONFLICT, "Move-in already exists for this property");
        }

        const moveIn = await MoveIn.create({
            tenantId: req.user._id,
            propertyId,
        });

        return sucessResponse(res, HTTP_STATUS.CREATED, "Move-in created successfully", moveIn);
    } catch (error) {
        console.error("Create MoveIn Error:", error);
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get My Move-Ins (Tenant)
====================================================== */
export const getMyMoveIns = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: {
                path: "propertyId",
                select: "title city rent images",
            },
        };

        const moveIns = await MoveIn.paginate({ tenantId: req.user._id }, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Move-ins fetched successfully", moveIns);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get Move-In by Property (Owner / Admin)
====================================================== */
export const getMoveInByProperty = async (req, res) => {
    try {
        const { propertyId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // If owner, verify they own the property
        if (req.user.role === "owner") {
            const property = await Property.findById(propertyId);
            if (!property || property.ownerId.toString() !== req.user._id.toString()) {
                return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Access denied");
            }
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
            populate: [
                { path: "tenantId", select: "name email phone" },
                { path: "propertyId", select: "title city rent" },
            ],
        };

        const moveIns = await MoveIn.paginate({ propertyId }, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Move-ins fetched successfully", moveIns);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get Move-In by ID (Tenant)
====================================================== */
export const getMoveInById = async (req, res) => {
    try {
        const moveIn = await MoveIn.findById(req.params.id)
            .populate("propertyId", "title city rent images ownerId")
            .populate("tenantId", "name email phone");

        if (!moveIn) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Move-in not found");
        }

        // Tenant can only view their own
        if (req.user.role === "tenant" && moveIn.tenantId._id.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Access denied");
        }

        return sucessResponse(res, HTTP_STATUS.OK, "Move-in fetched successfully", moveIn);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Upload Documents (Tenant) – via Cloudinary
====================================================== */
export const uploadDocuments = async (req, res) => {
    try {
        const moveIn = await MoveIn.findById(req.params.id);

        if (!moveIn) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Move-in not found");
        }

        if (moveIn.tenantId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Access denied");
        }

        // Expect files from multer (memory storage)
        if (!req.files || req.files.length === 0) {
            return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "No files uploaded");
        }

        const newDocuments = [];
        for (const file of req.files) {
            const result = await uploadFileToCloudinary(file.buffer, "move_in_documents");
            newDocuments.push({
                name: file.originalname,
                fileUrl: result.secure_url,
            });
        }

        moveIn.documents.push(...newDocuments);
        await moveIn.save();

        return sucessResponse(res, HTTP_STATUS.OK, "Documents uploaded successfully", moveIn);
    } catch (error) {
        console.error("Upload Documents Error:", error);
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Accept Agreement (Tenant)
====================================================== */
export const acceptAgreement = async (req, res) => {
    try {
        const moveIn = await MoveIn.findById(req.params.id);

        if (!moveIn) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Move-in not found");
        }

        if (moveIn.tenantId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Access denied");
        }

        moveIn.agreementAccepted = true;
        await moveIn.save();

        return sucessResponse(res, HTTP_STATUS.OK, "Agreement accepted successfully", moveIn);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Update Inventory List (Tenant)
====================================================== */
export const updateInventory = async (req, res) => {
    try {
        const { inventoryList } = req.body;

        const moveIn = await MoveIn.findById(req.params.id);

        if (!moveIn) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Move-in not found");
        }

        if (moveIn.tenantId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "Access denied");
        }

        moveIn.inventoryList = inventoryList || [];
        await moveIn.save();

        return sucessResponse(res, HTTP_STATUS.OK, "Inventory updated successfully", moveIn);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};
