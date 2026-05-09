import { format, isToday, isPast, parseISO } from "date-fns";
import { CalendarClock, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTagColor } from "./tagConfig";

const stageColors = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Proposal: "bg-purple-50 text-purple-700 border-purple-200",
  Won: "bg-green-50 text-green-700 border-green-200",
  Lost: "bg-red-50 text-red-700 border-red-200",
};

export default function FollowUpToday({ leads, onLeadClick }) {
  const due = leads.filter((l) => {
    if (!l.follow_up_date) return false;
    const d = parseISO(l.follow_up_date);
    return isToday(d) || isPast(d);
  });

  if (due.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Follow-ups Due</h2>
        <span className="ml-auto text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {due.length}
        </span>
      </div>

      <div className="space-y-2">
        {due.map((lead) => {
          const d = parseISO(lead.follow_up_date);
          const overdue = !isToday(d);
          return (
            <div
              key={lead.id}
              onClick={() => onLeadClick(lead)}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">{lead.name}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${stageColors[lead.stage] || ""}`}>
                    {lead.stage}
                  </Badge>
                  {lead.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getTagColor(tag)}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                {lead.company && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <Building2 className="w-3 h-3 shrink-0" />
                    {lead.company}
                  </div>
                )}
              </div>
              <span className={`text-xs font-medium shrink-0 ${overdue ? "text-red-600" : "text-primary"}`}>
                {overdue ? `Overdue · ${format(d, "MMM d")}` : "Today"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}