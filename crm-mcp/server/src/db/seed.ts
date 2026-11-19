import { config } from "../config.ts";
import { openDatabase } from "./database.ts";
import { CrmService } from "../services/crm.ts";

const crm = new CrmService(openDatabase(config.dbPath));
const day = (offset: number) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

const a = crm.createLead({ name: "דנה כהן", company: "אלפא טכנולוגיות", email: "dana@alpha.example", stage: "Qualified", priority: "High", estimated_value: 45000, follow_up_date: day(0) });
const b = crm.createLead({ name: "יוסי לוי", company: "בטא שיווק", phone: "050-0000000", stage: "New", source: "website" });
const c = crm.createLead({ name: "Maya Green", company: "Gamma Ltd", stage: "Proposal", priority: "High", estimated_value: 120000 });
crm.createTask({ title: "שיחת היכרות", lead_id: b.id, due_date: day(-1) });
crm.createTask({ title: "לשלוח הצעת מחיר מעודכנת", lead_id: c.id, due_date: day(1) });
crm.createTask({ title: "פגישת דמו", lead_id: a.id, due_date: day(0) });
console.log("Seeded", crm.pipelineSummary());
