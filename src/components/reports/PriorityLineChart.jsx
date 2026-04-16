import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { computeDailyCompletionData } from "./reportUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Priority line colors
// ─────────────────────────────────────────────────────────────────────────────
const LINE_CONFIG = [
  { key: "high",   label: "High",   color: "#ef4444" },  // red-500
  { key: "medium", label: "Medium", color: "#f59e0b" },  // amber-500
  { key: "low",    label: "Low",    color: "#22c55e" },  // green-500
];

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip: shows date + count per priority in a clean card
// ─────────────────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  const hasData = payload.some(p => p.value > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 min-w-[140px]">
      <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-slate-500">{entry.name}</span>
          </div>
          <span className="text-xs font-bold text-slate-800">{entry.value}</span>
        </div>
      ))}
      {!hasData && (
        <p className="text-xs text-slate-400 italic">No completions</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Legend — rendered as pill badges below the chart
// ─────────────────────────────────────────────────────────────────────────────
function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {LINE_CONFIG.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-slate-500">{label} Priority</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PriorityLineChart — Phase 5
//
// Props:
//   tasks    — filtered task array (already role-filtered + date-range filtered)
//   dateFrom — "YYYY-MM-DD" from global date range (to build x-axis skeleton)
//   dateTo   — "YYYY-MM-DD" to global date range
// ─────────────────────────────────────────────────────────────────────────────
export default function PriorityLineChart({ tasks, dateFrom, dateTo }) {
  // Build the chart data: one entry per day with high/medium/low completion counts
  const chartData = useMemo(
    () => computeDailyCompletionData(tasks, dateFrom, dateTo),
    [tasks, dateFrom, dateTo]
  );

  // Total completions across all days — used to decide whether to show empty state
  const totalCompletions = useMemo(
    () => chartData.reduce((sum, d) => sum + d.high + d.medium + d.low, 0),
    [chartData]
  );

  // Smart X-axis tick interval to avoid crowding on long ranges
  const tickInterval = useMemo(() => {
    const days = chartData.length;
    if (days <= 10)  return 0;          // show every day
    if (days <= 31)  return 4;          // every 5 days
    if (days <= 60)  return 6;          // every 7 days
    return 13;                          // every 2 weeks for 3-month range
  }, [chartData.length]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full">
      {/* Card header */}
      <div className="mb-5">
        <p className="text-sm font-bold text-slate-700">Task Completion by Priority</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Number of tasks completed each day, grouped by priority
        </p>
      </div>

      {/* Empty state */}
      {totalCompletions === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <p className="text-slate-400 text-sm font-medium">No task completions in this period</p>
          <p className="text-slate-300 text-xs mt-1">Try extending the date range</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                interval={tickInterval}
              />

              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />

              <Tooltip content={<CustomTooltip />} />

              {LINE_CONFIG.map(({ key, label, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  name={label}
                  stroke={color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          <CustomLegend />
        </>
      )}
    </div>
  );
}
