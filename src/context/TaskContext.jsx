import { createContext, useState, useEffect } from "react";

const TaskContext = createContext();

function TaskProvider(props) {
  const [tasks, setTasks] = useState(function() {
    const data = localStorage.getItem("tasks");
    if (data) {
        return JSON.parse(data);
    }
    return [];
    });

    useEffect(function() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }, [tasks]);

  const [selectedTask, setSelectedTask] = useState(null);

  function addTask(task) {
    setTasks(function(prev) {
      return [...prev, task];
    });
  }

  function deleteTask(id) {
    setTasks(function(prev) {
      return prev.filter(function(task) {
        return task.id !== id;
      });
    });
  }

  function updateTask(updatedTask) {
    setTasks(function(prev) {
      return prev.map(function(task) {
        if (task.id === updatedTask.id) {
          return updatedTask;
        }
        return task;
      });
    });
  }

  function openModal(task) {
    setSelectedTask(task);
  }

  function closeModal() {
    setSelectedTask(null);
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        deleteTask,
        updateTask,
        openModal,
        closeModal,
        selectedTask
      }}
    >
      {props.children}
    </TaskContext.Provider>
  );
}

export { TaskProvider };
export default TaskContext;