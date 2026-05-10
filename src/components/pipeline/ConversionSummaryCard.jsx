import { subDays } from "date-fns";
import { Trophy } from "lucide-react";

export default function ConversionSummaryCard({ leads }) {
  const cutoff = subDays(new Date(), 30);

  const recent = leads.filter((l) => {
    if (!["Won", "Lost"].includes(l.stage)) return false;
    const updated = new Date(l.updated_date || l.created_date);
    return updated >= cutoff;
  });

  const won = recent.filter((l) => l.stage === "Won").length;
  const lost = recent.filter((l) => l.stage === "Lost").length;
  const total = won + lost;
  const rate = total > 0 ? Math.round((won / total) * 100) : null;

  const rateColor =
    rate === null
      ? "text-foreground"
      : rate >= 60
      ? "text-emerald-600 dark:text-emerald-400"
      : rate >= 40
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Win Rate · Last 30 Days
        </p>
        <p className={`text-2xl font-bold ${rateColor}`}>
          {rate === null ? "—" : `${rate}%`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {total === 0
            ? "No closed deals yet"
            : `${won} won · ${lost} lost out of ${total} closed`}
        </p>
      </div>
      <div className="rounded-xl bg-emerald-500/10 p-3">
        <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </div>
    </div>
  );
}