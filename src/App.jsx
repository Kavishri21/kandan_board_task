// ---- React & Router ----
import { useContext, useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from "react-router-dom";

// ---- Context ----
import TaskContext from "./context/TaskContext";
import AuthContext from "./context/AuthContext";

// ---- Third-party ----
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

// ---- Services ----
import { fetchTeams, fetchMembers, fetchNotifications } from "./services/api";

// ---- Page Components ----
import UsersPage from "./components/UsersPage";
import TeamsPage from "./components/TeamsPage";
import TeamDetailPage from "./components/TeamDetailPage";
import ReportsPage from "./components/ReportsPage";
import NotificationsPage from "./components/NotificationsPage";

// ---- Board UI Components ----
import AddTaskForm from "./components/AddTaskForm";
import Column from "./components/Column";
import TaskCard from "./components/TaskCard";
import Sidebar from "./components/Sidebar";

// ---- Modal Components ----
import TaskModal from "./components/TaskModal";
import BacklogModal from "./components/BacklogModal";
import TaskDetailsModal from "./components/TaskDetailsModal";
import DeleteTaskModal from "./components/DeleteTaskModal";
import LogoutConfirmModal from "./components/LogoutConfirmModal";


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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Manager / OrgAdmin filter state
  const isManager = currentUser?.globalRole === "MANAGER";
  const isOrgAdmin = currentUser?.globalRole === "ORG_ADMIN";
  const canFilter = isManager || isOrgAdmin;
  const [filterTeams, setFilterTeams] = useState([]);       // teams to show in dropdown
  const [activeFilter, setActiveFilter] = useState(null);   // null = personal board
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  
  // Member drill-down states
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberViewToggle, setMemberViewToggle] = useState("team"); // "team" or "personal"
  
  const location = useLocation();
  const navigate = useNavigate();

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
    
    // 3. Notification Polling
    const loadUnreadCount = () => {
      fetchNotifications().then(notifs => {
        setUnreadNotifications(notifs.filter(n => !n.read).length);
      }).catch(() => {});
    };
    
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 3000); // 3s polling
    
    return () => clearInterval(interval);
  }, [currentUser?.id, isOrgAdmin, isManager]);

  // Handle opening task modal from notification route state
  useEffect(() => {
    if (location.state?.openTaskId && tasks.length > 0) {
      const taskToOpen = tasks.find(t => t.id === location.state.openTaskId);
      if (taskToOpen) {
         setHistoryTask(taskToOpen);
         setHistoryTab("tasks"); 
         navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state?.openTaskId, tasks, navigate, location.pathname]);

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
    setSelectedMember(null); // Reset member drill-down
    setMemberViewToggle("team");

    if (!filter) {
      // Personal board
      loadTasks();
    } else if (filter.type === "team") {
      // Fetch ALL tasks in the team
      loadTasks(filter.teamId);
    }
  }

  // Filter logic based on active filter and selected member
  let displayedTasks = tasks;
  if (!activeFilter) {
    displayedTasks = tasks.filter(t => t.userId === currentUser?.id);
  } else if (activeFilter?.type === "team" && selectedMember && memberViewToggle === "team") {
    displayedTasks = tasks.filter(t => t.userId === selectedMember.id);
  }

  // Search Filter
  const searchedTasks = displayedTasks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
  });

  // Board header label
  let boardLabel = "My Tasks";
  if (activeFilter?.type === "team") {
    if (selectedMember) {
      boardLabel = `${selectedMember.name}'s Workload`;
    } else {
      boardLabel = `Team: ${activeFilter.teamName}`;
    }
  }

  let boardSubLabel = "Tasks assigned to you.";
  if (activeFilter?.type === "team") {
    if (selectedMember) {
      boardSubLabel = memberViewToggle === "team" 
        ? `Tasks assigned within ${activeFilter.teamName}.`
        : `Personal tasks not assigned to any team.`;
    } else {
      boardSubLabel = `All tasks in ${activeFilter.teamName}.`;
    }
  }



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

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // 1. Identify destination status
    let newStatus = activeTask.status;
    const overTask = tasks.find(t => t.id === overId);
    
    if (["todo", "inprogress", "done", "backlog"].includes(overId)) {
      newStatus = overId;
    } else if (overTask) {
      newStatus = overTask.status;
    }

    // 2. Handle Priority Constraint and Reordering
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    const activePriority = activeTask.priority?.toLowerCase() || "medium";
    
    // Get all tasks in the destination column, sorted by priority and position
    const colTasks = tasks
      .filter(t => t.status === newStatus && t.id !== activeId)
      .sort((a, b) => {
        const pA = priorityOrder[a.priority?.toLowerCase()] || 4;
        const pB = priorityOrder[b.priority?.toLowerCase()] || 4;
        if (pA !== pB) return pA - pB;
        return (a.position || 0) - (b.position || 0);
      });

    // Find the specific priority group boundaries in the destination column
    const groupTasks = colTasks.filter(t => (t.priority?.toLowerCase() || "medium") === activePriority);

    let newPosition = activeTask.position;

    if (overTask && overTask.id !== activeId) {
      const overPriority = overTask.priority?.toLowerCase() || "medium";
      
      if (overPriority === activePriority) {
        // Drop over same priority: Calculate mid-point
        const overIndex = groupTasks.findIndex(t => t.id === overId);
        
        // Vertical check: are we above or below? 
        // dnd-kit sortable handleDragEnd usually assumes a swap or insertion.
        // We'll calculate based on the index in the sorted list.
        const allColTasks = tasks
          .filter(t => t.status === newStatus)
          .sort((a, b) => {
            const pA = priorityOrder[a.priority?.toLowerCase()] || 4;
            const pB = priorityOrder[b.priority?.toLowerCase()] || 4;
            if (pA !== pB) return pA - pB;
            return (a.position || 0) - (b.position || 0);
          });
        
        const oldIndex = allColTasks.findIndex(t => t.id === activeId);
        const targetIndex = allColTasks.findIndex(t => t.id === overId);
        
        if (oldIndex !== targetIndex) {
          const newIndex = targetIndex;
          const prevTask = allColTasks[newIndex > targetIndex ? newIndex - 1 : newIndex - 1]; // This is getting complex
          // Simpler: just use arrayMove logic on groupTasks
        }
      } else {
        // Drop over different priority: Snap to boundary
        // If dragged above a higher priority task -> place at TOP of its own priority group
        // If dragged below a lower priority task -> place at BOTTOM of its own priority group
        const activeP = priorityOrder[activePriority] || 4;
        const overP = priorityOrder[overPriority] || 4;
        
        if (activeP > overP) {
          // I am lower priority than what I'm over (e.g. Medium over High)
          // Place at TOP of Medium group
          newPosition = groupTasks.length > 0 ? groupTasks[0].position - 1000 : activeTask.position;
        } else {
          // I am higher priority than what I'm over (e.g. High over Medium)
          // Place at BOTTOM of High group
          newPosition = groupTasks.length > 0 ? groupTasks[groupTasks.length - 1].position + 1000 : activeTask.position;
        }
      }
    }

    const isTaskOverdue = (task, status) => {
      if (status === "done") return false;
      if (!task.dueDate) return false;
      const targetDate = new Date(task.dueDate);
      const targetUTC = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
      const now = new Date();
      const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      return (targetUTC - todayUTC) <= 0;
    };

    // --- Refined Position Logic ---
    const currentColumnTasks = tasks
      .filter(t => t.status === newStatus || t.id === activeId)
      .sort((a, b) => {
        const aOverdue = isTaskOverdue(a, newStatus);
        const bOverdue = isTaskOverdue(b, newStatus);
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        const pA = priorityOrder[a.priority?.toLowerCase()] || 4;
        const pB = priorityOrder[b.priority?.toLowerCase()] || 4;
        if (pA !== pB) return pA - pB;
        return (a.position || 0) - (b.position || 0);
      });

    const activeIsOverdue = isTaskOverdue(activeTask, newStatus);
    const oldIdx = currentColumnTasks.findIndex(t => t.id === activeId);
    let newIdx = currentColumnTasks.findIndex(t => t.id === overId);
    if (newIdx === -1) newIdx = currentColumnTasks.length - 1;

    // 3. Enforce Boundaries: Find the valid range for the active task
    let firstValidIdx, lastValidIdx;

    if (activeIsOverdue) {
      // Must stay in overdue section
      firstValidIdx = 0;
      lastValidIdx = currentColumnTasks.findLastIndex(t => isTaskOverdue(t, newStatus));
    } else {
      // Must stay in its priority group within the non-overdue section
      firstValidIdx = currentColumnTasks.findIndex(t => 
        !isTaskOverdue(t, newStatus) && 
        (t.priority?.toLowerCase() || "medium") === activePriority
      );
      lastValidIdx = currentColumnTasks.findLastIndex(t => 
        !isTaskOverdue(t, newStatus) && 
        (t.priority?.toLowerCase() || "medium") === activePriority
      );
    }

    // Clamp newIdx
    if (newIdx < firstValidIdx) newIdx = firstValidIdx;
    if (newIdx > lastValidIdx) newIdx = lastValidIdx;

    if (oldIdx !== newIdx || newStatus !== activeTask.status) {
      // Calculate new position
      if (currentColumnTasks.length === 1 && newStatus !== activeTask.status) {
         newPosition = Number(Date.now()); // Empty column case
      } else {
        const neighbors = [...currentColumnTasks.filter(t => t.id !== activeId)];
        neighbors.splice(newIdx, 0, activeTask); // Mock the move
        
        const idx = newIdx;
        const prev = neighbors[idx - 1];
        const next = neighbors[idx + 1];

        if (!prev && !next) {
          newPosition = Number(Date.now());
        } else if (!prev) {
          newPosition = next.position - 1000;
        } else if (!next) {
          newPosition = prev.position + 1000;
        } else {
          newPosition = (prev.position + next.position) / 2;
        }
      }

      if (newStatus === "backlog" && activeTask.status !== "backlog") {
        setPendingBacklogTask({ ...activeTask, position: newPosition });
      } else {
        updateTaskStatus(activeId, newStatus, newPosition);
      }
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
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        unreadNotifications={unreadNotifications}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Kanban Content Area */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-8 xl:px-12 py-8 relative z-10 focus:outline-none">
        
        {/* Mobile Header (Shows only on small screens) */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <div className="font-bold text-blue-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            Kanban
          </div>
          <button onClick={() => setIsLogoutModalOpen(true)} className="text-sm font-bold text-slate-500 p-2">Logout</button>
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
                        {activeFilter ? activeFilter.teamName : "My Board (Personal)"}
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

              {/* Members Filter (Only shows when a Team is selected) */}
              {activeFilter?.type === "team" && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Team Members</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const activeTeam = filterTeams.find(t => t.id === activeFilter.teamId);
                      if (!activeTeam) return null;
                      return activeTeam.members.map(m => {
                        const userObj = allUsers.find(u => u.id === m.userId);
                        const name = userObj ? userObj.name : m.userEmail;
                        const isSelected = selectedMember?.id === m.userId;
                        return (
                          <button
                            key={m.userId}
                            onClick={() => {
                              if (isSelected) {
                                 // Deselect
                                 setSelectedMember(null);
                                 setMemberViewToggle("team");
                                 loadTasks(activeFilter.teamId); // Load full team tasks
                              } else {
                                 // Select
                                 setSelectedMember({ id: m.userId, name: name });
                                 setMemberViewToggle("team");
                                 // Client side filter handled by displayedTasks, but ensure we have team tasks
                                 loadTasks(activeFilter.teamId); 
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                              isSelected ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200" : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                {name.charAt(0).toUpperCase()}
                              </div>
                              {name} {m.userId === currentUser?.id ? "(Me)" : ""}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* Member Tasks Toggle (Team vs Personal) */}
                  {selectedMember && selectedMember.id !== currentUser?.id && (
                    <div className="mt-5 flex gap-2 p-1 bg-slate-200/50 rounded-xl w-max">
                        <button
                          onClick={() => {
                              setMemberViewToggle("team");
                              loadTasks(activeFilter.teamId); // Load team tasks
                          }}
                          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            memberViewToggle === "team" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Team Tasks
                        </button>
                        <button
                          onClick={() => {
                              setMemberViewToggle("personal");
                              loadTasks(null, selectedMember.id, false); // Load personal tasks of selected member
                          }}
                          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                            memberViewToggle === "personal" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Personal Tasks
                        </button>
                    </div>
                  )}
                </div>
              )}

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
          <Route path="/notifications" element={<NotificationsPage />} />
          
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
              updateTaskStatus(updatedTaskProps.id, "backlog", pendingBacklogTask.position);
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

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
      
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

