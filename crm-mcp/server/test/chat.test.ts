import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { openDatabase } from "../src/db/database.ts";
import { CrmService } from "../src/services/crm.ts";
import { ChatService } from "../src/ai/chat.ts";

type Block = Record<string, unknown>;

/** An Anthropic client whose HTTP layer replays scripted assistant turns. */
function scriptedClient(turns: { content: Block[]; stop_reason: string }[], requests: Record<string, any>[]) {
  let i = 0;
  const fakeFetch = async (_url: string | URL | Request, init?: RequestInit) => {
    requests.push(JSON.parse(String(init?.body)));
    const turn = turns[i++];
    if (!turn) throw new Error("unexpected extra request");
    const body = {
      id: `msg_${i}`,
      type: "message",
      role: "assistant",
      model: "claude-opus-5-5",
      content: turn.content,
      stop_reason: turn.stop_reason,
      stop_sequence: null,
      stop_details: null,
      usage: { input_tokens: 10, output_tokens: 10 },
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };
  return new Anthropic({ apiKey: "test-key", fetch: fakeFetch as typeof fetch, maxRetries: 0 });
}

test("chat: Claude searches, updates a lead via MCP tools, and replies", async () => {
  const crm = new CrmService(openDatabase(":memory:"));
  const lead = crm.createLead({ name: "יוסי לוי", company: "בטא" });

  const requests: Record<string, any>[] = [];
  const client = scriptedClient(
    [
      {
        stop_reason: "tool_use",
        content: [{ type: "tool_use", id: "tu_1", name: "search_leads", input: { search: "יוסי" } }],
      },
      {
        stop_reason: "tool_use",
        content: [{ type: "tool_use", id: "tu_2", name: "update_lead", input: { lead_id: lead.id, stage: "Proposal" } }],
      },
      { stop_reason: "end_turn", content: [{ type: "text", text: "העברתי את יוסי לוי לשלב הצעת מחיר." }] },
    ],
    requests,
  );

  const res = await new ChatService(crm, client).chat({
    messages: [{ role: "user", content: "תעביר את יוסי להצעת מחיר" }],
  });

  assert.equal(res.reply, "העברתי את יוסי לוי לשלב הצעת מחיר.");
  assert.deepEqual(
    res.actions.map((a) => a.tool),
    ["search_leads", "update_lead"],
  );
  assert.equal(res.changed_data, true);

  // The change really happened, attributed to the AI.
  assert.equal(crm.getLead(lead.id).stage, "Proposal");
  assert.equal(crm.listActivities(lead.id)[0].actor, "ai");

  // Request shape: MCP tools exposed, model, fallback enabled, tool results fed back.
  const first = requests[0];
  assert.equal(first.model, "claude-opus-5-5");
  assert.equal(first.fallbacks, "default");
  assert.ok(first.tools.some((t: { name: string }) => t.name === "update_lead"));
  const last = JSON.stringify(requests[2]);
  assert.match(last, /tool_result/);
  assert.match(last, /tu_2/);
});

test("chat: tool errors are reported back to Claude and flagged", async () => {
  const crm = new CrmService(openDatabase(":memory:"));
  const requests: Record<string, any>[] = [];
  const client = scriptedClient(
    [
      { stop_reason: "tool_use", content: [{ type: "tool_use", id: "tu_1", name: "get_lead", input: { lead_id: 999 } }] },
      { stop_reason: "end_turn", content: [{ type: "text", text: "לא מצאתי ליד כזה." }] },
    ],
    requests,
  );
  const res = await new ChatService(crm, client).chat({ messages: [{ role: "user", content: "פרטי ליד 999" }] });
  assert.equal(res.actions[0].is_error, true);
  assert.equal(res.changed_data, false);
  assert.match(JSON.stringify(requests[1]), /"is_error":true/);
});

test("chat: refusal gets a polite reply", async () => {
  const crm = new CrmService(openDatabase(":memory:"));
  const client = scriptedClient([{ stop_reason: "refusal", content: [] }], []);
  const res = await new ChatService(crm, client).chat({ messages: [{ role: "user", content: "x" }] });
  assert.match(res.reply, /לא יכול/);
});
