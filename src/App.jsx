import TaskCard from "./components/TaskCard";

import AddTaskForm from "./components/AddTaskForm";
import TaskModal from "./components/TaskModal";
import { useContext } from "react";
import TaskContext from "./context/TaskContext";

function App() {
  const { tasks } = useContext(TaskContext);
  const { addTask } = useContext(TaskContext);

  const { deleteTask, openModal } = useContext(TaskContext);
  const { selectedTask, updateTask, closeModal } = useContext(TaskContext);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      
      {/* Title */}
      <h1 className="text-5xl font-bold mb-6 text-center">
        Kanban Board
      </h1>

      <AddTaskForm addTask={addTask} />

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* To Do */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">To Do</h2>
          {tasks
            .filter(function(task) {
              return task.status === "todo";
            })
            .map(function(task) {
              return <TaskCard key={task.id} task={task} deleteTask={deleteTask} openModal={openModal}/>;
            })}
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">In Progress</h2>
            {tasks
            .filter(function(task) {
              return task.status === "inprogress";
            })
            .map(function(task) {
              return <TaskCard key={task.id} task={task} deleteTask={deleteTask} openModal={openModal}/>;
            })}
        </div>

        {/* Done */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">Done</h2>
            {tasks
              .filter(function(task) {
                return task.status === "done";
              })
              .map(function(task) {
                return <TaskCard key={task.id} task={task} deleteTask={deleteTask} openModal={openModal} />;
              })}
        </div>

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