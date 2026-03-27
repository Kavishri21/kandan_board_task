import TaskCard from "./components/TaskCard";
import { useState } from "react";

function App() {

  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Build UI",
      description: "Create layout",
      status: "todo",
      tag: "Work",
      priority: "urgent"
    },
    {
      id: 2,
      title: "Learn React",
      description: "Understand hooks",
      status: "inprogress",
      tag: "Study",
      priority: "medium"
    },
    {
      id: 3,
      title: "Exercise",
      description: "Go for a walk",
      status: "done",
      tag: "Self Care",
      priority: "low"
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6 text-center">
        Kanban Board
      </h1>

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
              return <TaskCard key={task.id} task={task} />;
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
              return <TaskCard key={task.id} task={task} />;
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
                return <TaskCard key={task.id} task={task} />;
              })}
        </div>

      </div>
    </div>
  );
}

export default App;