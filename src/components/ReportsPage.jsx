import { useState, useEffect, useMemo } from "react";
import { fetchTasks, fetchTeams, fetchMembers } from "../services/api";
import {
  filterTasksBySelection,
  applyDateRange,
  exportToCSV,
} from "./reports/reportUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get default "from" date (30 days ago as "YYYY-MM-DD")
// ─────────────────────────────────────────────────────────────────────────────
function getDefaultFrom(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: DateRangePicker
// Shows preset buttons (7D / 30D / 3M) and custom From→To inputs.
// Applies to all 3 components on the page.
// ─────────────────────────────────────────────────────────────────────────────
function DateRangePicker({ dateFrom, dateTo, onFromChange, onToChange, onPreset }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date Range</span>

      {/* Preset buttons */}
      <div className="flex gap-1">
        {[
          { label: "7D", days: 7 },
          { label: "30D", days: 30 },
          { label: "3M", days: 90 },
        ].map(({ label, days }) => (
          <button
            key={label}
            onClick={() => onPreset(days)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <span className="text-slate-300 hidden sm:inline">|</span>

      {/* Custom date inputs */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          max={dateTo}
          onChange={e => onFromChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
        />
        <span className="text-slate-400 text-xs font-medium">to</span>
        <input
          type="date"
          value={dateTo}
          min={dateFrom}
          max={getTodayStr()}
          onChange={e => onToChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: FilterControls
// Renders the multi-step role-based filter:
// Step 1: Individual | Teams
// Step 2 (Teams): team pill selector (role-based list)
// Step 3 (Manager/Admin + team): Team-wide | By Employee
// Step 4 (By Employee): employee pill selector (including "Myself")
// ─────────────────────────────────────────────────────────────────────────────
function FilterControls({
  currentUser,
  myTeams,
  teamMembersForPicker,
  topFilter, onTopFilterChange,
  selectedTeamId, onTeamSelect,
  subView, onSubViewChange,
  selectedEmployeeId, onEmployeeSelect,
}) {
  const isManager = currentUser?.globalRole === "MANAGER";
  const isOrgAdmin = currentUser?.globalRole === "ORG_ADMIN";
  const canManage  = isManager || isOrgAdmin;

  return (
    <div className="flex flex-col gap-3">

      {/* Step 1: Individual / Teams */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 shrink-0">View</span>
        <div className="flex gap-2">
          {["individual", "teams"].map(opt => (
            <button
              key={opt}
              onClick={() => onTopFilterChange(opt)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all capitalize ${
                topFilter === opt
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {opt === "individual" ? "Individual" : "Teams"}
            </button>
          ))}
        </div>
        {topFilter === "individual" && (
          <span className="text-xs text-slate-400 italic">
            Showing tasks you assigned to yourself
          </span>
        )}
      </div>

      {/* Step 2: Team selector (only when "Teams" is active) */}
      {topFilter === "teams" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 shrink-0">Team</span>
          <div className="flex flex-wrap gap-2">
            {myTeams.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No teams available</span>
            ) : (
              myTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => onTeamSelect(team.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    selectedTeamId === team.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  {team.name}
                </button>
              ))
            )}
          </div>
          {!selectedTeamId && myTeams.length > 0 && (
            <span className="text-xs text-slate-400 italic">Select a team above</span>
          )}
        </div>
      )}

      {/* Step 3: Team-wide / By Employee (only for Manager/Admin after team is selected) */}
      {topFilter === "teams" && selectedTeamId && canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 shrink-0">View by</span>
          <div className="flex gap-2">
            {[
              { key: "teamwise",    label: "Team-wide" },
              { key: "employeewise", label: "By Employee" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onSubViewChange(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  subView === key
                    ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-violet-400 hover:text-violet-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Employee picker (only when "By Employee" sub-view is active) */}
      {topFilter === "teams" && selectedTeamId && canManage && subView === "employeewise" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider w-16 shrink-0">Employee</span>
          <div className="flex flex-wrap gap-2">
            {/* "Myself" option — tasks assigned to manager BY others in this team */}
            <button
              onClick={() => onEmployeeSelect("myself")}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                selectedEmployeeId === "myself"
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-teal-400 hover:text-teal-600"
              }`}
            >
              Myself
            </button>
            {/* Other team members */}
            {teamMembersForPicker
              .filter(u => u.id !== currentUser?.id) // exclude self (handled by Myself)
              .map(user => (
                <button
                  key={user.id}
                  onClick={() => onEmployeeSelect(user.id)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    selectedEmployeeId === user.id
                      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                      : "bg-white text-slate-500 border-slate-200 hover:border-teal-400 hover:text-teal-600"
                  }`}
                >
                  {user.name}
                </button>
              ))}
            {teamMembersForPicker.length === 0 && (
              <span className="text-xs text-slate-400 italic">No members found</span>
            )}
          </div>
          {!selectedEmployeeId && (
            <span className="text-xs text-slate-400 italic">Select an employee above</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page: ReportsPage
// ─────────────────────────────────────────────────────────────────────────────
export default function ReportsPage({ currentUser }) {
  const isManager = currentUser?.globalRole === "MANAGER";
  const isOrgAdmin = currentUser?.globalRole === "ORG_ADMIN";
  const canManage  = isManager || isOrgAdmin;

  // ── Raw data from API ─────────────────────────────────────
  const [allTasks,  setAllTasks]  = useState([]);
  const [myTeams,   setMyTeams]   = useState([]);
  const [allUsers,  setAllUsers]  = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ── Filter state ──────────────────────────────────────────
  const [topFilter,          setTopFilter]          = useState("individual");
  const [selectedTeamId,     setSelectedTeamId]     = useState(null);
  const [subView,            setSubView]            = useState("teamwise");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // ── Global date range ─────────────────────────────────────
  const [dateFrom, setDateFrom] = useState(getDefaultFrom(30));
  const [dateTo,   setDateTo]   = useState(getTodayStr());

  // ── Load all data once on mount ───────────────────────────
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        // Fetch all three in parallel for speed
        const [tasks, teams, users] = await Promise.all([
          fetchTasks(),    // all tasks visible to this user
          fetchTeams(),    // all teams (will filter client-side by role)
          fetchMembers(),  // all users (needed for employee picker)
        ]);

        setAllTasks(tasks);
        setAllUsers(users);

        const myId = currentUser?.id;
        if (isOrgAdmin) {
          // ORG_ADMIN sees all teams
          setMyTeams(teams);
        } else {
          // MANAGER or EMPLOYEE: only show teams they're part of
          setMyTeams(
            teams.filter(t =>
              t.createdByUserId === myId ||
              t.members?.some(m => m.userId === myId)
            )
          );
        }
      } catch (err) {
        console.error("Failed to load reports data:", err);
        setLoadError("Could not load report data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    if (currentUser?.id) loadData();
  }, [currentUser?.id]);

  // ── Compute filterState object for reportUtils ────────────
  const filterState = useMemo(() => {
    if (topFilter === "individual") {
      return { type: "individual" };
    }
    // Teams selected but no team chosen yet → fall back to individual
    if (!selectedTeamId) {
      return { type: "individual" };
    }
    // Employee role: tasks assigned to me in that team (no subView)
    if (!canManage) {
      return { type: "team", teamId: selectedTeamId };
    }
    // Manager/Admin: team-wise
    if (subView === "teamwise") {
      return { type: "team", teamId: selectedTeamId, subView: "teamwise" };
    }
    // Manager/Admin: employee-wise (need an employee selected)
    if (subView === "employeewise" && selectedEmployeeId) {
      return {
        type: "team",
        teamId: selectedTeamId,
        subView: "employeewise",
        employeeId: selectedEmployeeId,
      };
    }
    // employeewise but no employee chosen yet → show nothing
    return null;
  }, [topFilter, selectedTeamId, subView, selectedEmployeeId, canManage]);

  // ── Compute filtered tasks (drives all 3 components) ─────
  const filteredTasks = useMemo(() => {
    if (!filterState) return []; // waiting for employee selection
    const bySelection = filterTasksBySelection(allTasks, filterState, currentUser);
    return applyDateRange(bySelection, dateFrom, dateTo);
  }, [allTasks, filterState, currentUser, dateFrom, dateTo]);

  // ── Team members for the employee picker (Step 4) ─────────
  const teamMembersForPicker = useMemo(() => {
    if (!selectedTeamId || !canManage) return [];
    const team = myTeams.find(t => t.id === selectedTeamId);
    if (!team) return [];
    return (team.members ?? [])
      .map(m => allUsers.find(u => u.id === m.userId))
      .filter(Boolean);
  }, [selectedTeamId, myTeams, allUsers, canManage]);

  // ── Filter control handlers (reset cascading selections) ──
  function handleTopFilterChange(value) {
    setTopFilter(value);
    setSelectedTeamId(null);
    setSubView("teamwise");
    setSelectedEmployeeId(null);
  }

  function handleTeamSelect(teamId) {
    // Toggle — clicking the same team deselects
    setSelectedTeamId(prev => (prev === teamId ? null : teamId));
    setSubView("teamwise");
    setSelectedEmployeeId(null);
  }

  function handleSubViewChange(view) {
    setSubView(view);
    setSelectedEmployeeId(null);
  }

  function handlePreset(days) {
    setDateFrom(getDefaultFrom(days));
    setDateTo(getTodayStr());
  }

  // ── Build a readable label for what's currently shown ─────
  const currentViewLabel = useMemo(() => {
    if (topFilter === "individual") return "Individual (Self-assigned tasks)";
    if (!selectedTeamId) return "Select a team";
    const teamName = myTeams.find(t => t.id === selectedTeamId)?.name ?? "Team";
    if (!canManage) return `${teamName} — My Tasks`;
    if (subView === "teamwise") return `${teamName} — All Tasks`;
    if (subView === "employeewise") {
      if (!selectedEmployeeId) return `${teamName} — Select an employee`;
      if (selectedEmployeeId === "myself") return `${teamName} — My Tasks (assigned by others)`;
      const emp = allUsers.find(u => u.id === selectedEmployeeId);
      return `${teamName} — ${emp?.name ?? "Employee"}'s Tasks`;
    }
    return teamName;
  }, [topFilter, selectedTeamId, myTeams, subView, selectedEmployeeId, canManage, allUsers]);

  // ── Handle CSV export ──────────────────────────────────────
  function handleExportCSV() {
    if (filteredTasks.length === 0) return;
    const label = currentViewLabel.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    exportToCSV(filteredTasks, `kanban-report-${label}-${dateTo}.csv`);
  }

  // ── Loading / error states ────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-medium">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-xl text-center max-w-sm">
          <p className="font-bold mb-1">Failed to load reports</p>
          <p className="text-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto text-left pb-16">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Reports</h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            {currentViewLabel}
            <span className="ml-2 text-blue-400 font-semibold">
              · {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>

        {/* Export to CSV */}
        <button
          onClick={handleExportCSV}
          disabled={filteredTasks.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold border text-sm transition-all shrink-0 ${
            filteredTasks.length > 0
              ? "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
              : "bg-white border-slate-100 text-slate-300 cursor-not-allowed"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export CSV
        </button>
      </div>

      {/* ── Controls Card (Date Range + Filter) ──────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 flex flex-col gap-5">

        {/* Date Range Picker */}
        <DateRangePicker
          dateFrom={dateFrom}
          dateTo={dateTo}
          onFromChange={setDateFrom}
          onToChange={setDateTo}
          onPreset={handlePreset}
        />

        {/* Horizontal divider */}
        <div className="border-t border-slate-100" />

        {/* Filter Controls */}
        <FilterControls
          currentUser={currentUser}
          myTeams={myTeams}
          teamMembersForPicker={teamMembersForPicker}
          topFilter={topFilter}
          onTopFilterChange={handleTopFilterChange}
          selectedTeamId={selectedTeamId}
          onTeamSelect={handleTeamSelect}
          subView={subView}
          onSubViewChange={handleSubViewChange}
          selectedEmployeeId={selectedEmployeeId}
          onEmployeeSelect={setSelectedEmployeeId}
        />
      </div>

      {/* ── "Select a filter" prompt ──────────────────────── */}
      {topFilter === "teams" && !selectedTeamId && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center text-blue-500 text-sm font-medium mb-6">
          👆 Select a team above to view its report
        </div>
      )}

      {topFilter === "teams" && selectedTeamId && canManage && subView === "employeewise" && !selectedEmployeeId && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6 text-center text-violet-500 text-sm font-medium mb-6">
          👆 Select an employee above to view their report
        </div>
      )}

      {/* ── Components (Phases 4, 5, 6 will replace these) ── */}
      {(topFilter === "individual" || (selectedTeamId && (subView !== "employeewise" || selectedEmployeeId))) && (
        <div className="space-y-6">

          {/* Summary Cards — Phase 4 */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {["Tasks Assigned", "Tasks Completed", "Tasks Pending", "In Backlog"].map((label) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-400 mb-3">{label}</p>
                <div className="w-10 h-6 bg-slate-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts Row — Phase 5 & 6 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-1">Task Completion by Priority</p>
              <p className="text-xs text-slate-400 mb-4">Daily completed tasks — High / Medium / Low</p>
              <div className="h-52 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                <p className="text-slate-300 text-sm font-medium">Line Chart — Phase 5</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-1">Completion Time by Priority</p>
              <p className="text-xs text-slate-400 mb-4">Overall / Average time to complete tasks</p>
              <div className="h-52 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                <p className="text-slate-300 text-sm font-medium">Bar Chart — Phase 6</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
