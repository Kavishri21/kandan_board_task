import TaskCard from "./components/TaskCard";
import AddTaskForm from "./components/AddTaskForm";
import TaskModal from "./components/TaskModal";
import BacklogModal from "./components/BacklogModal";
import TaskHistoryModal from "./components/TaskHistoryModal";
import UsersPage from "./components/UsersPage";
import { useContext, useState } from "react";
import TaskContext from "./context/TaskContext";
import AuthContext from "./context/AuthContext";

import { DndContext, TouchSensor, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import Column from "./components/Column";

function App() {
  const { tasks, addTask, deleteTask, openModal, selectedTask, updateTask, updateTaskStatus, closeModal, loading, error } = useContext(TaskContext);
  const { logout } = useContext(AuthContext);
  
  const [pendingBacklogTask, setPendingBacklogTask] = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [currentPage, setCurrentPage] = useState("boards"); // "boards" | "users"

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

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
      
      {/* Fixed Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col pt-8 pb-6 px-4 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 shrink-0 hidden md:flex">
        <div className="px-3 mb-8">
          <div className="flex items-center gap-3 text-blue-700 font-bold text-lg tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
            Kanban Board
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <button
            onClick={() => setCurrentPage("boards")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium w-full text-left transition-colors ${
              currentPage === "boards" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Boards
          </button>
          <button
            onClick={() => setCurrentPage("users")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium w-full text-left transition-colors ${
              currentPage === "users" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Users
          </button>
        </div>

        <button 
          onClick={logout} 
          className="mt-auto flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors w-full text-left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Logout
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

        {currentPage === "boards" && (
          <>
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
                  Kanban Boards
                </h1>
              </div>
              <div className="flex shrink-0">
                <AddTaskForm addTask={addTask} />
              </div>
            </header>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToWindowEdges]}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                <Column title="To Do" status="todo"
                  tasks={tasks.filter(t => t.status === "todo")}
                  deleteTask={deleteTask} openModal={openModal} openHistoryModal={setHistoryTask} />
                <Column title="In Progress" status="inprogress"
                  tasks={tasks.filter(t => t.status === "inprogress")}
                  deleteTask={deleteTask} openModal={openModal} openHistoryModal={setHistoryTask} />
                <Column title="Done" status="done"
                  tasks={tasks.filter(t => t.status === "done")}
                  deleteTask={deleteTask} openModal={openModal} openHistoryModal={setHistoryTask} />
                <Column title="Backlog" status="backlog"
                  tasks={tasks.filter(t => t.status === "backlog")}
                  deleteTask={deleteTask} openModal={openModal} openHistoryModal={setHistoryTask} />
              </div>
            </DndContext>
          </>
        )}

        {currentPage === "users" && <UsersPage />}
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
        <TaskHistoryModal
          task={historyTask}
          closeModal={function() { setHistoryTask(null); }}
        />
      )}
    </div>
    
  );
}

export default App;