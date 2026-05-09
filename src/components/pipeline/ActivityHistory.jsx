import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { formatDistanceToNow } from "date-fns";
import { GitBranch, FileText, Plus, Edit } from "lucide-react";

const icons = {
  stage_changed: <GitBranch className="w-3.5 h-3.5 text-primary" />,
  notes_updated: <FileText className="w-3.5 h-3.5 text-muted-foreground" />,
  lead_created: <Plus className="w-3.5 h-3.5 text-green-500" />,
  field_updated: <Edit className="w-3.5 h-3.5 text-muted-foreground" />,
};

export default function ActivityHistory({ leadId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    base44.entities.ActivityLog.filter({ lead_id: String(leadId) }, "-created_date", 50)
      .then(setLogs)
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) {
    return <p className="text-xs text-muted-foreground py-2">Loading activity...</p>;
  }

  if (logs.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-2">
          <div className="mt-0.5 shrink-0">{icons[log.type] || icons.field_updated}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground leading-snug">{log.description}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}