import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import {
  fetchTeams,
  fetchMembers,
  createTeam,
  addMemberToTeam,
  renameTeam,
  deleteTeam
} from "../services/api";
import AuthContext from "../context/AuthContext";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: User Search + Multi-Select List
// ─────────────────────────────────────────────────────────────────────────────
function UserSelectionList({ users, selectedUserIds, onToggleUser, searchQuery, onSearchChange, lockedUser }) {
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </span>
        <input
          type="text"
          placeholder="Search users..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="overflow-y-auto border border-slate-100 rounded-lg bg-slate-50/50 p-1 space-y-1" style={{ maxHeight: 220, minHeight: 80 }}>
        {lockedUser && (
          <label className="flex items-center gap-3 p-2.5 bg-blue-50/60 rounded-md border border-blue-100 mb-1 cursor-default">
            <input type="checkbox" checked readOnly disabled className="w-4 h-4 rounded border-slate-300 opacity-60" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-blue-700">
                {lockedUser.name}
                <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">You — Lead</span>
              </span>
              <span className="text-[10px] text-slate-400">{lockedUser.email}</span>
            </div>
          </label>
        )}

        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-sm">
            {users.length === 0 ? "No other users available to add." : "No users match your search."}
          </div>
        ) : (
          filtered.map(user => (
            <label key={user.id} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-md cursor-pointer transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                checked={selectedUserIds.has(user.id)}
                onChange={() => onToggleUser(user.id)}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{user.name}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Team Modal
// ─────────────────────────────────────────────────────────────────────────────
function CreateTeamModal({ isOpen, onClose, allUsers, onTeamCreated, currentUser }) {
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) { setTeamName(""); setSearchQuery(""); setSelectedUserIds(new Set()); setError(""); }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectableUsers = allUsers.filter(u => u.id !== currentUser?.id);
  const creatorUser = allUsers.find(u => u.id === currentUser?.id);

  const toggleUser = (userId) => {
    const next = new Set(selectedUserIds);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSelectedUserIds(next);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!teamName.trim()) { setError("Team name is required."); return; }
    setIsSubmitting(true);
    setError("");
    try {
      const newTeam = await createTeam(teamName);
      await Promise.all(Array.from(selectedUserIds).map(uid => addMemberToTeam(newTeam.id, uid, "CONTRIBUTOR")));
      toast.success(`Team "${teamName}" created with ${selectedUserIds.size + 1} member(s)!`);
      onTeamCreated();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-slate-800">Create New Team</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team Name *</label>
            <input
              type="text" autoFocus placeholder="e.g. Frontend Squad"
              className={`w-full border ${error ? 'border-red-300' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'} rounded-lg p-2.5 text-sm outline-none transition-all`}
              value={teamName}
              onChange={e => { setTeamName(e.target.value); if (error) setError(""); }}
            />
            {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Add Members <span className="normal-case font-normal text-slate-400">({selectedUserIds.size} selected)</span>
            </label>
            <UserSelectionList
              users={selectableUsers}
              selectedUserIds={selectedUserIds}
              onToggleUser={toggleUser}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              lockedUser={creatorUser}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all">
              {isSubmitting ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Members to existing Team Modal
// ─────────────────────────────────────────────────────────────────────────────
function AddMembersModal({ isOpen, onClose, team, allUsers, onMembersAdded }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setSearchQuery(""); setSelectedUserIds(new Set()); }
  }, [isOpen]);

  if (!isOpen || !team) return null;

  // Users not already in this team
  const existingMemberIds = new Set((team.members || []).map(m => m.userId));
  const availableUsers = allUsers.filter(u => !existingMemberIds.has(u.id));

  const toggleUser = (userId) => {
    const next = new Set(selectedUserIds);
    next.has(userId) ? next.delete(userId) : next.add(userId);
    setSelectedUserIds(next);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedUserIds.size === 0) { toast.warn("Please select at least one member."); return; }
    setIsSubmitting(true);
    try {
      await Promise.all(Array.from(selectedUserIds).map(uid => addMemberToTeam(team.id, uid, "CONTRIBUTOR")));
      toast.success(`${selectedUserIds.size} member(s) added to "${team.name}"!`);
      onMembersAdded();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to add members.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add Members</h2>
            <p className="text-slate-400 text-xs font-medium mt-0.5">Adding to <span className="text-blue-600 italic">{team.name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Available Users <span className="normal-case font-normal text-slate-400">({selectedUserIds.size} selected)</span>
            </label>
            <UserSelectionList
              users={availableUsers}
              selectedUserIds={selectedUserIds}
              onToggleUser={toggleUser}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || selectedUserIds.size === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Adding..." : `Add ${selectedUserIds.size > 0 ? selectedUserIds.size : ""} Member${selectedUserIds.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rename Team Modal
// ─────────────────────────────────────────────────────────────────────────────
function RenameTeamModal({ isOpen, onClose, team, onRenamed }) {
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (isOpen && team) setNewName(team.name); }, [isOpen, team]);
  if (!isOpen || !team) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!newName.trim() || newName === team.name) return onClose();
    setIsSubmitting(true);
    try {
      await renameTeam(team.id, newName);
      toast.success("Team renamed!");
      onRenamed();
      onClose();
    } catch (err) {
      toast.error("Failed to rename team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Rename Team</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text" autoFocus
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mb-6 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 active:scale-95 disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete Team Confirmation Modal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteTeamConfirmModal({ isOpen, onClose, team, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  if (!isOpen || !team) return null;

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTeam(team.id);
      toast.success(`Team "${team.name}" deleted.`);
      onDeleted();
      onClose();
    } catch (err) {
      toast.error("Failed to delete team.");
    } finally {
      setIsDeleting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[130] p-4 text-left">
      <div className="bg-white p-7 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Team?</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-slate-700 italic">"{team.name}"</span>? This cannot be undone.
        </p>
        <div className="flex flex-col w-full gap-2">
          <button disabled={isDeleting} onClick={handleDelete} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50">
            {isDeleting ? "Deleting..." : "Delete Team"}
          </button>
          <button disabled={isDeleting} onClick={onClose} className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Team Card
// ─────────────────────────────────────────────────────────────────────────────
function TeamCard({ team, currentUser, allUsers, isOrgAdmin, onViewTeam, onRename, onAddMembers, onDelete }) {
  const creatorUser = allUsers.find(u => u.id === team.createdByUserId);
  const myMembership = team.members?.find(m => m.userId === currentUser?.id);
  const isLead = isOrgAdmin || myMembership?.teamRole === "LEAD";
  const memberCount = team.members?.length || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-100 transition-all overflow-hidden">
      {/* ── Top: Team icon + name + 3 action icons ── */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: icon + name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-800 text-lg leading-tight truncate">{team.name}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Created by: <span className="text-slate-600 font-semibold">{creatorUser?.name || "System"}</span>
                {myMembership && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${myMembership.teamRole === "LEAD" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    {myMembership.teamRole}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Right: 3 action icons (only for leads/admins) */}
          {isLead && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Edit Name */}
              <button
                onClick={() => onRename(team)}
                title="Edit team name"
                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>

              {/* Add Member */}
              <button
                onClick={() => onAddMembers(team)}
                title="Add members"
                className="p-2 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </button>

              {/* Delete — only ORG_ADMIN */}
              {isOrgAdmin && (
                <button
                  onClick={() => onDelete(team)}
                  title="Delete team"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-slate-100 mx-5" />

      {/* ── Bottom: member count + click to view ── */}
      <div
        onClick={() => onViewTeam(team)}
        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-2">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {(team.members || []).slice(0, 3).map((m, i) => {
              const u = allUsers.find(u => u.id === m.userId);
              return (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold uppercase"
                >
                  {u?.name?.[0] || "?"}
                </div>
              );
            })}
            {memberCount > 3 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-[10px] font-bold">
                +{memberCount - 3}
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-slate-500">
            {memberCount} member{memberCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-500 transition-colors text-xs font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Click to view
          <svg className="group-hover:translate-x-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main TeamsPage Component
// ─────────────────────────────────────────────────────────────────────────────
export default function TeamsPage({ onViewTeam }) {
  const { user: currentUser } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamToRename, setTeamToRename] = useState(null);
  const [teamToAddMembers, setTeamToAddMembers] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [usersData, teamsData] = await Promise.all([fetchMembers(), fetchTeams()]);
      setAllUsers(usersData);
      setTeams(teamsData);
    } catch (err) {
      toast.error("Failed to load teams.");
    } finally {
      setIsLoading(false);
    }
  }

  const isOrgAdmin = currentUser?.globalRole === "ORG_ADMIN";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        allUsers={allUsers}
        onTeamCreated={loadData}
        currentUser={currentUser}
      />
      <AddMembersModal
        isOpen={!!teamToAddMembers}
        onClose={() => setTeamToAddMembers(null)}
        team={teamToAddMembers}
        allUsers={allUsers}
        onMembersAdded={loadData}
      />
      <RenameTeamModal
        isOpen={!!teamToRename}
        onClose={() => setTeamToRename(null)}
        team={teamToRename}
        onRenamed={loadData}
      />
      <DeleteTeamConfirmModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        team={teamToDelete}
        onDeleted={loadData}
      />

      {/* Page Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Teams</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Group users and manage team assignments.</p>
        </div>
        {isOrgAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Team
          </button>
        )}
      </header>

      {/* Body */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">No teams yet</h3>
          {isOrgAdmin ? (
            <>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">Create your first team to start organizing users.</p>
              <button onClick={() => setShowCreateModal(true)} className="text-blue-600 font-bold hover:text-blue-700 underline">
                Create your first team
              </button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">You have not been added to any teams yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              currentUser={currentUser}
              allUsers={allUsers}
              isOrgAdmin={isOrgAdmin}
              onViewTeam={onViewTeam}
              onRename={setTeamToRename}
              onAddMembers={setTeamToAddMembers}
              onDelete={setTeamToDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
