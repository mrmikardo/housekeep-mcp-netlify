import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  CallToolResult,
  ReadResourceRequest,
} from '@modelcontextprotocol/sdk/types.js';
import {
  BookingAttemptCreationDictSchema,
  TradesQuoteRequestSchema,
} from './types';

const HOUSEKEEP_API_BASE = 'https://housekeep.com/api/v1';

export const setupMCPServer = (): McpServer => {
  const server = new McpServer(
    {
      name: 'housekeep-mcp-server',
      version: '1.0.0',
    },
    { capabilities: { logging: {} } }
  );

  server.tool(
    'get-trades-services-summary',
    'Get a summary of trades services available from Housekeep',
    {},
    async (req): Promise<CallToolResult> => {
      const response = await fetch(
        `${HOUSEKEEP_API_BASE}/work/tradespeople/v3/`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch trades services summary: ${response.statusText}`
        );
      }

      const data = await response.json();
      const text = data.sub_items
        .map(
          (subItem) =>
            `Name: ${subItem.name}\nString identifier: ${subItem.string_identifier}`
        )
        .join('\n---\n');

      return {
        content: [
          {
            type: 'text',
            text,
          },
        ],
      };
    }
  );

  server.tool(
    'get-trades-quote',
    'Get a quote for a specific trade service from Housekeep',
    {
      parameters: TradesQuoteRequestSchema,
    },
    async (req): Promise<CallToolResult> => {
      const {
        num_bedrooms,
        frequency,
        job_date,
        tasks_string_ids,
        tasks_hours,
        tasks_quantities,
      } = req.parameters;

      console.log(req.parameters);

      const params = new URLSearchParams();
      params.append('num_bedrooms', String(num_bedrooms));
      params.append('frequency', String(frequency));
      params.append('job_date', job_date);
      params.append('tasks_string_ids', tasks_string_ids.join(','));
      params.append('tasks_hours', tasks_hours.join(','));
      params.append('tasks_quantities', '');

      console.log(params.toString());

      const response = await fetch(
        `${HOUSEKEEP_API_BASE}/trades-quote/?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch trades quote: ${response.statusText}`);
      }

      const text = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(text, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'using-get-trades-quote',
    'housekeep://using-get-trades-quote',
    { mimeType: 'text/plain' },
    async (req): Promise<ReadResourceRequest> => {
      return {
        contents: [
          {
            uri: 'housekeep://using-get-trades-quote',
            text:
              'To use the get-trades-quote tool, you must pass a `tasks_string_ids` argument.' +
              'This is a list of task type identifiers from Housekeep. ' +
              'For gardening jobs, the identifier is `gardener-tasktype`.' +
              'For plumbing jobs, it is `plumber-tasktype`.' +
              'For handyman jobs, it is `handyman-tasktype`. ',
          },
        ],
      };
    }
  );

  server.tool(
    'create-booking-attempt',
    'Create a booking attempt for a trades service from Housekeep',
    {
      parameters: BookingAttemptCreationDictSchema,
    },
    async (req): Promise<CallToolResult> => {
      // const { bedrooms, city, email, free_parking_available, frequency, garden_waste_disposal, line_1, line_2, name, postcode, property_type, special_instructions, tasks, telephone, garden_size, terms_and_conditions_consent, remarketing_consent, start_time, primary_task_type, first_clean_request } = req.parameters;

      console.log(req.parameters);
      console.log(JSON.stringify(req.parameters));

      const reqBody = req.parameters;
      reqBody.start_time = {
        start: '09:00:00',
        end: '15:00:00',
        type: 'custom',
        is_flexible: false,
      };

      console.log(JSON.stringify(reqBody, null, 2));

      const response = await fetch(
        `${HOUSEKEEP_API_BASE}/booking/?booking_type=trades&booking_attempt_token=/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reqBody),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create booking attempt: ${response.statusText}`
        );
      }

      const text = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(text, null, 2),
          },
        ],
      };
    }
  );

  server.resource(
    'using-create-booking-attempt',
    'housekeep://using-create-booking-attempt',
    { mimeType: 'text/plain' },
    async (req): Promise<ReadResourceRequest> => {
      return {
        contents: [
          {
            uri: 'housekeep://using-create-booking-attempt',
            text:
              'To use the create-booking-attempt tool, you must pass an object containing various ' +
              "fields. This object is broadly described by the tool's parameters. There are a few " +
              'considerations to note: ' +
              '1. `garden_waste_disposal` is only required for gardening jobs. ' +
              '2. `garden_size` is only required for gardening jobs. ' +
              '3. `first_clean_request` is the date that the customer wishes to book the service for.' +
              '    It must be a date string in the format YYYY-MM-DD.' +
              '4. All jobs except for gardening jobs can only be One-off jobs. You only need to set ' +
              '`frequency` to greater than One-off if the job is a gardening job. ',
          },
        ],
      };
    }
  );

  return server;
};
