import TaskCard from "./components/TaskCard";
import AddTaskForm from "./components/AddTaskForm";
import TaskModal from "./components/TaskModal";
import BacklogModal from "./components/BacklogModal";
import TaskDetailsModal from "./components/TaskDetailsModal";
import UsersPage from "./components/UsersPage";
import TeamsPage from "./components/TeamsPage";
import TeamDetailPage from "./components/TeamDetailPage";
import ReportsPage from "./components/ReportsPage";
import { useContext, useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, NavLink } from "react-router-dom";
import { createPortal } from "react-dom";

// --- Sub-component: Delete Task Confirmation Modal ---
function DeleteTaskModal({ isOpen, onClose, task, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  async function handleConfirm() {
    setIsDeleting(true);
    await onConfirm(task.id);
    setIsDeleting(false);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Task?</h3>
        <p className="text-slate-500 text-sm mb-6">
          Are you sure you want to delete <span className="font-bold text-slate-700">{task.title}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={isDeleting} 
            className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

import TaskContext from "./context/TaskContext";
import AuthContext from "./context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchTeams, fetchMembers } from "./services/api";

import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import Column from "./components/Column";

function App() {
  const { tasks, addTask, deleteTask, openModal, selectedTask, updateTask, updateTaskStatus, closeModal, loading, error, loadTasks } = useContext(TaskContext);
  const { user: currentUser, logout } = useContext(AuthContext);
  
  const [pendingBacklogTask, setPendingBacklogTask] = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [historyTab, setHistoryTab] = useState("tasks");

  // Manager / OrgAdmin filter state
  const isManager = currentUser?.globalRole === "MANAGER";
  const isOrgAdmin = currentUser?.globalRole === "ORG_ADMIN";
  const canFilter = isManager || isOrgAdmin;
  const [filterTeams, setFilterTeams] = useState([]);       // teams to show in dropdown
  const [activeFilter, setActiveFilter] = useState(canFilter ? { type: "myself" } : null);   // null = personal board
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Load data for board filters and mentions
  useEffect(() => {
    // 1. Fetch all users for @mentions
    fetchMembers().then(users => {
      setAllUsers(users);
    }).catch(() => {});

    // 2. Fetch teams for filters and context
    fetchTeams().then(allTeams => {
      // For mentioning, we use the raw list
      // For the board filter dropdown, we apply logic:
      if (isOrgAdmin) {
        setFilterTeams(allTeams);
      } else if (isManager) {
        const myTeams = allTeams.filter(t =>
          t.createdByUserId === currentUser?.id ||
          t.members?.some(m => m.userId === currentUser?.id && m.teamRole === "LEAD")
        );
        setFilterTeams(myTeams);
      } else {
        // Regular Employee: only teams they are part of
        const myTeams = allTeams.filter(t => 
          t.members?.some(m => m.userId === currentUser?.id)
        );
        setFilterTeams(myTeams);
      }
    }).catch(() => {});
  }, [currentUser?.id, isOrgAdmin, isManager]);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleFilterSelect(filter) {
    setActiveFilter(filter);
    setFilterOpen(false);
    if (!filter) {
      // Personal board
      loadTasks();
    } else if (filter.type === "myself") {
      // Only tasks assigned to me (no teamId, client-side filtered)
      loadTasks(null, false);
    } else if (filter.type === "team") {
      if (isOrgAdmin) {
        // ORG_ADMIN: all tasks in that team
        loadTasks(filter.teamId, false);
      } else {
        // MANAGER: only tasks they created for that team
        loadTasks(filter.teamId, true);
      }
    }
  }

  // If filter is "myself", filter client-side to just my tasks
   const displayedTasks = (activeFilter?.type === "myself")
    ? tasks.filter(t => t.userId === currentUser?.id)
    : tasks;

  // Search Filter
  const searchedTasks = displayedTasks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  });

  // Board header label
  const boardLabel = !activeFilter
    ? "My Board"
    : activeFilter.type === "myself"
    ? "My Tasks"
    : `Team: ${activeFilter.teamName}`;
  
  const boardSubLabel = !activeFilter
    ? "Your personal task view across all teams."
    : activeFilter.type === "myself"
    ? "Tasks assigned to you."
    : isOrgAdmin
    ? `All tasks in ${activeFilter.teamName}.`
    : `Tasks you delegated to ${activeFilter.teamName}.`;



  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    const draggedTask = tasks.find(function(t) { return t.id === taskId; });
    if (!draggedTask || draggedTask.status === newStatus) return;

    if (newStatus === "backlog") {
      setPendingBacklogTask(draggedTask);
    } else {
      updateTaskStatus(taskId, newStatus);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-xl max-w-md text-center">
          <p className="font-bold mb-1">Backend connection error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden w-full">
      
      {/* Collapsible Sidebar */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col pt-8 pb-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 shrink-0 hidden md:flex transition-all duration-300 relative ${isCollapsed ? 'w-20 px-3' : 'w-64 px-4'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:border-blue-400 hover:text-blue-500 transition-all z-30"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>

        <div className={`mb-8 transition-all ${isCollapsed ? 'px-1' : 'px-3'}`}>
          <div className="flex items-center gap-3 text-blue-700 font-bold text-lg tracking-tight overflow-hidden whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            {!isCollapsed && <span>Kanban Board</span>}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <NavLink
            to="/"
            title="Dashboard"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
              isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Dashboard</span>}
          </NavLink>

          <NavLink
            to="/users"
            title="Users"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
              isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Users</span>}
          </NavLink>

          <NavLink
            to="/teams"
            title="Teams"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
              isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Teams</span>}
          </NavLink>

          <NavLink
            to="/reports"
            title="Reports"
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
              isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Reports</span>}
          </NavLink>
        </div>
 
        <button 
          onClick={logout} 
          title="Logout"
          className={`mt-auto flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors w-full text-left overflow-hidden whitespace-nowrap ${
            isCollapsed ? 'justify-center px-0 text-center' : ''
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          {!isCollapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Kanban Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-8 xl:px-12 py-8 relative z-10 focus:outline-none">
        
        {/* Mobile Header (Shows only on small screens) */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <div className="font-bold text-blue-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            Kanban
          </div>
          <button onClick={logout} className="text-sm font-bold text-slate-500 p-2">Logout</button>
        </div>

        <Routes>
          <Route path="/" element={
            <>
              <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
                    {boardLabel}
                  </h1>
                  <p className="text-sm text-slate-400 font-medium mt-0.5">{boardSubLabel}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Search Bar */}
                  <div className="relative group hidden sm:block">
                    <input 
                      type="text" 
                      placeholder="Search tasks..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 py-2.5 w-64 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-700"
                    />
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    )}
                  </div>

                  {/* Filter Dropdown — only for MANAGER and ORG_ADMIN */}
                  {canFilter && (
                    <div className="relative" ref={filterRef}>
                      <button
                        onClick={() => setFilterOpen(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border text-sm transition-all ${
                          activeFilter
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                        {activeFilter ? (activeFilter.type === "myself" ? "Myself" : activeFilter.teamName) : "Filter View"}
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>

                      {filterOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                          {/* My Board (reset) */}
                          <button
                            onClick={() => handleFilterSelect(null)}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                              !activeFilter ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            My Board (Personal)
                          </button>

                          {/* Myself option */}
                          <button
                            onClick={() => handleFilterSelect({ type: "myself" })}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                              activeFilter?.type === "myself" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            Myself
                          </button>

                          {filterTeams.length > 0 && (
                            <>
                              <div className="border-t border-slate-100 my-1" />
                              <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Teams</p>
                              {filterTeams.map(team => (
                                <button
                                  key={team.id}
                                  onClick={() => handleFilterSelect({ type: "team", teamId: team.id, teamName: team.name })}
                                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                                    activeFilter?.teamId === team.id ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
                                  }`}
                                >
                                  {team.name}
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <AddTaskForm addTask={addTask} />
                </div>
              </header>

              <DndContext 
                sensors={sensors} 
                onDragStart={handleDragStart} 
                onDragEnd={handleDragEnd} 
                onDragCancel={() => setActiveId(null)}
                modifiers={[restrictToWindowEdges]}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                  <Column title="To Do" status="todo"
                    tasks={searchedTasks.filter(t => t.status === "todo")}
                    deleteTask={setTaskToDelete} openModal={openModal} 
                    openHistoryModal={(task, tab) => { setHistoryTask(task); setHistoryTab(tab || "tasks"); }} 
                    isSearching={!!searchQuery}
                    currentUser={currentUser} />
                  <Column title="In Progress" status="inprogress"
                    tasks={searchedTasks.filter(t => t.status === "inprogress")}
                    deleteTask={setTaskToDelete} openModal={openModal} 
                    openHistoryModal={(task, tab) => { setHistoryTask(task); setHistoryTab(tab || "tasks"); }}
                    isSearching={!!searchQuery}
                    currentUser={currentUser} />
                  <Column title="Done" status="done"
                    tasks={searchedTasks.filter(t => t.status === "done")}
                    deleteTask={setTaskToDelete} openModal={openModal} 
                    openHistoryModal={(task, tab) => { setHistoryTask(task); setHistoryTab(tab || "tasks"); }}
                    isSearching={!!searchQuery}
                    currentUser={currentUser} />
                  <Column title="Backlog" status="backlog"
                    tasks={searchedTasks.filter(t => t.status === "backlog")}
                    deleteTask={setTaskToDelete} openModal={openModal} 
                    openHistoryModal={(task, tab) => { setHistoryTask(task); setHistoryTab(tab || "tasks"); }}
                    isSearching={!!searchQuery}
                    currentUser={currentUser} />
                </div>

                <DragOverlay dropAnimation={null}>
                  {activeId ? (
                    <TaskCard 
                      task={tasks.find(function(t) { return t.id === activeId; })} 
                      isOverlay={true}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          } />

          <Route path="/users" element={<UsersPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPageWrapper allTeams={filterTeams} />} />
          <Route path="/reports" element={<ReportsPage currentUser={currentUser} />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {selectedTask && (
        <TaskModal 
          task={selectedTask}
          updateTask={updateTask}
          closeModal={closeModal}
        />
      )}

      {pendingBacklogTask && (
        <BacklogModal
          task={pendingBacklogTask}
          closeModal={function() { setPendingBacklogTask(null); }}
          onSave={function(updatedTaskProps) {
            updateTask(updatedTaskProps).then(() => {
              updateTaskStatus(updatedTaskProps.id, "backlog");
              setPendingBacklogTask(null);
            });
          }}
        />
      )}

      {historyTask && (
        <TaskDetailsModal
          task={tasks.find(t => t.id === historyTask.id) || historyTask}
          currentUser={currentUser}
          teamMembers={(() => {
            if (!historyTask.teamId) return [];
            const team = filterTeams.find(t => t.id === historyTask.teamId);
            if (!team) return [];
            return (team.members || []).map(m => {
              const u = allUsers.find(user => user.id === m.userId);
              return u ? u : null;
            }).filter(Boolean);
          })()}
          initialTab={historyTab}
          closeModal={function() { setHistoryTask(null); setHistoryTab("activity"); }}
        />
      )}

      {taskToDelete && (
        <DeleteTaskModal
          isOpen={!!taskToDelete}
          task={taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onConfirm={deleteTask}
        />
      )}
      
    </div>
    
  );
}

export default App;
/**
 * TeamDetailPageWrapper: Connects the URL :teamId parameter to the TeamDetailPage component.
 */
function TeamDetailPageWrapper({ allTeams }) {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const team = allTeams.find(t => t.id === teamId);
  
  if (!team) {
    return <Navigate to="/teams" replace />;
  }
  
  return <TeamDetailPage team={team} onBack={() => navigate("/teams")} />;
}

