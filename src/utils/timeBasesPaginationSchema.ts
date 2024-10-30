import { z } from "zod";

export const timebasedPaginationSchema = z
    .object({
        from: z.preprocess((val) => (typeof val === "string" ? new Date(Date.parse(val)) : val), z.date()).optional(),
        limit: z.coerce.number().int().positive().optional(),
    })
    .strict()
    .refine(
        (data) => {
            if (!data.limit && data.from) return false;
            return true;
        },
        {
            message: "'From' date must be provided if 'limit' is provided",
            path: ["limit"],
        }
    );
