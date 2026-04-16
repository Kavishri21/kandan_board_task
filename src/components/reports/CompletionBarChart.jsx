import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  computeCompletionTimes,
  computeOverallTime,
  computeAverageTime,
} from "./reportUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Bar colors per priority
// ─────────────────────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = [
  { key: "high",   label: "High",   color: "#ef4444", bgLight: "#fef2f2" },
  { key: "medium", label: "Medium", color: "#f59e0b", bgLight: "#fffbeb" },
  { key: "low",    label: "Low",    color: "#22c55e", bgLight: "#f0fdf4" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, mode }) {
  if (!active || !payload || payload.length === 0) return null;
  const days = payload[0]?.value ?? 0;
  const config = PRIORITY_CONFIG.find(p => p.label === label);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: config?.color ?? "#64748b" }}
        />
        <span className="text-xs font-bold text-slate-700">{label} Priority</span>
      </div>
      <p className="text-xs text-slate-500">
        {mode === "overall" ? "Total" : "Average"} time:{" "}
        <span className="font-bold text-slate-800">{days} days</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Bar Label — shows the value on top of each bar
// ─────────────────────────────────────────────────────────────────────────────
function BarLabel(props) {
  const { x, y, width, value } = props;
  if (!value || value === 0) return null;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fill="#475569"
      fontSize={11}
      fontWeight={700}
    >
      {value}d
    </text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompletionBarChart — Phase 6
//
// Props:
//   tasks — filtered task array (already role-filtered + date-range filtered)
// ─────────────────────────────────────────────────────────────────────────────
export default function CompletionBarChart({ tasks }) {
  // Toggle: "overall" = sum of all completion times, "average" = mean
  const [mode, setMode] = useState("overall");

  // Compute completion times array per priority from done tasks only
  const completionTimes = useMemo(() => computeCompletionTimes(tasks), [tasks]);

  // Overall or average based on toggle
  const timeValues = useMemo(() => {
    return mode === "overall"
      ? computeOverallTime(completionTimes)
      : computeAverageTime(completionTimes);
  }, [mode, completionTimes]);

  // Format into Recharts-ready array
  const chartData = useMemo(() => [
    { label: "High",   value: timeValues.high,   count: completionTimes.high.length },
    { label: "Medium", value: timeValues.medium, count: completionTimes.medium.length },
    { label: "Low",    value: timeValues.low,    count: completionTimes.low.length },
  ], [timeValues, completionTimes]);

  const hasData = chartData.some(d => d.value > 0);

  // Count of done tasks used in subtitle
  const doneTasks = completionTimes.high.length + completionTimes.medium.length + completionTimes.low.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">

      {/* Card header */}
      <div className="flex items-start justify-between mb-5 gap-3">
        <div>
          <p className="text-sm font-bold text-slate-700">Completion Time by Priority</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {doneTasks > 0
              ? `Based on ${doneTasks} completed task${doneTasks !== 1 ? "s" : ""}`
              : "No completed tasks in this period"}
          </p>
        </div>

        {/* Toggle: Overall / Average */}
        <div className="flex rounded-xl border border-slate-200 overflow-hidden shrink-0">
          {[
            { key: "overall", label: "Overall" },
            { key: "average", label: "Average" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                mode === key
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="15"></line>
            <line x1="15" y1="9" x2="9" y2="15"></line>
          </svg>
          <p className="text-slate-400 text-sm font-medium">No completed tasks to calculate time</p>
          <p className="text-slate-300 text-xs mt-1">Complete some tasks to see timing metrics</p>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 10, left: -15, bottom: 5 }}
              barSize={52}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                unit=" d"
                width={36}
              />

              <Tooltip
                content={<CustomTooltip mode={mode} />}
                cursor={{ fill: "#f8fafc" }}
              />

              <Bar dataKey="value" radius={[8, 8, 0, 0]} label={<BarLabel />}>
                {chartData.map((entry) => {
                  const config = PRIORITY_CONFIG.find(p => p.label === entry.label);
                  return (
                    <Cell
                      key={entry.label}
                      fill={config?.color ?? "#6366f1"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary row: task count per priority */}
          <div className="flex gap-3 mt-3">
            {chartData.map(d => {
              const config = PRIORITY_CONFIG.find(p => p.label === d.label);
              return (
                <div key={d.label} className="flex-1 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-center">
                  <p className="text-[11px] font-medium text-slate-400">{d.label}</p>
                  <p className="text-sm font-bold" style={{ color: config?.color }}>
                    {d.count} task{d.count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
