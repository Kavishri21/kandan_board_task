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
    // Store the reason so AuthScreen can show it after redirect
    localStorage.setItem("logout_reason", data.message || "Your account has been deactivated. Please contact your administrator.");
    // Clear session immediately
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Reload to hit the !token check in main.jsx instantly
    window.location.reload();
    return null;
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
  
  let data = {};
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse error response", e);
  }

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

  let data = {};
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse error response", e);
  }

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }
  return data;
}



export async function fetchTasks(teamId, createdByMe = false) {
  const params = new URLSearchParams();
  if (teamId) params.set("teamId", teamId);
  if (createdByMe) params.set("createdByMe", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  const url = `${BASE_URL}/tasks${query}`;
  const response = await fetch(url, {
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

export async function addComment(taskId, comment) {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(comment),
  });
  const res = await handleResponse(response, "Failed to add comment");
  if (!res) return null;
  return res.json();
}

export async function markCommentAsRead(taskId, commentId) {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}/comments/${commentId}/read`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  const res = await handleResponse(response, "Failed to mark comment as read");
  if (!res) return null;
  return res.json();
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

export async function updateUserRole(userId, globalRole) {
  const response = await fetch(`${BASE_URL}/users/${userId}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ globalRole })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update user role");
  }
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

// --- Team APIs ---

export async function fetchTeams() {
  const response = await fetch(`${BASE_URL}/teams`, {
    method: "GET",
    headers: getHeaders(),
  });
  const res = await handleResponse(response, "Failed to fetch teams");
  if (!res) return [];
  return res.json();
}

export async function createTeam(name) {
  const response = await fetch(`${BASE_URL}/teams`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  const res = await handleResponse(response, "Failed to create team");
  if (!res) return null;
  return res.json();
}

export async function addMemberToTeam(teamId, userId, teamRole) {
  const response = await fetch(`${BASE_URL}/teams/${teamId}/members`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ userId, teamRole }),
  });
  await handleResponse(response, "Failed to add member");
}

export async function updateTeamMemberRole(teamId, userId, teamRole) {
  const response = await fetch(`${BASE_URL}/teams/${teamId}/members/${userId}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ teamRole }),
  });
  await handleResponse(response, "Failed to update member role");
}

export async function renameTeam(teamId, newName) {
  const response = await fetch(`${BASE_URL}/teams/${teamId}/name`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ name: newName }),
  });
  const res = await handleResponse(response, "Failed to rename team");
  if (!res) return null;
  return res.json();
}

export async function removeMemberFromTeam(teamId, userId) {
  const response = await fetch(`${BASE_URL}/teams/${teamId}/members/${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  await handleResponse(response, "Failed to remove member");
}

export async function deleteTeam(teamId) {
  const response = await fetch(`${BASE_URL}/teams/${teamId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  await handleResponse(response, "Failed to delete team");
}

// DEPRECATED API - removed moveMemberToTeam since member architecture supports multi-teams
