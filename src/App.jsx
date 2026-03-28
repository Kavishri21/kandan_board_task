import TaskCard from "./components/TaskCard";

import AddTaskForm from "./components/AddTaskForm";
import TaskModal from "./components/TaskModal";
import { useContext } from "react";
import TaskContext from "./context/TaskContext";

import { DndContext } from "@dnd-kit/core";
import Column from "./components/Column";

function App() {
  const { tasks, addTask, deleteTask, openModal, selectedTask, updateTask, closeModal } = useContext(TaskContext);

  function handleDragEnd(event) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    const updatedTasks = tasks.map(function(task) {
      if (task.id === taskId) {
        return { ...task, status: newStatus };
      }
      return task;
    });

    updatedTasks.forEach(function(task) {
      updateTask(task);
    });
  }

  return (
    <div className="min-h-screen bg-black-67 p-4">
      
      <h1 className="text-5xl font-bold mb-6 text-center">
        Kandan Board
      </h1>

      <AddTaskForm addTask={addTask} />

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

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