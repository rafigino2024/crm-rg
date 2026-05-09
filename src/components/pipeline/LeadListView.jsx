import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Mail, Phone } from "lucide-react";

const stageColors = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Proposal: "bg-purple-50 text-purple-700 border-purple-200",
  Won: "bg-green-50 text-green-700 border-green-200",
  Lost: "bg-red-50 text-red-700 border-red-200",
};

export default function LeadListView({ leads, onLeadClick, selectedIds, onSelect, onSelectAll }) {
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onSelectAll(leads.map((l) => l.id))}
              />
            </TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Company</TableHead>
            <TableHead className="font-semibold">Contact</TableHead>
            <TableHead className="font-semibold">Stage</TableHead>
            <TableHead className="font-semibold">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                No leads yet. Add your first lead to get started.
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className={`cursor-pointer hover:bg-muted/30 transition-colors ${selectedIds.has(lead.id) ? "bg-primary/5" : ""}`}
            >
              <TableCell onClick={(e) => { e.stopPropagation(); onSelect(lead.id); }}>
                <Checkbox checked={selectedIds.has(lead.id)} />
              </TableCell>
              <TableCell className="font-medium cursor-pointer" onClick={() => onLeadClick(lead)}>{lead.name}</TableCell>
              <TableCell className="cursor-pointer" onClick={() => onLeadClick(lead)}>
                {lead.company && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />
                    {lead.company}
                  </div>
                )}
              </TableCell>
              <TableCell className="cursor-pointer" onClick={() => onLeadClick(lead)}>
                <div className="space-y-1">
                  {lead.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {lead.email}
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell onClick={() => onLeadClick(lead)}>
                <Badge variant="outline" className={`text-xs ${stageColors[lead.stage] || ""}`}>
                  {lead.stage}
                </Badge>
              </TableCell>
              <TableCell onClick={() => onLeadClick(lead)}>
                <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                  {lead.notes || "—"}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}