import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CallToolResult,
  GetPromptResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";

const HOUSEKEEP_API_BASE = "https://housekeep.com/api/v1"


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

  return server;
};
