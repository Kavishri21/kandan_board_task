// ============================================================
// api.js — Centralized API service for the Kanban Board
//
// ALL backend calls go through this file.
// Phase 2 (JWT auth): only this file needs to change —
//   add getAuthHeader() and include it in every request.
// ============================================================

const BASE_URL = "https://kanban-backend-ljud.onrender.com/api";

// ----------------------------------------------------------------
// Helper: builds headers for every request
// Phase 2: add "Authorization": `Bearer ${localStorage.getItem("token")}`
// ----------------------------------------------------------------
function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

// ----------------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------------
export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

// ----------------------------------------------------------------
// POST /api/auth/signup
// ----------------------------------------------------------------
export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  if (!response.ok) throw new Error("Registration failed");
  return response.json();
}

// ----------------------------------------------------------------
// GET /api/tasks — load all tasks for the board
// ----------------------------------------------------------------
export async function fetchTasks() {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
}

// ----------------------------------------------------------------
// POST /api/tasks — create a new task
// ----------------------------------------------------------------
export async function createTask(task) {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error("Failed to create task");
  return response.json(); // returns task with MongoDB _id
}

// ----------------------------------------------------------------
// PATCH /api/tasks/{id}/status — drag-and-drop status update
// Sends the new status; backend records timestamp + audit log
// ----------------------------------------------------------------
export async function updateTaskStatus(id, newStatus) {
  const response = await fetch(`${BASE_URL}/tasks/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status: newStatus }),
  });
  if (!response.ok) throw new Error("Failed to update task status");
  return response.json();
}

// ----------------------------------------------------------------
// PUT /api/tasks/{id} — full task edit (modal save)
// ----------------------------------------------------------------
export async function updateTask(id, task) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error("Failed to update task");
  return response.json();
}

// ----------------------------------------------------------------
// DELETE /api/tasks/{id} — delete a task
// ----------------------------------------------------------------
export async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete task");
}
