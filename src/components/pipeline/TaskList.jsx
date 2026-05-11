import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Circle, Loader, Trash2, ChevronRight } from "lucide-react";

const STATUS_CONFIG = {
  "To Do":      { color: "bg-slate-100 text-slate-600 border-slate-200", icon: Circle },
  "In Progress":{ color: "bg-blue-50 text-blue-600 border-blue-200",    icon: Loader },
  "Done":       { color: "bg-green-50 text-green-600 border-green-200", icon: Check  },
};

const NEXT_STATUS = { "To Do": "In Progress", "In Progress": "Done", "Done": "To Do" };

const QUICK_TASKS = ["Call back", "Send quote", "Meeting", "Follow up", "Send contract"];

export default function TaskList({ leadId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    base44.entities.Task.filter({ lead_id: leadId }, "created_date")
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [leadId]);

  const addTask = async (title) => {
    if (!title.trim()) return;
    const task = await base44.entities.Task.create({ lead_id: leadId, title: title.trim(), status: "To Do" });
    setTasks((prev) => [...prev, task]);
    setNewTitle("");
    setShowInput(false);
  };

  const cycleStatus = async (task) => {
    const next = NEXT_STATUS[task.status];
    const updated = await base44.entities.Task.update(task.id, { status: next });
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  };

  const deleteTask = async (taskId) => {
    await base44.entities.Task.delete(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  if (loading) return <p className="text-xs text-muted-foreground py-2">Loading tasks...</p>;

  const todo = tasks.filter((t) => t.status !== "Done");
  const done = tasks.filter((t) => t.status === "Done");

  return (
    <div className="space-y-2">
      {/* Quick add chips */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_TASKS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => addTask(q)}
            className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + {q}
          </button>
        ))}
      </div>

      {/* Custom task input */}
      {showInput ? (
        <div className="flex gap-2">
          <Input
            autoFocus
            placeholder="Task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTask(newTitle); }
              if (e.key === "Escape") { setShowInput(false); setNewTitle(""); }
            }}
            className="h-8 text-sm"
          />
          <Button type="button" size="sm" onClick={() => addTask(newTitle)} disabled={!newTitle.trim()}>
            Add
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => { setShowInput(false); setNewTitle(""); }}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Custom task
        </button>
      )}

      {/* Task items */}
      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No tasks yet. Add one above.</p>
      )}

      {todo.length > 0 && (
        <div className="space-y-1">
          {todo.map((task) => <TaskRow key={task.id} task={task} onCycle={cycleStatus} onDelete={deleteTask} />)}
        </div>
      )}

      {done.length > 0 && (
        <details className="group">
          <summary className="text-xs text-muted-foreground cursor-pointer select-none flex items-center gap-1 py-1">
            <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
            {done.length} completed
          </summary>
          <div className="space-y-1 mt-1">
            {done.map((task) => <TaskRow key={task.id} task={task} onCycle={cycleStatus} onDelete={deleteTask} />)}
          </div>
        </details>
      )}
    </div>
  );
}

function TaskRow({ task, onCycle, onDelete }) {
  const { color, icon: Icon } = STATUS_CONFIG[task.status] || STATUS_CONFIG["To Do"];
  const isDone = task.status === "Done";

  return (
    <div className="flex items-center gap-2 group/row">
      <button
        type="button"
        onClick={() => onCycle(task)}
        className="shrink-0"
        title={`Mark as ${({ "To Do": "In Progress", "In Progress": "Done", "Done": "To Do" })[task.status]}`}
      >
        <Badge variant="outline" className={`text-xs px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity ${color}`}>
          <Icon className="w-3 h-3 mr-1" />
          {task.status}
        </Badge>
      </button>
      <span className={`flex-1 text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {task.title}
      </span>
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}