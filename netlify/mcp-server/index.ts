import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";

const HOUSEKEEP_API_BASE = "https://housekeep.com/api/v1"

// TODO: pull this into a types file.

const TransformNumberSchema = z.string().transform((val) => {
    const num = Number(val);
    if (isNaN(num) || val === "") return "";
    return num;
});

const MultiFormatDateSchema = z.string().nullable().transform((dateStr, ctx) => {
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


const TradesQuoteRequestSchema = z.object({
  num_bedrooms: TransformNumberSchema.nullable().optional().transform((val) => val ?? ""),
  frequency: TransformNumberSchema.nullable().optional().transform((val) => val ?? ""),
  job_date: MultiFormatDateSchema.nullable().optional().transform((val) => val ?? ""),
  tasks_string_ids: z.array(
      z.literal("gardener-tasktype")
          .or(z.literal("plumber-tasktype"))
          .or(z.literal("handyman-tasktype"))
  ),
  tasks_hours: z.array(z.string().nullable()).nullable(),
  tasks_quantities: z.array(z.string().nullable()).nullable(),
});


export const setupMCPServer = (): McpServer => {

  const server = new McpServer(
    {
      name: "stateless-server",
      version: "1.0.0",
    },
    { capabilities: { logging: {} } }
  );

  server.tool(
    "get-trades-services-summary",
    "Get a summary of trades services available from Housekeep",
    {},
    async (req): Promise<CallToolResult> => {
      const response = await fetch(`${HOUSEKEEP_API_BASE}/work/tradespeople/v3/`);

      if (!response.ok) {
        throw new Error(`Failed to fetch trades services summary: ${response.statusText}`);
      }

      const data = await response.json()
      const text = data.sub_items
          .map(subItem => `Name: ${subItem.name}\nString identifier: ${subItem.string_identifier}`)
          .join('\n---\n')

      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
      };
    }
  )

  server.tool(
    "get-trades-quote",
    "Get a quote for a specific trade service from Housekeep",
    {
      parameters: TradesQuoteRequestSchema,
    },
    async (req): Promise<CallToolResult> => {
      const { num_bedrooms, frequency, job_date, tasks_string_ids, tasks_hours, tasks_quantities } = req.parameters;

      console.log(req.parameters);

      const params = new URLSearchParams();
      params.append("num_bedrooms", String(num_bedrooms));
      params.append("frequency", String(frequency));
      params.append("job_date", job_date);
      params.append("tasks_string_ids", tasks_string_ids.join(","));
      params.append("tasks_hours", tasks_hours.join(","));
      params.append("tasks_quantities", tasks_quantities.join(","));

      console.log(params.toString());

      const response = await fetch(`${HOUSEKEEP_API_BASE}/trades-quote/?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch trades quote: ${response.statusText}`);
      }

      const text = await response.json()

      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
      };
    }
  )

  return server;
};
