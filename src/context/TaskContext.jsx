import { createContext, useState, useEffect } from "react";
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  updateTaskStatus as apiUpdateTaskStatus,
  deleteTask as apiDeleteTask,
} from "../services/api";

const TaskContext = createContext();

function TaskProvider(props) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ----------------------------------------------------------------
  // Load all tasks from MongoDB on initial mount
  // ----------------------------------------------------------------
  useEffect(function () {
    setLoading(true);
    fetchTasks()
      .then(function (data) {
        setTasks(data);
        setLoading(false);
      })
      .catch(function (err) {
        console.error("Failed to load tasks:", err);
        setError("Could not connect to backend. Is Spring Boot running?");
        setLoading(false);
      });
  }, []);

  // ----------------------------------------------------------------
  // ADD a new task (POST)
  // ----------------------------------------------------------------
  function addTask(task) {
    apiCreateTask(task)
      .then(function (savedTask) {
        // savedTask has the MongoDB-generated id (_id mapped to id)
        setTasks(function (prev) {
          return [...prev, savedTask];
        });
      })
      .catch(function (err) {
        console.error("Failed to create task:", err);
      });
  }

  // ----------------------------------------------------------------
  // DELETE a task (DELETE)
  // ----------------------------------------------------------------
  function deleteTask(id) {
    apiDeleteTask(id)
      .then(function () {
        setTasks(function (prev) {
          return prev.filter(function (task) {
            return task.id !== id;
          });
        });
      })
      .catch(function (err) {
        console.error("Failed to delete task:", err);
      });
  }

  // ----------------------------------------------------------------
  // UPDATE TASK details — modal save (PUT)
  // Updates title, description, tag, priority
  // ----------------------------------------------------------------
  function updateTask(updatedTask) {
    return apiUpdateTask(updatedTask.id, updatedTask)
      .then(function (savedTask) {
        setTasks(function (prev) {
          return prev.map(function (task) {
            if (task.id === savedTask.id) {
              return savedTask;
            }
            return task;
          });
        });
        return savedTask;
      })
      .catch(function (err) {
        console.error("Failed to update task:", err);
        throw err;
      });
  }

  // ----------------------------------------------------------------
  // UPDATE STATUS — drag-and-drop only (PATCH /status)
  // This is the main Phase 1 feature:
  //   Backend records new status + timestamp + statusHistory entry
  // ----------------------------------------------------------------
  function updateTaskStatus(taskId, newStatus) {
    // Optimistic update — update UI immediately, sync with backend
    setTasks(function (prev) {
      return prev.map(function (task) {
        if (task.id === taskId) {
          return { ...task, status: newStatus };
        }
        return task;
      });
    });

    return apiUpdateTaskStatus(taskId, newStatus)
      .then(function (savedTask) {
        // Sync with what the backend actually saved (includes updatedAt)
        setTasks(function (prev) {
          return prev.map(function (task) {
            if (task.id === savedTask.id) {
              return savedTask;
            }
            return task;
          });
        });
      })
      .catch(function (err) {
        console.error("Failed to update task status:", err);
        // Rollback: re-fetch the board from backend on failure
        fetchTasks().then(setTasks);
      });
  }

  // ----------------------------------------------------------------
  // Modal helpers
  // ----------------------------------------------------------------
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
        updateTaskStatus,   // <-- new: only for drag-and-drop
        openModal,
        closeModal,
        selectedTask,
        loading,
        error,
      }}
    >
      {props.children}
    </TaskContext.Provider>
  );
}

export { TaskProvider };
export default TaskContext;