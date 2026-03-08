import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const propertySchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        rent: {
            type: Number,
            required: true,
        },
        deposit: {
            type: Number,
            default: 0,
        },
        amenities: {
            type: [String],
            default: [],
        },
        rules: {
            type: [String],
            default: [],
        },
        images: {
            type: [String],
            default: [],
        },
        availableFrom: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["draft", "review", "published", "rejected", "cancelled"],
            default: "review",
        },
    },
    { timestamps: true }
);

propertySchema.plugin(mongoosePaginate);

export default mongoose.model("Property", propertySchema);
