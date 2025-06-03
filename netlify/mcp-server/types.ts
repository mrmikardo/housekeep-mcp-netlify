import { z } from "zod";

export const TransformNumberSchema = z.string().transform((val) => {
    const num = Number(val);
    if (isNaN(num) || val === "") return "";
    return num;
});

export const MultiFormatDateSchema = z.string().nullable().transform((dateStr, ctx) => {
    // Handle null or empty inputs
    if (dateStr === null || dateStr === "" || dateStr === undefined) {
        return "";
    }

    // Try different parsing approaches
    let date: Date | null = null;

    // First try direct parsing
    date = new Date(dateStr);

    // If that fails, try some common manual parsing
    if (isNaN(date.getTime())) {
        // Handle formats like "1st June 2025", "21st June 2025"
        const ordinalRegex = /(\d{1,2})(st|nd|rd|th)\s+(\w+)\s+(\d{4})/i;
        const match = dateStr.match(ordinalRegex);

        if (match) {
            const [, day, , month, year] = match;
            const monthNames = [
                'january', 'february', 'march', 'april', 'may', 'june',
                'july', 'august', 'september', 'october', 'november', 'december'
            ];
            const monthIndex = monthNames.findIndex(m =>
                m.startsWith(month.toLowerCase())
            );

            if (monthIndex !== -1) {
                date = new Date(parseInt(year), monthIndex, parseInt(day));
            }
        }
    }

    if (!date || isNaN(date.getTime())) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unable to parse date: "${dateStr}"`,
        });
        return z.NEVER;
    }

    return date.toISOString().split('T')[0];
});


export const TradesQuoteRequestSchema = z.object({
    num_bedrooms: TransformNumberSchema.nullable().optional().transform((val) => val ?? ""),
    frequency: TransformNumberSchema.nullable().optional().transform((val) => val ?? ""),
    job_date: MultiFormatDateSchema.nullable().optional().transform((val) => val ?? ""),
    tasks_string_ids: z.array(
        z.literal("gardener-tasktype")
            .or(z.literal("plumber-tasktype"))
            .or(z.literal("handyman-tasktype"))
    ),
    tasks_hours: z.array(z.string().nullable()).nullable()
    // tasks_quantities: z.array(z.string().nullable()).nullable(),  // TODO: this is cheating.
});
