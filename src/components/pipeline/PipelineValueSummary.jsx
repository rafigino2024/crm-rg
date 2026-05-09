import { TrendingUp } from "lucide-react";

export default function PipelineValueSummary({ leads }) {
  const qualifiedLeads = leads.filter(l => ["Qualified", "Negotiation"].includes(l.stage));
  const totalValue = qualifiedLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Pipeline Value</p>
        <p className="text-2xl font-bold text-foreground">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
        <p className="text-xs text-muted-foreground mt-1">{qualifiedLeads.length} qualified/negotiating leads</p>
      </div>
      <div className="rounded-xl bg-primary/10 p-3">
        <TrendingUp className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}