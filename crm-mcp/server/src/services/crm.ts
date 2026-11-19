import type { DB } from "../db/database.ts";
import {
  NotFoundError,
  type Activity,
  type Actor,
  type CreateLead,
  type CreateTask,
  type Lead,
  type Task,
  type UpdateLead,
  type UpdateTask,
} from "./types.ts";

type Row = Record<string, string | number | null>;

/** Turns {a: 1, b: undefined} into "a = :a" pieces + params, skipping undefined. */
function toSet(fields: Record<string, unknown>) {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  return {
    columns: entries.map(([k]) => k),
    params: Object.fromEntries(entries) as Record<string, string | number | null>,
  };
}

export interface LeadFilter {
  stage?: string;
  search?: string;
  limit?: number;
}

export interface TaskFilter {
  lead_id?: number;
  status?: string;
  due_before?: string;
}

/**
 * The single source of business logic. Both the REST API (used by Flutter)
 * and the MCP server (used by AI agents) call into this class.
 */
export class CrmService {
  constructor(private readonly db: DB) {}

  // ---------- Leads ----------

  listLeads(filter: LeadFilter = {}): Lead[] {
    const where: string[] = [];
    const params: Row = {};
    if (filter.stage) {
      where.push("stage = :stage");
      params.stage = filter.stage;
    }
    if (filter.search) {
      where.push("(name LIKE :q OR company LIKE :q OR email LIKE :q)");
      params.q = `%${filter.search}%`;
    }
    params.limit = filter.limit ?? 100;
    const sql = `SELECT * FROM leads ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY updated_at DESC LIMIT :limit`;
    return this.db.prepare(sql).all(params) as unknown as Lead[];
  }

  getLead(id: number): Lead {
    const lead = this.db.prepare("SELECT * FROM leads WHERE id = ?").get(id) as Lead | undefined;
    if (!lead) throw new NotFoundError(`Lead ${id} not found`);
    return lead;
  }

  createLead(input: CreateLead, actor: Actor = "user"): Lead {
    const { columns, params } = toSet(input);
    const sql = `INSERT INTO leads (${columns.join(", ")})
                 VALUES (${columns.map((c) => ":" + c).join(", ")})`;
    const { lastInsertRowid } = this.db.prepare(sql).run(params);
    const lead = this.getLead(Number(lastInsertRowid));
    this.logActivity(lead.id, "lead_created", `Lead "${lead.name}" created`, actor);
    return lead;
  }

  updateLead(id: number, input: UpdateLead, actor: Actor = "user"): Lead {
    const before = this.getLead(id);
    const { columns, params } = toSet(input);
    if (columns.length === 0) return before;
    const sql = `UPDATE leads SET ${columns.map((c) => `${c} = :${c}`).join(", ")},
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = :id`;
    this.db.prepare(sql).run({ ...params, id });
    const after = this.getLead(id);

    if (before.stage !== after.stage) {
      this.logActivity(id, "stage_changed", `Stage changed: ${before.stage} → ${after.stage}`, actor);
    }
    const otherChanged = columns.filter(
      (c) => c !== "stage" && before[c as keyof Lead] !== after[c as keyof Lead],
    );
    if (otherChanged.length) {
      this.logActivity(id, "field_updated", `Updated: ${otherChanged.join(", ")}`, actor);
    }
    return after;
  }

  deleteLead(id: number): void {
    this.getLead(id);
    this.db.prepare("DELETE FROM leads WHERE id = ?").run(id);
  }

  // ---------- Tasks ----------

  listTasks(filter: TaskFilter = {}): Task[] {
    const where: string[] = [];
    const params: Row = {};
    if (filter.lead_id) {
      where.push("lead_id = :lead_id");
      params.lead_id = filter.lead_id;
    }
    if (filter.status) {
      where.push("status = :status");
      params.status = filter.status;
    }
    if (filter.due_before) {
      where.push("due_date IS NOT NULL AND due_date <= :due_before");
      params.due_before = filter.due_before;
    }
    const sql = `SELECT * FROM tasks ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY due_date IS NULL, due_date, id`;
    return this.db.prepare(sql).all(params) as unknown as Task[];
  }

  getTask(id: number): Task {
    const task = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Task | undefined;
    if (!task) throw new NotFoundError(`Task ${id} not found`);
    return task;
  }

  createTask(input: CreateTask, actor: Actor = "user"): Task {
    if (input.lead_id) this.getLead(input.lead_id);
    const { columns, params } = toSet(input);
    const sql = `INSERT INTO tasks (${columns.join(", ")})
                 VALUES (${columns.map((c) => ":" + c).join(", ")})`;
    const { lastInsertRowid } = this.db.prepare(sql).run(params);
    const task = this.getTask(Number(lastInsertRowid));
    if (task.lead_id) {
      this.logActivity(task.lead_id, "task_created", `Task added: ${task.title}`, actor);
    }
    return task;
  }

  updateTask(id: number, input: UpdateTask, actor: Actor = "user"): Task {
    const before = this.getTask(id);
    const { columns, params } = toSet(input);
    if (columns.length === 0) return before;
    const sql = `UPDATE tasks SET ${columns.map((c) => `${c} = :${c}`).join(", ")},
                 updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = :id`;
    this.db.prepare(sql).run({ ...params, id });
    const after = this.getTask(id);
    if (after.lead_id && before.status !== after.status && after.status === "Done") {
      this.logActivity(after.lead_id, "task_completed", `Task completed: ${after.title}`, actor);
    }
    return after;
  }

  deleteTask(id: number): void {
    this.getTask(id);
    this.db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  }

  // ---------- Activity ----------

  logActivity(leadId: number, type: string, description: string, actor: Actor = "user"): Activity {
    const { lastInsertRowid } = this.db
      .prepare("INSERT INTO activities (lead_id, type, description, actor) VALUES (?, ?, ?, ?)")
      .run(leadId, type, description, actor);
    return this.db
      .prepare("SELECT * FROM activities WHERE id = ?")
      .get(Number(lastInsertRowid)) as unknown as Activity;
  }

  listActivities(leadId: number): Activity[] {
    this.getLead(leadId);
    return this.db
      .prepare("SELECT * FROM activities WHERE lead_id = ? ORDER BY id DESC")
      .all(leadId) as unknown as Activity[];
  }

  // ---------- Dashboard ----------

  pipelineSummary() {
    const byStage = this.db
      .prepare(
        `SELECT stage, COUNT(*) AS count, COALESCE(SUM(estimated_value), 0) AS value
         FROM leads GROUP BY stage`,
      )
      .all() as { stage: string; count: number; value: number }[];
    const today = new Date().toISOString().slice(0, 10);
    const overdue = this.db
      .prepare("SELECT COUNT(*) AS n FROM tasks WHERE status = 'Open' AND due_date < ?")
      .get(today) as { n: number };
    const followUps = this.db
      .prepare(
        `SELECT COUNT(*) AS n FROM leads
         WHERE follow_up_date IS NOT NULL AND follow_up_date <= ? AND stage NOT IN ('Won','Lost')`,
      )
      .get(today) as { n: number };
    return {
      by_stage: byStage,
      total_leads: byStage.reduce((s, r) => s + r.count, 0),
      open_pipeline_value: byStage
        .filter((r) => r.stage !== "Won" && r.stage !== "Lost")
        .reduce((s, r) => s + r.value, 0),
      overdue_tasks: overdue.n,
      follow_ups_due: followUps.n,
    };
  }
}
