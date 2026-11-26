import Anthropic from "@anthropic-ai/sdk";
import { mcpTools, type MCPCallToolResultLike, type MCPClientLike, type MCPToolLike } from "@anthropic-ai/sdk/helpers/beta/mcp";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type { CrmService } from "../services/crm.ts";
import { createMcpServer } from "../mcp/server.ts";

export const MODEL = "claude-opus-5-5";

/** Conversation sent by the app: plain text turns only. */
export const chatRequestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) }))
    .min(1)
    .max(50)
    .refine((m) => m[0]?.role === "user" && m.at(-1)?.role === "user", {
      message: "Conversation must start and end with a user message",
    }),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** One CRM tool call the assistant made while answering. */
export interface ChatAction {
  tool: string;
  input: Record<string, unknown>;
  is_error: boolean;
}

export interface ChatReply {
  reply: string;
  actions: ChatAction[];
  /** True if the app should reload its data (the assistant changed something). */
  changed_data: boolean;
}

export class ChatUnavailableError extends Error {}

/**
 * The SDK resolves credentials from env vars or an `ant auth login` profile, but only
 * fails when a request is sent. Check up front so the app gets a clear "not configured".
 */
function hasAnthropicCredentials(): boolean {
  const env = process.env;
  if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_PROFILE) return true;
  if (env.ANTHROPIC_FEDERATION_RULE_ID) return true;
  const configDir = env.ANTHROPIC_CONFIG_DIR ?? join(env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "anthropic");
  return existsSync(configDir);
}

const READ_ONLY_TOOLS = new Set(["search_leads", "get_lead", "list_tasks", "pipeline_summary"]);

function systemPrompt(today: string): string {
  return [
    "You are the assistant inside a Hebrew CRM mobile app used by a small sales team.",
    "You manage leads and follow-up tasks through the CRM tools you have.",
    "Reply in the user's language (usually Hebrew), briefly, as plain text: no Markdown",
    "tables or headings, since the app renders text as is. Short lists with '•' are fine.",
    "Look things up with the tools instead of guessing, and find a lead's id with",
    "search_leads before changing it. When the request is ambiguous (for example two leads",
    "match a name), ask which one rather than picking. Do not delete anything.",
    "After making changes, say in one line what you changed.",
    "When talking about stages use the Hebrew names: New=חדש, Contacted=נוצר קשר,",
    "Qualified=מתאים, Proposal=הצעת מחיר, Won=נסגר, Lost=אבד.",
    `Today's date is ${today}.`,
  ].join("\n");
}

/**
 * AI chat over the CRM. Claude reaches the data only through the same MCP server
 * that external agents use (connected in-process), so every write is attributed to "ai".
 */
export class ChatService {
  private client?: Anthropic;

  constructor(
    private readonly crm: CrmService,
    /** Inject a client in tests; by default one is created from the environment. */
    client?: Anthropic,
  ) {
    this.client = client;
  }

  private getClient(): Anthropic {
    if (!this.client) {
      if (!hasAnthropicCredentials()) {
        throw new ChatUnavailableError("No Anthropic credentials found (set ANTHROPIC_API_KEY)");
      }
      try {
        this.client = new Anthropic(); // ANTHROPIC_API_KEY (or another configured credential)
      } catch (e) {
        throw new ChatUnavailableError(`Claude API is not configured: ${(e as Error).message}`);
      }
    }
    return this.client;
  }

  async chat(req: ChatRequest): Promise<ChatReply> {
    const client = this.getClient();

    // In-process MCP connection to our own CRM server.
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    const mcpServer = createMcpServer(this.crm);
    const mcpClient = new Client({ name: "crm-app-chat", version: "1.0.0" });
    await Promise.all([mcpServer.connect(serverSide), mcpClient.connect(clientSide)]);

    // Record every tool call so the app can show what the assistant did.
    const actions: ChatAction[] = [];
    const recordingClient: MCPClientLike = {
      callTool: async (p) => {
        const result = (await mcpClient.callTool(p)) as MCPCallToolResultLike;
        actions.push({ tool: p.name, input: p.arguments ?? {}, is_error: Boolean(result.isError) });
        return result;
      },
    };

    try {
      const { tools } = await mcpClient.listTools();
      const today = new Date().toISOString().slice(0, 10);

      const final = await client.beta.messages.toolRunner({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "medium" },
        // If Claude declines on policy grounds, the API retries on a fallback model automatically.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        cache_control: { type: "ephemeral" },
        system: systemPrompt(today),
        tools: mcpTools(tools as MCPToolLike[], recordingClient),
        messages: req.messages,
        max_iterations: 12,
      });

      let reply = final.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      if (final.stop_reason === "refusal") {
        reply = "מצטער, אני לא יכול לעזור בבקשה הזו.";
      } else if (!reply) {
        reply =
          final.stop_reason === "max_tokens" || final.stop_reason === "tool_use"
            ? "הבקשה הייתה ארוכה מדי לסיים. אפשר לנסות לחלק אותה לכמה בקשות קטנות יותר?"
            : "בוצע.";
      }

      return {
        reply,
        actions,
        changed_data: actions.some((a) => !a.is_error && !READ_ONLY_TOOLS.has(a.tool)),
      };
    } finally {
      await mcpClient.close();
      await mcpServer.close();
    }
  }
}
