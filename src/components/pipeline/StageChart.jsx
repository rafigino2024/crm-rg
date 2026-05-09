import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

const stageColors = {
  New: "#3b82f6",
  Contacted: "#f59e0b",
  Qualified: "#10b981",
  Proposal: "#a855f7",
  Won: "#22c55e",
  Lost: "#f87171",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-card border border-border/60 rounded-lg px-3 py-2 shadow-lg text-sm">
      <span className="font-semibold text-foreground">{name}</span>
      <span className="text-muted-foreground ml-2">{value} lead{value !== 1 ? "s" : ""}</span>
    </div>
  );
};

export default function StageChart({ leads }) {
  const data = STAGES.map((stage) => ({
    name: stage,
    value: leads.filter((l) => l.stage === stage).length,
  }));

  const total = leads.length;
  const won = leads.filter((l) => l.stage === "Won").length;
  const convRate = total > 0 ? Math.round((won / total) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pipeline Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Leads by stage</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-foreground">{total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Won</p>
            <p className="text-lg font-bold text-green-600">{won}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Conv. rate</p>
            <p className="text-lg font-bold text-primary">{convRate}%</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", radius: 6 }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={stageColors[entry.name]} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}