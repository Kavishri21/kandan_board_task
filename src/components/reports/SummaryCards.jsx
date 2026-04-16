import { useMemo } from "react";
import { computeSummary } from "./reportUtils";

// ─────────────────────────────────────────────────────────────────────────────
// SummaryCards — Phase 4
// Displays 4 metric cards derived from the filtered task list:
//   1. Tasks Assigned  (total)
//   2. Tasks Completed (status === "done")
//   3. Tasks Pending   (status === "todo" | "inprogress")
//   4. In Backlog      (status === "backlog")
// ─────────────────────────────────────────────────────────────────────────────

// Card config: label, color palette, icon SVG path data
const CARD_CONFIG = [
  {
    key: "assigned",
    label: "Tasks Assigned",
    subtitle: "Total in period",
    colorBg: "bg-blue-50",
    colorBorder: "border-blue-100",
    colorText: "text-blue-700",
    colorNum: "text-blue-800",
    colorDot: "bg-blue-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    ),
  },
  {
    key: "completed",
    label: "Completed",
    subtitle: "Moved to Done",
    colorBg: "bg-emerald-50",
    colorBorder: "border-emerald-100",
    colorText: "text-emerald-700",
    colorNum: "text-emerald-800",
    colorDot: "bg-emerald-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
  },
  {
    key: "pending",
    label: "Pending",
    subtitle: "To Do + In Progress",
    colorBg: "bg-amber-50",
    colorBorder: "border-amber-100",
    colorText: "text-amber-700",
    colorNum: "text-amber-800",
    colorDot: "bg-amber-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    ),
  },
  {
    key: "backlog",
    label: "In Backlog",
    subtitle: "Blocked or stalled",
    colorBg: "bg-red-50",
    colorBorder: "border-red-100",
    colorText: "text-red-700",
    colorNum: "text-red-800",
    colorDot: "bg-red-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
  },
];

export default function SummaryCards({ tasks }) {
  // Compute all 4 metrics from the filtered tasks
  const summary = useMemo(() => computeSummary(tasks), [tasks]);

  // Completion percentage for the progress bar
  const completionPct = summary.assigned > 0
    ? Math.round((summary.completed / summary.assigned) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {/* 4-card grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {CARD_CONFIG.map(card => {
          const value = summary[card.key];
          return (
            <div
              key={card.key}
              className={`${card.colorBg} ${card.colorBorder} border rounded-2xl p-5 flex flex-col gap-3 shadow-sm transition-transform hover:scale-[1.01]`}
            >
              {/* Icon + label row */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${card.colorText}`}>
                  {card.label}
                </span>
                <span className={`${card.colorText} opacity-70`}>
                  {card.icon}
                </span>
              </div>

              {/* Big number */}
              <p className={`text-4xl font-extrabold tracking-tight ${card.colorNum}`}>
                {value}
              </p>

              {/* Subtitle */}
              <p className={`text-xs font-medium ${card.colorText} opacity-60`}>
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Completion progress bar — sits below the cards */}
      {summary.assigned > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-sm">
          <span className="text-sm font-semibold text-slate-500 shrink-0">
            Completion Rate
          </span>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-emerald-700 shrink-0 w-10 text-right">
            {completionPct}%
          </span>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            No tasks found for this filter and date range.
          </p>
        </div>
      )}
    </div>
  );
}
