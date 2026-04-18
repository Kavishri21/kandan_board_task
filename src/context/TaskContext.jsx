import { createContext, useState, useEffect, useContext, useRef } from "react";
import AuthContext from "./AuthContext";
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  updateTaskStatus as apiUpdateTaskStatus,
  deleteTask as apiDeleteTask,
  addComment as apiAddComment,
  markCommentAsRead as apiMarkCommentAsRead,
  updateComment as apiUpdateComment,
  deleteComment as apiDeleteComment,
} from "../services/api";

const TaskContext = createContext();

function TaskProvider(props) {
  const { user: currentUser } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const lastFetchParamsRef = useRef({ teamId: undefined, createdByMe: false });

  // ----------------------------------------------------------------
  // Load tasks — accepts optional filter params
  // ----------------------------------------------------------------
  function loadTasks(teamId, createdByMe = false) {
    // Remember these params so the polling interval re-uses them
    lastFetchParamsRef.current = { teamId, createdByMe };
    setLoading(true);
    fetchTasks(teamId, createdByMe)
      .then(function (data) {
        setTasks(data);
        setLoading(false);
      })
      .catch(function (err) {
        console.error("Failed to load tasks:", err);
        setError("Could not connect to backend. Is Spring Boot running?");
        setLoading(false);
      });
  }

  useEffect(function () {
    // Initial load
    loadTasks();

    // ---- POLLING ----
    // Every 15 seconds, silently re-fetch using the same params
    // that were last used (respects active manager filter).
    // No loading spinner shown — board updates quietly in background.
    const interval = setInterval(function () {
      const { teamId, createdByMe } = lastFetchParamsRef.current;
      fetchTasks(teamId, createdByMe)
        .then(function (data) { setTasks(data); })
        .catch(function (err) { console.error("Background poll error:", err); });
    }, 5000); // 5 seconds

    // Cleanup: stop polling when component unmounts
    return function () { clearInterval(interval); };
  }, []);

  // ----------------------------------------------------------------
  // ADD a new task (POST)
  // ----------------------------------------------------------------
  function addTask(task) {
    apiCreateTask(task)
      .then(function (savedTask) {
        // savedTask has the MongoDB-generated id (_id mapped to id)
        // Only add to local state if the task is assigned to ME
        if (savedTask.userId === currentUser?.id) {
          setTasks(function (prev) {
            return [...prev, savedTask];
          });
        }
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
        // If task was reassigned to someone else, remove it from local state
        if (savedTask.userId !== currentUser?.id) {
          setTasks(function (prev) {
            return prev.filter(function (t) { return t.id !== savedTask.id; });
          });
          return savedTask;
        }

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
  // COMMENTS Logic
  // ----------------------------------------------------------------
  function addComment(taskId, comment) {
    return apiAddComment(taskId, comment)
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
        console.error("Failed to add comment:", err);
        throw err;
      });
  }

  function markCommentAsRead(taskId, commentId) {
    return apiMarkCommentAsRead(taskId, commentId)
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
        console.error("Failed to mark comment as read:", err);
      });
  }

  function updateComment(taskId, commentId, comment) {
    return apiUpdateComment(taskId, commentId, comment)
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
        console.error("Failed to update comment:", err);
        throw err;
      });
  }

  function deleteComment(taskId, commentId) {
    return apiDeleteComment(taskId, commentId)
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
        console.error("Failed to delete comment:", err);
        throw err;
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
        loadTasks,          // <-- for manager filter re-fetch
        addComment,         // <-- for TaskDetailsModal
        markCommentAsRead,  // <-- for TaskDetailsModal
        updateComment,      // <-- NEW
        deleteComment,      // <-- NEW
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