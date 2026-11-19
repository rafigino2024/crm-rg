import { config } from "./config.ts";
import { openDatabase } from "./db/database.ts";
import { CrmService } from "./services/crm.ts";
import { createApp } from "./app.ts";

const crm = new CrmService(openDatabase(config.dbPath));
createApp(crm, { apiToken: config.apiToken }).listen(config.port, config.host, () => {
  console.log(`CRM server on http://localhost:${config.port}`);
  console.log(`  REST API : /api   (Flutter app)`);
  console.log(`  MCP      : /mcp   (AI agents, Streamable HTTP)`);
  if (!config.apiToken) console.log("  ⚠ API_TOKEN not set - no auth");
});
