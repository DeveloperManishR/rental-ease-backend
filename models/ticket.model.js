import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
    {
        tenantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        messages: {
            type: [messageSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ["open", "closed"],
            default: "open",
        },
    },
    { timestamps: true }
);

ticketSchema.plugin(mongoosePaginate);

export default mongoose.model("Ticket", ticketSchema);
