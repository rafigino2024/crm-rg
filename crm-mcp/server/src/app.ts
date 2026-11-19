import express, { type RequestHandler } from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createRestRouter } from "./api/rest.ts";
import { createMcpServer } from "./mcp/server.ts";
import type { CrmService } from "./services/crm.ts";

function bearerAuth(token: string): RequestHandler {
  return (req, res, next) => {
    if (!token || req.headers.authorization === `Bearer ${token}`) return next();
    res.status(401).json({ error: "unauthorized" });
  };
}

/** One Express app serving both the REST API (/api) and the MCP endpoint (/mcp). */
export function createApp(crm: CrmService, opts: { apiToken?: string } = {}) {
  const app = express();
  app.use(cors({ exposedHeaders: ["Mcp-Session-Id"] }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  const auth = bearerAuth(opts.apiToken ?? "");
  app.use("/api", auth, createRestRouter(crm));

  // Stateless Streamable HTTP: a fresh MCP server + transport per request.
  app.post("/mcp", auth, async (req, res) => {
    const server = createMcpServer(crm);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP error", err);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
      }
    }
  });
  const notAllowed: RequestHandler = (_req, res) => {
    res.status(405).json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed" }, id: null });
  };
  app.get("/mcp", notAllowed);
  app.delete("/mcp", notAllowed);

  return app;
}
