# Housekeep MCP example

**View the Housekeep MCP site**: https://housekeep-mcp.netlify.app/

[![Netlify Status](https://api.netlify.com/api/v1/badges/7e2b1d49-4733-469b-9088-0ec71ce17dec/deploy-status)](https://app.netlify.com/projects/housekeep-mcp/deploys)

## What is this?

This repo shows a very a basic example of developing and running serverless MCP using Netlify Functions. It includes links to a deployed serverless function and an example of accessing the function using a customized URL.

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Docs: Netlify Functions](https://docs.netlify.com/functions/overview/?utm_campaign=dx-examples&utm_source=example-site&utm_medium=web&utm_content=example-mcp-serverless)
- [Agent Experience (AX)](https://agentexperience.ax?utm_source=serverless-mcp-guide&utm_medium=web&utm_content=example-mcp-serverless)

The MCP server provided here exposes three _tools_:

- `get-trades-services-summary` - returns a high-level summary of the trades services offered by Housekeep
- `get-trades-quote` - calls the Housekeep API `/trades-quote/` endpoint to get a quote for a trades job
- `create-booking-attempt` - calls the Housekeep API to create a booking attempt for a trades job

> Note that at the time of writing, it's only possible to create plumber, gardener or handyman bookings using the `create-booking-attempt` tool.

### Architecture

The MCP server is designed to be used with the Claude Desktop app (although it ought to work with other AI Clients, too). This diagram shows how the MCP server integrates with Claude Desktop.

![Screenshot 2025-06-04 at 13.01.25.png](..%2F..%2F..%2F..%2F..%2Fvar%2Ffolders%2Fbw%2F0_gw3t3d1634y8nnd0349_x80000gn%2FT%2FTemporaryItems%2FNSIRD_screencaptureui_2yu7jw%2FScreenshot%202025-06-04%20at%2013.01.25.png)

### Setting the MCP server up with Claude Desktop

To set up the MCP server with Claude Desktop, follow these steps:

1. Open the Claude Desktop app.
2. Open the settings, then click "Developer".
3. Click the "Edit Config" button. This will open the config file in a Finder window (on macOS).
4. Open the config file in a text editor and paste in the config below. Save the file and restart Claude Desktop.

```json
{
  "mcpServers": {
    "housekeep-mcp": {
      "command": "npx",
      "args": ["mcp-remote@next", "https://housekeep-mcp.netlify.app/mcp"]
    }
  }
}
```

## Development

Clone this repo to explore and run it locally.

```shell

# 1. Clone the examples repository to your local development environment
git clone git@github.com:mrmikardo/housekeep-mcp-netlify.git

# 2. Install the Netlify CLI to let you locally serve your site using Netlify's features
npm i -g netlify-cli

# 3. Serve your site using Netlify Dev to get local serverless functions
netlify dev

# 4. While the site is running locally, open a separate terminal tab to run the MCP inspector or client you desire
npx @modelcontextprotocol/inspector npx mcp-remote@next http://localhost:8888/mcp

```

Pushing to the `main` branch will automatically deploy your changes to Netlify.
