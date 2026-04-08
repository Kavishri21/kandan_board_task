// Uses local backend if running locally (via .env), otherwise falls back to your live Render backend
const BASE_URL = import.meta.env.VITE_API_URL || "https://kanban-backend-ljud.onrender.com/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

// Auto-logout: if backend returns 403, clear session and reload to login screen
async function handleResponse(response, defaultErrorMsg) {
  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    // Force-logout the user back to the login screen
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Dispatch a custom event so AppContext can show a toast before reload
    window.dispatchEvent(new CustomEvent("force-logout", {
      detail: { message: data.message || "Your account has been deactivated. Please contact your administrator." }
    }));
    return null; // Signal that logout happened
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || defaultErrorMsg);
  }
  return response;
}

export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Invalid email or password.");
  }
  return data;
}

export async function registerUser(userData) {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }
  return data;
}


export async function fetchTasks() {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "GET",
    headers: getHeaders(),
  });
  const res = await handleResponse(response, "Failed to fetch tasks");
  if (!res) return [];
  return res.json();
}

export async function createTask(task) {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  const res = await handleResponse(response, "Failed to create task");
  if (!res) return null;
  return res.json();
}

export async function updateTaskStatus(id, newStatus) {
  const response = await fetch(`${BASE_URL}/tasks/${id}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status: newStatus }),
  });
  const res = await handleResponse(response, "Failed to update task status");
  if (!res) return null;
  return res.json();
}

export async function updateTask(id, task) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(task),
  });
  const res = await handleResponse(response, "Failed to update task");
  if (!res) return null;
  return res.json();
}

export async function deleteTask(id) {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  await handleResponse(response, "Failed to delete task");
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

export async function fetchMembers() {
  const response = await fetch(`${BASE_URL}/users`, {
    method: "GET",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch members");
  return response.json();
}

export async function toggleUserStatus(userId) {
  const response = await fetch(`${BASE_URL}/users/${userId}/status`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to update user status");
  return response.json();
}

export async function deleteUser(userId) {
  const response = await fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete user");
  return true;
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

