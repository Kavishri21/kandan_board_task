/**
 * reportUtils.js — Phase 2: Data Processing Layer
 *
 * Pure JavaScript functions that take raw task data and return
 * computed metrics for the Reports page components.
 *
 * All functions are side-effect free — they only read their inputs
 * and return new values. No API calls, no React state.
 *
 * Filter state shape (used by filterTasksBySelection):
 *   { type: 'individual' }
 *   { type: 'team', teamId: string }                             — employee team view
 *   { type: 'team', teamId: string, subView: 'teamwise' }        — manager/admin: all tasks in team
 *   { type: 'team', teamId: string, subView: 'employeewise', employeeId: string }  — specific employee
 *   { type: 'team', teamId: string, subView: 'employeewise', employeeId: 'myself' } — Myself (tasks assigned by others TO manager)
 */

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Convert a Date object to a "YYYY-MM-DD" string using LOCAL time
// (NOT UTC) so that IST and other timezone users get the correct calendar date.
// ─────────────────────────────────────────────────────────────────────────────
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Find when a task was completed (first "done" statusHistory entry)
// Returns Date object or null if the task was never marked done.
// ─────────────────────────────────────────────────────────────────────────────
export function getCompletedDate(task) {
  if (!task.statusHistory || task.statusHistory.length === 0) return null;
  const doneEntry = task.statusHistory.find(h => h.status === "done");
  return doneEntry ? new Date(doneEntry.changedAt) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Generate an array of local date strings for each day between start and end
// Uses LOCAL time (not UTC) so date boundaries match the user's calendar exactly.
// Returns array of "YYYY-MM-DD" strings.
// ─────────────────────────────────────────────────────────────────────────────
export function generateDateRange(fromDate, toDate) {
  const dates = [];
  // Start at local midnight on fromDate
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);

  // End at local end-of-day on toDate
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    dates.push(toLocalDateKey(current)); // ← local date, not UTC
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Format a "YYYY-MM-DD" string → short label like "Apr 10"
// ─────────────────────────────────────────────────────────────────────────────
export function formatDateLabel(isoDate) {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Filter tasks by user selection and role
//
// currentUser: { id, globalRole }
// filterState: see shape comment at the top of this file
// allTasks: full list of tasks fetched from the API
//
// Returns: filtered array of tasks relevant to the current selection
// ─────────────────────────────────────────────────────────────────────────────
export function filterTasksBySelection(allTasks, filterState, currentUser) {
  if (!allTasks || !filterState || !currentUser) return [];

  const myId = currentUser.id;
  const role = currentUser.globalRole; // "ORG_ADMIN" | "MANAGER" | "EMPLOYEE"

  // ── Individual: tasks created BY me AND assigned TO me (self-assigned) ──
  if (filterState.type === "individual") {
    return allTasks.filter(
      t => t.userId === myId && t.createdByUserId === myId
    );
  }

  // ── Team view ────────────────────────────────────────────────────────────
  if (filterState.type === "team") {
    const { teamId, subView, employeeId } = filterState;

    // Employee role: tasks assigned TO me in this specific team
    // (no subView for employees)
    if (role === "EMPLOYEE" || !subView) {
      return allTasks.filter(
        t => t.teamId === teamId && t.userId === myId
      );
    }

    // Manager / ORG_ADMIN → Team-wise: ALL tasks in this team
    if (subView === "teamwise") {
      return allTasks.filter(t => t.teamId === teamId);
    }

    // Manager / ORG_ADMIN → Employee-wise: tasks for a specific employee
    if (subView === "employeewise" && employeeId) {

      // "Myself" = tasks assigned TO the manager BY OTHERS in this team
      // (self-assigned is already covered by Individual)
      if (employeeId === "myself") {
        return allTasks.filter(
          t => t.teamId === teamId &&
               t.userId === myId &&
               t.createdByUserId !== myId
        );
      }

      // Specific employee: tasks assigned TO them in this team
      return allTasks.filter(
        t => t.teamId === teamId && t.userId === employeeId
      );
    }
  }

  // Fallback: return empty — unknown filter state
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Apply global date range
//
// Uses task.createdAt to determine which tasks fall in the window.
// This gives a consistent "universe" of tasks — from this set,
// all 3 components (cards, line chart, bar chart) draw their data.
// ─────────────────────────────────────────────────────────────────────────────
export function applyDateRange(tasks, fromDate, toDate) {
  if (!fromDate || !toDate) return tasks;

  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  return tasks.filter(t => {
    const created = new Date(t.createdAt);
    return created >= start && created <= end;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Compute summary card metrics
//
// Returns: { assigned, completed, pending, backlog }
// ─────────────────────────────────────────────────────────────────────────────
export function computeSummary(tasks) {
  const assigned  = tasks.length;
  const completed = tasks.filter(t => t.status === "done").length;
  const backlog   = tasks.filter(t => t.status === "backlog").length;
  // Pending = everything that is not done and not in backlog (todo + inprogress)
  const pending   = tasks.filter(
    t => t.status !== "done" && t.status !== "backlog"
  ).length;

  return { assigned, completed, pending, backlog };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Compute daily completion data for the Line Chart
//
// For each day in [fromDate, toDate], counts how many tasks of each
// priority were COMPLETED on that day (i.e., moved to "done" on that day
// according to statusHistory).
//
// Returns: array like [{ date: "Apr 10", dateKey: "2025-04-10", high: 2, medium: 1, low: 0 }, ...]
// ─────────────────────────────────────────────────────────────────────────────
export function computeDailyCompletionData(tasks, fromDate, toDate) {
  const dateKeys = generateDateRange(fromDate, toDate);

  // Pre-index: for each task that is done, find which day it was completed
  // completionMap: { "2025-04-10": { high: N, medium: N, low: N } }
  const completionMap = {};

  tasks.forEach(task => {
    const doneDate = getCompletedDate(task);
    if (!doneDate) return; // not completed, skip

    // Use LOCAL date key so the day matches the user's timezone (fixes IST shift)
    const dayKey = toLocalDateKey(doneDate);

    // Only count if the completion day falls within our displayed range
    if (!dateKeys.includes(dayKey)) return;

    if (!completionMap[dayKey]) {
      completionMap[dayKey] = { high: 0, medium: 0, low: 0 };
    }

    const priority = (task.priority || "medium").toLowerCase();
    if (priority === "high")        completionMap[dayKey].high   += 1;
    else if (priority === "medium") completionMap[dayKey].medium += 1;
    else if (priority === "low")    completionMap[dayKey].low    += 1;
  });

  // Build the final array, one entry per day (even days with zero completions)
  return dateKeys.map(dayKey => ({
    date:   formatDateLabel(dayKey),
    dateKey: dayKey,
    high:   completionMap[dayKey]?.high   ?? 0,
    medium: completionMap[dayKey]?.medium ?? 0,
    low:    completionMap[dayKey]?.low    ?? 0,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Compute completion times from done tasks (for Bar Chart)
//
// For each COMPLETED task, calculates how many days it took from
// createdAt → first "done" entry in statusHistory.
//
// Only includes tasks that are truly done (have a "done" statusHistory entry).
// In-progress tasks are excluded as confirmed.
//
// Returns: { high: [1.5, 2.0, ...], medium: [...], low: [...] }
//           (arrays of day durations, one per completed task)
// ─────────────────────────────────────────────────────────────────────────────
export function computeCompletionTimes(tasks) {
  const result = { high: [], medium: [], low: [] };

  tasks.forEach(task => {
    const doneDate = getCompletedDate(task);
    if (!doneDate) return; // skip — not completed

    const createdDate = new Date(task.createdAt);
    const daysToComplete =
      (doneDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    // Guard: if somehow doneDate < createdAt (data issue), skip
    if (daysToComplete < 0) return;

    const priority = (task.priority || "medium").toLowerCase();
    if (priority === "high")        result.high.push(daysToComplete);
    else if (priority === "medium") result.medium.push(daysToComplete);
    else if (priority === "low")    result.low.push(daysToComplete);
  });

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6a: Compute OVERALL (total) completion time per priority
//
// Returns: { high: N, medium: N, low: N } in days (rounded to 1 decimal)
// Returns 0 for priorities with no completed tasks.
// ─────────────────────────────────────────────────────────────────────────────
export function computeOverallTime(completionTimes) {
  const sum = arr => arr.reduce((acc, val) => acc + val, 0);
  return {
    high:   parseFloat(sum(completionTimes.high).toFixed(1)),
    medium: parseFloat(sum(completionTimes.medium).toFixed(1)),
    low:    parseFloat(sum(completionTimes.low).toFixed(1)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 6b: Compute AVERAGE completion time per priority
//
// Returns: { high: N, medium: N, low: N } in days (rounded to 1 decimal)
// Returns 0 for priorities with no completed tasks.
// ─────────────────────────────────────────────────────────────────────────────
export function computeAverageTime(completionTimes) {
  const avg = arr =>
    arr.length === 0 ? 0 : arr.reduce((acc, val) => acc + val, 0) / arr.length;
  return {
    high:   parseFloat(avg(completionTimes.high).toFixed(1)),
    medium: parseFloat(avg(completionTimes.medium).toFixed(1)),
    low:    parseFloat(avg(completionTimes.low).toFixed(1)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 7: Export filtered tasks to CSV (Phase 7 placeholder)
//
// Accepts the final filtered + date-ranged tasks array.
// Triggers a browser download of a .csv file.
// ─────────────────────────────────────────────────────────────────────────────
export function exportToCSV(tasks, filename) {
  const headers = [
    "Task Title",
    "Priority",
    "Status",
    "Team ID",
    "Created Date",
    "Completed Date",
    "Time to Complete (days)",
  ];

  const formatDateCell = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const rows = tasks.map(task => {
    const doneDate = getCompletedDate(task);
    const daysToComplete = doneDate
      ? ((doneDate.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)
      : "-";

    return [
      `"${(task.title || "").replace(/"/g, '""')}"`, // escape quotes in title
      task.priority || "medium",
      task.status || "-",
      task.teamId || "Personal",
      formatDateCell(task.createdAt),
      doneDate ? formatDateCell(doneDate.toISOString()) : "-",
      daysToComplete,
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `kanban-report-${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
