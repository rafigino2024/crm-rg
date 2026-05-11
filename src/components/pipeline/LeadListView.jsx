import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Mail, Phone, UserCircle, Search } from "lucide-react";

const priorityColors = {
  High: "bg-red-50 text-red-600 border-red-200",
  Medium: "bg-amber-50 text-amber-600 border-amber-200",
  Low: "bg-slate-50 text-slate-500 border-slate-200",
};

const stageColors = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Qualified: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Proposal: "bg-purple-50 text-purple-700 border-purple-200",
  Won: "bg-green-50 text-green-700 border-green-200",
  Lost: "bg-red-50 text-red-700 border-red-200",
};

export default function LeadListView({ leads, onLeadClick, selectedIds, onSelect, onSelectAll }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? leads.filter(
        (l) =>
          l.name?.toLowerCase().includes(search.toLowerCase()) ||
          l.company?.toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  const allSelected = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id));

  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      <div className="p-3 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onSelectAll(filtered.map((l) => l.id))}
              />
            </TableHead>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Company</TableHead>
            <TableHead className="font-semibold">Contact</TableHead>
            <TableHead className="font-semibold">Priority</TableHead>
            <TableHead className="font-semibold">Stage</TableHead>
            <TableHead className="font-semibold">Assigned To</TableHead>
            <TableHead className="font-semibold">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                {search.trim() ? "No leads match your search." : "No leads yet. Add your first lead to get started."}
              </TableCell>
            </TableRow>
          )}
          {filtered.map((lead) => (
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
                <Badge variant="outline" className={`text-xs ${priorityColors[lead.priority] || priorityColors.Medium}`}>
                  {lead.priority || "Medium"}
                </Badge>
              </TableCell>
              <TableCell onClick={() => onLeadClick(lead)}>
                <Badge variant="outline" className={`text-xs ${stageColors[lead.stage] || ""}`}>
                  {lead.stage}
                </Badge>
              </TableCell>
              <TableCell onClick={() => onLeadClick(lead)}>
                {lead.assigned_to ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UserCircle className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[140px]">{lead.assigned_to}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/50">—</span>
                )}
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