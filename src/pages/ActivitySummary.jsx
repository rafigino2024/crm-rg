import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft, GitBranch, FileText, Plus, Edit, Activity } from "lucide-react";
import { formatDistanceToNow, startOfWeek, isAfter } from "date-fns";

const TYPE_META = {
  stage_changed: { icon: GitBranch, color: "text-primary bg-primary/10", label: "Stage Changed" },
  notes_updated: { icon: FileText, color: "text-amber-600 bg-amber-50", label: "Notes Updated" },
  lead_created: { icon: Plus, color: "text-green-600 bg-green-50", label: "Lead Created" },
  field_updated: { icon: Edit, color: "text-slate-500 bg-slate-100", label: "Field Updated" },
};

export default function ActivitySummary() {
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 200),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => base44.entities.Lead.list("-created_date"),
  });

  const leadMap = Object.fromEntries(leads.map((l) => [l.id, l]));

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const thisWeekLogs = logs.filter((log) => isAfter(new Date(log.created_date), weekStart));

  const filtered = typeFilter === "all"
    ? thisWeekLogs
    : thisWeekLogs.filter((l) => l.type === typeFilter);

  const counts = Object.fromEntries(
    Object.keys(TYPE_META).map((k) => [k, thisWeekLogs.filter((l) => l.type === k).length])
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Activity Summary</h1>
          </div>
          <span className="text-xs text-muted-foreground ml-1">This week</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(TYPE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}
                className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm
                  ${typeFilter === key ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border bg-card"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-foreground">{counts[key]}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meta.label}</p>
              </button>
            );
          })}
        </div>

        {/* Log List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {filtered.length} {typeFilter === "all" ? "total" : TYPE_META[typeFilter]?.label} events
            </p>
            {typeFilter !== "all" && (
              <button
                onClick={() => setTypeFilter("all")}
                className="text-xs text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Activity className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No activity this week.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((log) => {
                const meta = TYPE_META[log.type] || TYPE_META.field_updated;
                const Icon = meta.icon;
                const lead = leadMap[log.lead_id];
                return (
                  <li key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{log.description}</p>
                      {lead && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lead.name}{lead.company ? ` · ${lead.company}` : ""}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                      {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}