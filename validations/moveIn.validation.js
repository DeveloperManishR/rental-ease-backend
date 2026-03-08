import { z } from "zod";

export const createMoveInSchema = z.object({
    body: z.object({
        propertyId: z.string({ required_error: "Property ID is required" }),
    }),
});

export const updateMoveInSchema = z.object({
    body: z.object({
        agreementAccepted: z.boolean().optional(),
        inventoryList: z.array(z.string()).optional(),
    }),
});
