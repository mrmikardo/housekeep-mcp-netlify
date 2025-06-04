import { z } from 'zod';

export const TransformNumberSchema = z.string().transform((val) => {
  const num = Number(val);
  if (isNaN(num) || val === '') return '';
  return num;
});

export const MultiFormatDateSchema = z
  .string()
  .nullable()
  .transform((dateStr, ctx) => {
    // Handle null or empty inputs
    if (dateStr === null || dateStr === '' || dateStr === undefined) {
      return '';
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
          'january',
          'february',
          'march',
          'april',
          'may',
          'june',
          'july',
          'august',
          'september',
          'october',
          'november',
          'december',
        ];
        const monthIndex = monthNames.findIndex((m) =>
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

const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const TradesQuoteRequestSchema = z.object({
  num_bedrooms: TransformNumberSchema.nullable()
    .optional()
    .transform((val) => val ?? ''),
  frequency: TransformNumberSchema.nullable()
    .optional()
    .transform((val) => val ?? ''),
  job_date: MultiFormatDateSchema.nullable()
    .optional()
    .transform((val) => val ?? ''),
  tasks_string_ids: z.array(
    z
      .literal('gardener-tasktype')
      .or(z.literal('plumber-tasktype'))
      .or(z.literal('handyman-tasktype'))
  ),
  tasks_hours: z.array(z.string().nullable()).nullable(),
  // tasks_quantities: z.array(z.string().nullable()).nullable(),  // TODO: this is cheating.
});

const TaskDictSchema = z.object({
  type: z.string(),
  hours: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? ''),
});

export const BookingAttemptCreationDictSchema = z.object({
  // bedrooms: z.string().nullable(),  // Not required for gardening, handyman or plumber jobs
  city: z.string(),
  email: z.string().email(),
  free_parking_available: z.literal('Yes').or(z.literal('No')),
  frequency: z
    .enum(['One-off', 'Weekly', 'Fortnightly', 'Threeweekly', 'Fourweekly'])
    .default('One-off'),
  garden_waste_disposal: z.boolean().nullable().optional(),
  line_1: z.string(),
  line_2: z.string(),
  name: z.string(),
  postcode: z.string(),
  property_type: z.enum(['flat', 'house']),
  special_instructions: z.string().nullable(),
  tasks: z.array(TaskDictSchema),
  telephone: z.string(),
  garden_size: z
    .enum([
      'Small (up to 30m²)',
      'Medium (31m² to 70m²)',
      'Large (71m² to over 120m²)',
    ])
    .optional(),
  terms_and_conditions_consent: z.boolean().default(true),
  remarketing_consent: z.boolean().default(true),
  // start_time: z.record(z.unknown()),
  primary_task_type: z.literal('trades'),
  first_clean_request: DateSchema,
});
