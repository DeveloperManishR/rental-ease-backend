import Property from "../models/property.model.js";
import {
    sucessResponse,
    errorResponse,
    HTTP_STATUS,
} from "../utils/response.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.js";

/**
 * Extract Cloudinary public_id from a secure_url
 * e.g. https://res.cloudinary.com/ddvcqabqr/image/upload/v17.../property_images/abc123.jpg
 *  → property_images/abc123
 */
const getPublicId = (url) => {
    try {
        const parts = url.split("/upload/");
        if (parts.length < 2) return null;
        const afterUpload = parts[1]; // e.g. "v1234/property_images/abc123.jpg"
        const withoutVersion = afterUpload.replace(/^v\d+\//, ""); // "property_images/abc123.jpg"
        const withoutExt = withoutVersion.replace(/\.[^.]+$/, ""); // "property_images/abc123"
        return withoutExt;
    } catch {
        return null;
    }
};

/* ======================================================
   Create Property (Owner)
====================================================== */
export const createProperty = async (req, res) => {
    try {
        const {
            title, description, location, city,
            rent, deposit, amenities, rules, availableFrom,
        } = req.body;

        // Upload images to Cloudinary
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            if (req.files.length > 4) {
                return errorResponse(res, HTTP_STATUS.BAD_REQUEST, "Maximum 4 images allowed");
            }
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer);
                imageUrls.push(result.secure_url);
            }
        }

        // Parse arrays if they come as JSON strings from FormData
        const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities || "[]") : amenities || [];
        const parsedRules = typeof rules === "string" ? JSON.parse(rules || "[]") : rules || [];

        const property = await Property.create({
            ownerId: req.user._id,
            title,
            description,
            location,
            city,
            rent: Number(rent),
            deposit: Number(deposit || 0),
            amenities: parsedAmenities,
            rules: parsedRules,
            images: imageUrls,
            availableFrom,
            status: "draft",
        });

        return sucessResponse(res, HTTP_STATUS.CREATED, "Property created successfully", property);
    } catch (error) {
        console.error("Create Property Error:", error);
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get My Properties (Owner)
====================================================== */
export const getMyProperties = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const query = { ownerId: req.user._id };
        if (status) query.status = status;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 },
        };

        const properties = await Property.paginate(query, options);

        return sucessResponse(res, HTTP_STATUS.OK, "Properties fetched successfully", properties);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Get All Published Properties (Tenant / Public)
====================================================== */
export const getAllPublishedProperties = async (req, res) => {
    try {
        const { page = 1, limit = 10, city, minRent, maxRent, availableFrom } = req.query;

        const query = { status: "published" };

        if (city) query.city = { $regex: city, $options: "i" };
        if (minRent || maxRent) {
            query.rent = {};
            if (minRent) query.rent.$gte = Number(minRent);
            if (maxRent) query.rent.$lte = Number(maxRent);
        }
        if (availableFrom) {
            query.availableFrom = { $lte: new Date(availableFrom) };
        }

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
   Get Property by ID
====================================================== */
export const getPropertyById = async (req, res) => {
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
   Update Property (Owner)
====================================================== */
export const updateProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Property not found");
        }

        if (property.ownerId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "You can only update your own properties");
        }

        // --- Handle images ---
        let finalImages = [...property.images]; // start with existing

        // Parse existingImages from body (images the user chose to keep)
        if (req.body.existingImages !== undefined) {
            const kept = typeof req.body.existingImages === "string"
                ? JSON.parse(req.body.existingImages || "[]")
                : req.body.existingImages || [];

            // Delete removed images from Cloudinary
            const removedImages = property.images.filter((url) => !kept.includes(url));
            for (const url of removedImages) {
                const publicId = getPublicId(url);
                if (publicId) await deleteFromCloudinary(publicId);
            }

            finalImages = kept;
        }

        // Upload new images
        if (req.files && req.files.length > 0) {
            const totalImages = finalImages.length + req.files.length;
            if (totalImages > 4) {
                return errorResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    `Maximum 4 images allowed. You have ${finalImages.length} existing + ${req.files.length} new = ${totalImages}`
                );
            }
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer);
                finalImages.push(result.secure_url);
            }
        }

        // --- Handle other fields ---
        const allowedFields = [
            "title", "description", "location", "city",
            "rent", "deposit", "amenities", "rules", "availableFrom",
        ];

        const updateData = { images: finalImages };

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === "rent" || field === "deposit") {
                    updateData[field] = Number(req.body[field]);
                } else if (field === "amenities" || field === "rules") {
                    updateData[field] = typeof req.body[field] === "string"
                        ? JSON.parse(req.body[field] || "[]")
                        : req.body[field];
                } else {
                    updateData[field] = req.body[field];
                }
            }
        }

        const updatedProperty = await Property.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        return sucessResponse(res, HTTP_STATUS.OK, "Property updated successfully", updatedProperty);
    } catch (error) {
        console.error("Update Property Error:", error);
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Delete Property (Owner)
====================================================== */
export const deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Property not found");
        }

        if (property.ownerId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "You can only delete your own properties");
        }

        // Clean up Cloudinary images
        for (const url of property.images) {
            const publicId = getPublicId(url);
            if (publicId) await deleteFromCloudinary(publicId);
        }

        await Property.findByIdAndDelete(req.params.id);

        return sucessResponse(res, HTTP_STATUS.OK, "Property deleted successfully");
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};

/* ======================================================
   Submit Property for Review (Owner)
====================================================== */
export const submitForReview = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return errorResponse(res, HTTP_STATUS.NOT_FOUND, "Property not found");
        }

        if (property.ownerId.toString() !== req.user._id.toString()) {
            return errorResponse(res, HTTP_STATUS.FORBIDDEN, "You can only submit your own properties");
        }

        if (!["draft", "rejected"].includes(property.status)) {
            return errorResponse(
                res,
                HTTP_STATUS.BAD_REQUEST,
                `Cannot submit property with status "${property.status}". Only draft or rejected properties can be submitted.`
            );
        }

        property.status = "review";
        await property.save();

        return sucessResponse(res, HTTP_STATUS.OK, "Property submitted for review", property);
    } catch (error) {
        return errorResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
};
