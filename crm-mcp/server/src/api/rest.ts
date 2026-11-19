import { Router, type Request, type Response, type NextFunction } from "express";
import { z, ZodError } from "zod";
import type { CrmService } from "../services/crm.ts";
import {
  createLeadSchema,
  createTaskSchema,
  NotFoundError,
  updateLeadSchema,
  updateTaskSchema,
} from "../services/types.ts";

const idParam = (req: Request) => z.coerce.number().int().positive().parse(req.params.id);
const optNum = (v: unknown) => (v === undefined ? undefined : Number(v));
const optStr = (v: unknown) => (typeof v === "string" && v !== "" ? v : undefined);

/** REST API consumed by the Flutter app. */
export function createRestRouter(crm: CrmService): Router {
  const r = Router();

  r.get("/leads", (req, res) => {
    res.json(
      crm.listLeads({
        stage: optStr(req.query.stage),
        search: optStr(req.query.search),
        limit: optNum(req.query.limit),
      }),
    );
  });
  r.get("/leads/:id", (req, res) => res.json(crm.getLead(idParam(req))));
  r.post("/leads", (req, res) => res.status(201).json(crm.createLead(createLeadSchema.parse(req.body))));
  r.patch("/leads/:id", (req, res) =>
    res.json(crm.updateLead(idParam(req), updateLeadSchema.parse(req.body))),
  );
  r.delete("/leads/:id", (req, res) => {
    crm.deleteLead(idParam(req));
    res.status(204).end();
  });
  r.get("/leads/:id/activities", (req, res) => res.json(crm.listActivities(idParam(req))));

  r.get("/tasks", (req, res) => {
    res.json(
      crm.listTasks({
        lead_id: optNum(req.query.lead_id),
        status: optStr(req.query.status),
        due_before: optStr(req.query.due_before),
      }),
    );
  });
  r.post("/tasks", (req, res) => res.status(201).json(crm.createTask(createTaskSchema.parse(req.body))));
  r.patch("/tasks/:id", (req, res) =>
    res.json(crm.updateTask(idParam(req), updateTaskSchema.parse(req.body))),
  );
  r.delete("/tasks/:id", (req, res) => {
    crm.deleteTask(idParam(req));
    res.status(204).end();
  });

  r.get("/summary", (_req, res) => res.json(crm.pipelineSummary()));

  // Error mapping
  r.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ZodError) return res.status(400).json({ error: "validation", issues: err.issues });
    if (err instanceof NotFoundError) return res.status(404).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "internal" });
  });

  return r;
}
