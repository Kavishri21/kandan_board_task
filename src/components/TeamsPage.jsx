import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import {
  fetchTeams,
  fetchMembers,
  createTeam,
  moveMemberToTeam,
  addMembersToTeam,
  renameTeam,
  deleteTeam
} from "../services/api";
import AuthContext from "../context/AuthContext";
import { toast } from "react-toastify";

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Build the list of users not currently in ANY team.
// These are the only users available to be added as regular members.
// The currentUserId is excluded — they are always shown as the locked creator.
// ─────────────────────────────────────────────────────────────────────────────
function buildAvailableUsers(allTeams, allUsers, currentUserId) {
  const usedUserIds = new Set(allTeams.flatMap(t => t.memberIds));
  return allUsers.filter(u => !usedUserIds.has(u.id) && u.id !== currentUserId);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: User Selection List
// Shows the creator as locked + all available (free) users as selectable.
// ─────────────────────────────────────────────────────────────────────────────
function UserSelectionList({ users, selectedUserIds, onToggleUser, searchQuery, onSearchChange, creatorId, creatorUser }) {
  const filteredFreeUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
        <input
          type="text"
          placeholder="Search users..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50/50 p-1 mb-6 space-y-1 custom-scrollbar">
        {/* Always show creator at top, locked */}
        {creatorUser && (
          <label className="flex items-center gap-3 p-2.5 bg-blue-50/60 rounded-md border border-blue-100 mb-2 cursor-default">
            <input
              type="checkbox"
              className="w-4 h-4 rounded text-blue-600 border-slate-300 opacity-60"
              checked={true}
              disabled={true}
              readOnly
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-blue-700">
                {creatorUser.name}
                <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">You — Team Admin</span>
              </span>
              <span className="text-[10px] text-slate-400 leading-tight">{creatorUser.email}</span>
            </div>
          </label>
        )}

        {filteredFreeUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            {users.length === 0
              ? "All users are already assigned to teams."
              : "No users match your search."}
          </div>
        ) : (
          filteredFreeUsers.map(user => (
            <label key={user.id} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-md cursor-pointer transition-colors group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                checked={selectedUserIds.has(user.id)}
                onChange={() => onToggleUser(user.id)}
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{user.name}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{user.email}</span>
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
// - Creator is auto-added and locked.
// - Only "free" users (not in any team) appear in the list.
// - Requires minimum 2 members (creator + at least 1 other).
// - NO conflict detection needed — the list is pre-filtered.
// ─────────────────────────────────────────────────────────────────────────────
function CreateTeamModal({ isOpen, onClose, allUsers, allTeams, onTeamCreated, currentUser }) {
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setTeamName("");
      setSearchQuery("");
      setSelectedUserIds(new Set());
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Users available for selection: not in any team, not the creator
  const availableUsers = buildAvailableUsers(allTeams, allUsers, currentUser?.id);
  const creatorUser = allUsers.find(u => u.id === currentUser?.id);

  const toggleUser = (userId) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) newSet.delete(userId);
    else newSet.add(userId);
    setSelectedUserIds(newSet);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Team name is required.");
      return;
    }
    // Minimum 2 members: creator + at least 1 selected
    if (selectedUserIds.size < 1) {
      setError("Please add at least one more member (minimum 2 people per team).");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      // Creator is always first in memberIds, then selected users
      const memberIds = [currentUser.id, ...Array.from(selectedUserIds)];
      await createTeam(teamName, currentUser.id, memberIds);
      toast.success(`Team "${teamName}" created!`);
      onTeamCreated();
      onClose();
    } catch (err) {
      toast.error("Failed to create team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-slate-800">Create New Team</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team Name *</label>
            <input
              type="text"
              autoFocus
              placeholder="e.g. Frontend Squad"
              className={`w-full border ${error ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'} rounded-lg p-2.5 text-sm outline-none transition-all`}
              value={teamName}
              onChange={(e) => { setTeamName(e.target.value); if (error) setError(""); }}
            />
            {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
          </div>

          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Add Members ({selectedUserIds.size} selected)
          </label>

          <UserSelectionList
            users={availableUsers}
            selectedUserIds={selectedUserIds}
            onToggleUser={toggleUser}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            creatorId={currentUser?.id}
            creatorUser={creatorUser}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
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
// Add Members Modal
// - Only "free" users (not in any team at all) appear in the list.
// - NO conflict detection needed — pre-filtered list guarantees availability.
// ─────────────────────────────────────────────────────────────────────────────
function AddMembersModal({ isOpen, onClose, team, allUsers, allTeams, onMembersAdded, currentUser }) {
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds(new Set());
      setSearchQuery("");
    }
  }, [isOpen]);

  if (!isOpen || !team) return null;

  // All users not in ANY team (free users), also excludes current user (team creator)
  const availableUsers = buildAvailableUsers(allTeams, allUsers, currentUser?.id);

  const toggleUser = (userId) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) newSet.delete(userId);
    else newSet.add(userId);
    setSelectedUserIds(newSet);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (selectedUserIds.size === 0) {
      toast.warn("Please select at least one member to add.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addMembersToTeam(team.id, Array.from(selectedUserIds));
      toast.success(`Members added to "${team.name}"!`);
      onMembersAdded();
      onClose();
    } catch (err) {
      toast.error("Failed to add members.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all border border-slate-200 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add Members</h2>
            <p className="text-slate-400 text-xs font-medium">Adding to <span className="text-blue-600 italic">{team.name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Available Users ({selectedUserIds.size} selected)
        </label>

        <UserSelectionList
          users={availableUsers}
          selectedUserIds={selectedUserIds}
          onToggleUser={toggleUser}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedUserIds.size === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Adding..." : "Add Members"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Change Member Team Modal
// - Shows only teams where the member is NOT the creator.
// - No conflict modal needed: moving a regular member out of one team into another
//   is handled directly by the backend (removeUserFromAnyTeam).
// ─────────────────────────────────────────────────────────────────────────────
function ChangeMemberTeamModal({ isOpen, onClose, member, allTeams, onMoved }) {
  const [isMoving, setIsMoving] = useState(false);

  if (!isOpen || !member) return null;

  // The member's current team (where they are a regular member, not creator)
  const currentTeam = allTeams.find(t =>
    t.memberIds.includes(member.id) && t.createdByUserId !== member.id
  );

  // Eligible target teams:
  // 1. Not the current team
  // 2. Not a team where this member is the creator
  const eligibleTeams = allTeams.filter(t =>
    t.id !== currentTeam?.id &&
    t.createdByUserId !== member.id
  );

  async function handleMove(teamId) {
    setIsMoving(true);
    const targetTeam = allTeams.find(t => t.id === teamId);
    try {
      await moveMemberToTeam(member.id, teamId);
      toast.success(`${member.name} moved to "${targetTeam?.name}".`);
      onMoved();
      onClose();
    } catch (err) {
      toast.error("Failed to move member.");
    } finally {
      setIsMoving(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">Change Team</h3>
        <p className="text-slate-500 text-sm mb-5">Select a new team for <span className="font-semibold text-slate-800">{member.name}</span>.</p>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-6 pr-1 custom-scrollbar">
          {eligibleTeams.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No other teams available to move this member to.
            </div>
          ) : (
            eligibleTeams.map(team => (
              <button
                key={team.id}
                onClick={() => handleMove(team.id)}
                disabled={isMoving}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </div>
                  <span className="font-semibold text-slate-700">{team.name}</span>
                </div>
                <svg className="text-slate-300 group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-50">
          <button onClick={onClose} disabled={isMoving} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
        </div>
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

  useEffect(() => {
    if (isOpen && team) setNewName(team.name);
  }, [isOpen, team]);

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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Rename Team</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            autoFocus
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm mb-6 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[130] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-7 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all border border-slate-100 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 mb-2">Delete Team?</h3>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-slate-700 italic">"{team.name}"</span>? All members will become unassigned. This cannot be undone.
        </p>
        <div className="flex flex-col w-full gap-2">
          <button disabled={isDeleting} onClick={handleDelete} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md shadow-red-100 transition-all active:scale-95 disabled:opacity-50">
            {isDeleting ? "Deleting..." : "Delete Team"}
          </button>
          <button disabled={isDeleting} onClick={onClose} className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
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
  const [memberToChange, setMemberToChange] = useState(null);
  const [teamToAddMembers, setTeamToAddMembers] = useState(null);
  const [teamToRename, setTeamToRename] = useState(null);
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

  const findUserById = (id) => allUsers.find(u => u.id === id);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        allUsers={allUsers}
        allTeams={teams}
        onTeamCreated={() => loadData()}
        currentUser={currentUser}
      />

      <AddMembersModal
        isOpen={!!teamToAddMembers}
        onClose={() => setTeamToAddMembers(null)}
        team={teamToAddMembers}
        allUsers={allUsers}
        allTeams={teams}
        onMembersAdded={() => loadData()}
        currentUser={currentUser}
      />

      <RenameTeamModal
        isOpen={!!teamToRename}
        onClose={() => setTeamToRename(null)}
        team={teamToRename}
        onRenamed={() => loadData()}
      />

      <DeleteTeamConfirmModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        team={teamToDelete}
        onDeleted={() => loadData()}
      />

      <ChangeMemberTeamModal
        isOpen={!!memberToChange}
        onClose={() => setMemberToChange(null)}
        member={memberToChange}
        allTeams={teams}
        onMoved={() => loadData()}
      />

      {/* Page Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Teams</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Group users and manage team assignments.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Team
        </button>
      </header>

      {/* Body */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center shadow-inner">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">No teams yet</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">Create your first team to start organizing your users.</p>
          <button onClick={() => setShowCreateModal(true)} className="text-blue-600 font-bold hover:text-blue-700 underline">
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map(team => {
            const creatorUser = findUserById(team.createdByUserId);
            const isMyTeam = currentUser?.id === team.createdByUserId;

            return (
              <div key={team.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-100 hover:shadow-md transition-all">
                {/* Card Header */}
                <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                      </div>
                      <div>
                        <h3
                          onClick={() => onViewTeam(team)}
                          className="font-extrabold text-slate-800 text-lg cursor-pointer hover:text-blue-600 hover:underline transition-colors"
                        >
                          {team.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Created by: <span className="text-slate-600">{creatorUser?.name || "System"}</span>
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
                      {team.memberIds.length} member{team.memberIds.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Creator-only action bar */}
                  {isMyTeam && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => setTeamToRename(team)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        Edit Name
                      </button>
                      <button
                        onClick={() => setTeamToAddMembers(team)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-all shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Members
                      </button>
                      <button
                        onClick={() => setTeamToDelete(team)}
                        className="ml-auto p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Team"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body: clickable "view" hint */}
                <div
                  onClick={() => onViewTeam(team)}
                  className="flex-1 p-5 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                  <svg className="group-hover:text-blue-400 transition-colors" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <span className="group-hover:text-blue-500 transition-colors">
                    {team.memberIds.length} member{team.memberIds.length !== 1 ? "s" : ""} — click to view
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
