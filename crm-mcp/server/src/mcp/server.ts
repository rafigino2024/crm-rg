import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CrmService } from "../services/crm.ts";
import { leadFields, STAGES, taskFields, TASK_STATUSES } from "../services/types.ts";

/** Wraps a result as MCP tool output (JSON text + structured content). */
function ok(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function fail(err: unknown) {
  return {
    isError: true,
    content: [{ type: "text" as const, text: err instanceof Error ? err.message : String(err) }],
  };
}

/** Run a handler and turn thrown errors into MCP tool errors the model can read. */
function safe<A>(fn: (args: A) => unknown) {
  return async (args: A) => {
    try {
      return ok(await fn(args));
    } catch (e) {
      return fail(e);
    }
  };
}

const id = z.number().int().positive();

/**
 * Builds an MCP server exposing the CRM to AI agents.
 * Every write is recorded with actor = "ai" so the app can show what the AI did.
 */
export function createMcpServer(crm: CrmService): McpServer {
  const server = new McpServer(
    { name: "crm-rg", version: "0.1.0" },
    {
      instructions:
        "CRM for managing sales leads and follow-up tasks. " +
        "Use search_leads to find a lead's id before updating it. " +
        "Dates are YYYY-MM-DD. Pipeline stages: " + STAGES.join(" → ") + ".",
    },
  );

  // ----- Leads -----
  server.registerTool(
    "search_leads",
    {
      title: "Search leads",
      description: "List leads, optionally filtered by stage or a text search on name/company/email.",
      inputSchema: {
        stage: z.enum(STAGES).optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      },
      annotations: { readOnlyHint: true },
    },
    safe((a) => crm.listLeads(a)),
  );

  server.registerTool(
    "get_lead",
    {
      title: "Get lead details",
      description: "Get one lead with its tasks and activity history.",
      inputSchema: { lead_id: id },
      annotations: { readOnlyHint: true },
    },
    safe(({ lead_id }) => ({
      lead: crm.getLead(lead_id),
      tasks: crm.listTasks({ lead_id }),
      activities: crm.listActivities(lead_id),
    })),
  );

  server.registerTool(
    "create_lead",
    {
      title: "Create lead",
      description: "Add a new lead to the CRM.",
      inputSchema: leadFields,
    },
    safe((a) => crm.createLead(a, "ai")),
  );

  server.registerTool(
    "update_lead",
    {
      title: "Update lead",
      description: "Update fields of an existing lead (e.g. move it to another stage, set follow-up date).",
      inputSchema: { lead_id: id, ...partial(leadFields) },
      annotations: { idempotentHint: true },
    },
    safe(({ lead_id, ...rest }) => crm.updateLead(lead_id, rest, "ai")),
  );

  server.registerTool(
    "add_note",
    {
      title: "Add note to lead",
      description: "Record a note / call summary in the lead's activity history.",
      inputSchema: { lead_id: id, note: z.string().min(1) },
    },
    safe(({ lead_id, note }) => crm.logActivity(lead_id, "note", note, "ai")),
  );

  // ----- Tasks -----
  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description: "List tasks. Use due_before=today's date with status=Open to find what is due.",
      inputSchema: {
        lead_id: id.optional(),
        status: z.enum(TASK_STATUSES).optional(),
        due_before: z.string().optional().describe("YYYY-MM-DD, inclusive"),
      },
      annotations: { readOnlyHint: true },
    },
    safe((a) => crm.listTasks(a)),
  );

  server.registerTool(
    "create_task",
    {
      title: "Create task",
      description: "Create a follow-up task, optionally linked to a lead.",
      inputSchema: taskFields,
    },
    safe((a) => crm.createTask(a, "ai")),
  );

  server.registerTool(
    "complete_task",
    {
      title: "Complete task",
      description: "Mark a task as done.",
      inputSchema: { task_id: id },
      annotations: { idempotentHint: true },
    },
    safe(({ task_id }) => crm.updateTask(task_id, { status: "Done" }, "ai")),
  );

  // ----- Dashboard -----
  server.registerTool(
    "pipeline_summary",
    {
      title: "Pipeline summary",
      description: "Counts and value per stage, overdue tasks and follow-ups due today.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    safe(() => crm.pipelineSummary()),
  );

  // ----- Resource: read-only snapshot -----
  server.registerResource(
    "pipeline",
    "crm://pipeline/summary",
    { title: "Pipeline summary", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(crm.pipelineSummary()) }],
    }),
  );

  // ----- Prompt: daily briefing -----
  server.registerPrompt(
    "daily_briefing",
    { title: "Daily briefing", description: "Plan the sales day from the CRM data." },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              "Using the CRM tools: call pipeline_summary, then list_tasks with status=Open and " +
              "due_before=today. Give me a short prioritized plan for today: overdue tasks first, " +
              "then follow-ups, then high-priority leads in Proposal stage.",
          },
        },
      ],
    }),
  );

  return server;
}

/** Make every zod field in a shape optional (for update tools). */
function partial<T extends Record<string, z.ZodTypeAny>>(shape: T) {
  return Object.fromEntries(Object.entries(shape).map(([k, v]) => [k, v.optional()])) as {
    [K in keyof T]: z.ZodOptional<T[K]>;
  };
}
