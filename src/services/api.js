// Uses local backend if running locally (via .env), otherwise falls back to your live Render backend
const BASE_URL = import.meta.env.VITE_API_URL || "https://kanban-backend-ljud.onrender.com/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      throw new Error("Invalid email or password.");
    }
    throw new Error("Login failed. Please try again later.");
  }
  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  if (!response.ok) throw new Error("Registration failed");
  return response.json();
}

export async function fetchTasks() {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
}

export async function createTask(task) {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error("Failed to create task");
  return response.json(); // returns task with MongoDB _id
}

export async function updateTaskStatus(id, newStatus) {
  const response = await fetch(`${BASE_URL}/tasks/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status: newStatus }),
  });
  if (!response.ok) throw new Error("Failed to update task status");
  return response.json();
}

export async function updateTask(id, task) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error("Failed to update task");
  return response.json();
}

export async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete task");
}

// --- Invitation APIs ---

export async function sendInvitation(name, email) {
  const response = await fetch(`${BASE_URL}/invitations`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name, email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to send invitation");
  return data;
}

export async function validateInviteToken(token) {
  const response = await fetch(`${BASE_URL}/invitations/validate?token=${token}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Invalid invitation link");
  return data;
}

export async function acceptInvitation(token, password) {
  const response = await fetch(`${BASE_URL}/invitations/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to accept invitation");
  return data;
}

