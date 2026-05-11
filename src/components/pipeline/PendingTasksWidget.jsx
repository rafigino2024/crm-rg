import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Circle, Loader, ChevronRight, AlertCircle } from "lucide-react";
import { isAfter, parseISO, startOfDay } from "date-fns";

const STATUS_CONFIG = {
  "To Do":       { color: "bg-slate-100 text-slate-600 border-slate-200", icon: Circle },
  "In Progress": { color: "bg-blue-50 text-blue-600 border-blue-200",    icon: Loader },
};

const NEXT_STATUS = { "To Do": "In Progress", "In Progress": "Done" };

export default function PendingTasksWidget({ leads, onLeadClick }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Task.filter({ status: "To Do" }, "created_date")
      .then(async (todoTasks) => {
        const inProgressTasks = await base44.entities.Task.filter({ status: "In Progress" }, "created_date");
        setTasks([...todoTasks, ...inProgressTasks]);
      })
      .finally(() => setLoading(false));
  }, []);

  const cycleStatus = async (task, e) => {
    e.stopPropagation();
    const next = NEXT_STATUS[task.status];
    const updated = await base44.entities.Task.update(task.id, { status: next });
    if (next === "Done") {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } else {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    }
  };

  const getLeadForTask = (task) => leads.find((l) => l.id === task.lead_id);

  const isOverdue = (task) =>
    task.due_date && isAfter(startOfDay(new Date()), parseISO(task.due_date));

  const overdueCount = tasks.filter(isOverdue).length;

  if (loading) return null;
  if (tasks.length === 0) return null;

  return (
    <div className="mt-4 bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Pending Tasks</h3>
          <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
          {overdueCount > 0 && (
            <span className="flex items-center gap-1 text-xs bg-red-500 text-white font-semibold px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" />
              {overdueCount} overdue
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const lead = getLeadForTask(task);
          const { color, icon: Icon } = STATUS_CONFIG[task.status] || STATUS_CONFIG["To Do"];
          const overdue = isOverdue(task);
          return (
            <div
              key={task.id}
              className={`flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors cursor-pointer group ${overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
              onClick={() => lead && onLeadClick(lead)}
            >
              <button
                type="button"
                onClick={(e) => cycleStatus(task, e)}
                title={`Mark as ${NEXT_STATUS[task.status]}`}
                className="shrink-0"
              >
                <Badge variant="outline" className={`text-xs px-2 py-0.5 cursor-pointer hover:opacity-75 transition-opacity ${color}`}>
                  <Icon className="w-3 h-3 mr-1" />
                  {task.status}
                </Badge>
              </button>

              <span className="flex-1 text-sm text-foreground truncate">{task.title}</span>

              {overdue && (
                <span className="text-xs font-semibold text-red-500 shrink-0">Overdue</span>
              )}

              {task.due_date && !overdue && (
                <span className="text-xs text-muted-foreground shrink-0">
                  Due {task.due_date}
                </span>
              )}

              {lead && (
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {lead.name}{lead.company ? ` · ${lead.company}` : ""}
                </span>
              )}

              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}