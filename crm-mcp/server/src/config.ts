export const config = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  dbPath: process.env.DB_PATH ?? "./data/crm.db",
  /** If set, every /api and /mcp request must send "Authorization: Bearer <token>". */
  apiToken: process.env.API_TOKEN ?? "",
};
