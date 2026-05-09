import { Building2, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stageColors = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Proposal: "bg-purple-50 text-purple-700 border-purple-200",
  Won: "bg-green-50 text-green-700 border-green-200",
  Lost: "bg-red-50 text-red-700 border-red-200",
};

export default function LeadCard({ lead, onClick, dragHandleProps }) {
  return (
    <div
      onClick={() => onClick?.(lead)}
      className="group bg-card rounded-xl border border-border/60 p-4 cursor-pointer
                 hover:shadow-md hover:border-primary/20 transition-all duration-200"
      {...dragHandleProps}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
          {lead.name}
        </h3>
        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ml-2 ${stageColors[lead.stage] || ""}`}>
          {lead.stage}
        </Badge>
      </div>

      {lead.company && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <Building2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.company}</span>
        </div>
      )}

      {lead.email && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <Mail className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
      )}

      {lead.phone && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="w-3 h-3 shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </div>
      )}

      {lead.notes && (
        <p className="mt-2 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
          {lead.notes}
        </p>
      )}
    </div>
  );
}