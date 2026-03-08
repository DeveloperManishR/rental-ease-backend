import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const documentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const moveInSchema = new mongoose.Schema(
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
        documents: {
            type: [documentSchema],
            default: [],
        },
        agreementAccepted: {
            type: Boolean,
            default: false,
        },
        inventoryList: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

moveInSchema.plugin(mongoosePaginate);

export default mongoose.model("MoveIn", moveInSchema);
