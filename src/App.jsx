import TaskCard from "./components/TaskCard";

import AddTaskForm from "./components/AddTaskForm";
import TaskModal from "./components/TaskModal";
import { useContext } from "react";
import TaskContext from "./context/TaskContext";
import AuthContext from "./context/AuthContext";

import { DndContext } from "@dnd-kit/core";
import Column from "./components/Column";

function App() {
  const { tasks, addTask, deleteTask, openModal, selectedTask, updateTask, updateTaskStatus, closeModal, loading, error } = useContext(TaskContext);
  const { logout } = useContext(AuthContext);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    // Find the dragged task and only update if status actually changed
    const draggedTask = tasks.find(function(t) { return t.id === taskId; });
    if (!draggedTask || draggedTask.status === newStatus) return;

    // PATCH /api/tasks/{id}/status — records new status + timestamp in MongoDB
    updateTaskStatus(taskId, newStatus);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 relative">
      
      {/* Soft Ethereal Mesh Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-300/40 blur-3xl mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-purple-300/30 blur-3xl mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '12s' }}></div>
        <div className="absolute bottom-[-15%] left-[15%] w-[60vw] h-[60vw] rounded-full bg-indigo-200/40 blur-3xl mix-blend-multiply opacity-70 animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      <div className="w-full px-4 sm:px-8 xl:px-16 py-10 relative z-10">
        
        <header className="mb-12 flex flex-col items-center justify-center text-center gap-6 relative">
          <div className="absolute top-0 right-0 sm:right-2">
             <button onClick={logout} className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shadow-sm focus:outline-none">Logout</button>
          </div>
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 pb-2 drop-shadow-sm">
              Kanban Dashboard
            </h1>
            <p className="text-base text-slate-500 mt-3 font-medium">Manage your tasks, boost productivity, and track progress effortlessly.</p>
          </div>
          <div className="w-full flex justify-center relative z-20">
            <AddTaskForm addTask={addTask} />
          </div>
        </header>

        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            <Column
              title="To Do"
              status="todo"
              tasks={tasks.filter(function(t) {
                return t.status === "todo";
              })}
              deleteTask={deleteTask}
              openModal={openModal}
            />

            <Column
              title="In Progress"
              status="inprogress"
              tasks={tasks.filter(function(t) {
                return t.status === "inprogress";
              })}
              deleteTask={deleteTask}
              openModal={openModal}
            />

            <Column
              title="Done"
              status="done"
              tasks={tasks.filter(function(t) {
                return t.status === "done";
              })}
              deleteTask={deleteTask}
              openModal={openModal}
            />

          </div>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskModal 
          task={selectedTask}
          updateTask={updateTask}
          closeModal={closeModal}
          openModal={openModal}
        />
      )}
    </div>
    
  );
}

export default App;