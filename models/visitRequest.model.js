import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const visitRequestSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
        preferredDate: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["requested", "scheduled", "visited", "decision"],
            default: "requested",
        },
        ownerNote: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

visitRequestSchema.plugin(mongoosePaginate);

export default mongoose.model("VisitRequest", visitRequestSchema);
