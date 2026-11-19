// MCP over stdio, for local clients like Claude Desktop / Claude Code.
// Logs must go to stderr - stdout carries the protocol.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config.ts";
import { openDatabase } from "./db/database.ts";
import { CrmService } from "./services/crm.ts";
import { createMcpServer } from "./mcp/server.ts";

const server = createMcpServer(new CrmService(openDatabase(config.dbPath)));
await server.connect(new StdioServerTransport());
console.error("crm-rg MCP server running on stdio");
