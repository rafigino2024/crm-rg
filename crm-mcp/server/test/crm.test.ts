import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { openDatabase } from "../src/db/database.ts";
import { CrmService } from "../src/services/crm.ts";
import { createApp } from "../src/app.ts";

const TOKEN = "test-token";
let crm: CrmService;
let http: Server;
let base: string;

before(async () => {
  crm = new CrmService(openDatabase(":memory:"));
  http = createApp(crm, { apiToken: TOKEN }).listen(0);
  await new Promise((r) => http.once("listening", r));
  base = `http://127.0.0.1:${(http.address() as AddressInfo).port}`;
});
after(() => http.close());

const api = (path: string, init: RequestInit = {}) =>
  fetch(base + "/api" + path, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${TOKEN}`, ...init.headers },
  });

test("service: stage change is logged as activity", () => {
  const lead = crm.createLead({ name: "Svc" });
  crm.updateLead(lead.id, { stage: "Contacted" }, "ai");
  const acts = crm.listActivities(lead.id);
  assert.equal(acts[0].type, "stage_changed");
  assert.equal(acts[0].actor, "ai");
  assert.equal(acts[0].old_value, "New");
  assert.equal(acts[0].new_value, "Contacted");
});

test("service: add_note on missing lead fails cleanly", () => {
  assert.throws(() => crm.logActivity(987654, "note", "x"), /not found/);
});

test("rest: auth required", async () => {
  const res = await fetch(base + "/api/leads");
  assert.equal(res.status, 401);
});

test("rest: create, update, validate, 404", async () => {
  let res = await api("/leads", { method: "POST", body: JSON.stringify({ name: "Rest Lead", company: "Acme" }) });
  assert.equal(res.status, 201);
  const lead = await res.json();
  assert.equal(lead.stage, "New");

  res = await api(`/leads/${lead.id}`, { method: "PATCH", body: JSON.stringify({ stage: "Won" }) });
  assert.equal((await res.json()).stage, "Won");

  res = await api("/leads", { method: "POST", body: JSON.stringify({ name: "" }) });
  assert.equal(res.status, 400);

  res = await api("/leads/99999");
  assert.equal(res.status, 404);
});

test("rest: chat validates the conversation", async () => {
  const res = await api("/chat", { method: "POST", body: JSON.stringify({ messages: [] }) });
  assert.equal(res.status, 400);
  const res2 = await api("/chat", {
    method: "POST",
    body: JSON.stringify({ messages: [{ role: "assistant", content: "hi" }] }),
  });
  assert.equal(res2.status, 400);
});

test("mcp: list tools and call them end-to-end", async () => {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(
    new StreamableHTTPClientTransport(new URL(base + "/mcp"), {
      requestInit: { headers: { authorization: `Bearer ${TOKEN}` } },
    }),
  );

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  for (const n of ["search_leads", "create_lead", "update_lead", "create_task", "pipeline_summary"]) {
    assert.ok(names.includes(n), `missing tool ${n}`);
  }

  const created = await client.callTool({
    name: "create_lead",
    arguments: { name: "From AI", company: "Claude Co", estimated_value: 5000 },
  });
  const lead = JSON.parse((created.content as { text: string }[])[0].text);
  assert.equal(lead.name, "From AI");

  const task = await client.callTool({
    name: "create_task",
    arguments: { title: "Call back", lead_id: lead.id, due_date: "2026-01-01" },
  });
  assert.ok(!task.isError);

  const missing = await client.callTool({ name: "get_lead", arguments: { lead_id: 424242 } });
  assert.equal(missing.isError, true);

  // The write made through MCP is visible to the Flutter-facing REST API, attributed to the AI.
  const acts = await (await api(`/leads/${lead.id}/activities`)).json();
  assert.ok(acts.every((a: { actor: string }) => a.actor === "ai"));

  const prompts = await client.listPrompts();
  assert.equal(prompts.prompts[0].name, "daily_briefing");
  await client.close();
});
