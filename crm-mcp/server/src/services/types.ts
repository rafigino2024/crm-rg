import { z } from "zod";

export const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"] as const;
export const PRIORITIES = ["Low", "Medium", "High"] as const;
export const TASK_STATUSES = ["Open", "Done"] as const;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}/, "Expected an ISO date like 2026-11-19");

/** Fields a client may set on a lead. Shared by REST validation and MCP tool schemas. */
export const leadFields = {
  name: z.string().min(1).describe("Contact full name"),
  company: z.string().optional().describe("Company name"),
  email: z.string().email().optional().describe("Email address"),
  phone: z.string().optional().describe("Phone number"),
  stage: z.enum(STAGES).optional().describe("Pipeline stage"),
  priority: z.enum(PRIORITIES).optional().describe("Lead priority"),
  source: z.string().optional().describe("Where the lead came from (website, referral...)"),
  estimated_value: z.number().nonnegative().optional().describe("Estimated deal value"),
  notes: z.string().optional().describe("Free-text notes"),
  follow_up_date: isoDate.optional().describe("Next follow-up date (YYYY-MM-DD)"),
};

export const createLeadSchema = z.object(leadFields);
export const updateLeadSchema = z.object(leadFields).partial();

export const taskFields = {
  title: z.string().min(1).describe("What needs to be done"),
  lead_id: z.number().int().positive().optional().describe("Related lead id"),
  status: z.enum(TASK_STATUSES).optional().describe("Task status"),
  due_date: isoDate.optional().describe("Due date (YYYY-MM-DD)"),
  notes: z.string().optional().describe("Extra details"),
};

export const createTaskSchema = z.object(taskFields);
export const updateTaskSchema = z.object(taskFields).partial();

export type CreateLead = z.infer<typeof createLeadSchema>;
export type UpdateLead = z.infer<typeof updateLeadSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export interface Lead {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  stage: (typeof STAGES)[number];
  priority: (typeof PRIORITIES)[number];
  source: string | null;
  estimated_value: number | null;
  notes: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  lead_id: number | null;
  title: string;
  status: (typeof TASK_STATUSES)[number];
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  lead_id: number;
  type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  actor: string;
  created_at: string;
}

/** Who performed an action: the Flutter app user, or an AI agent via MCP. */
export type Actor = "user" | "ai";

export class NotFoundError extends Error {}
