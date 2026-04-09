import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { 
  fetchTeams, 
  fetchMembers, 
  createTeam, 
  moveMemberToTeam 
} from "../services/api";
import AuthContext from "../context/AuthContext";
import { toast } from "react-toastify";

// --- Sub-component: Conflict Confirmation Modal ---
function ConflictConfirmationModal({ isOpen, onCancel, onConfirm, conflicts }) {
  if (!isOpen || conflicts.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[120] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-amber-500">
          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Members Conflict</h3>
        </div>
        
        <p className="text-slate-600 text-sm mb-4 leading-relaxed">
          Some selected members are already in other teams. Moving them will remove them from their current teams:
        </p>

        <div className="space-y-2 mb-6 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
          {conflicts.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-sm">
              <span className="font-bold text-slate-700">{c.userName}</span>
              <div className="flex items-center gap-2 text-slate-400">
                <span>{c.prevTeamName}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                <span className="text-blue-600 font-semibold">New Team</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
          >
            Confirm & Move
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Sub-component: Create Team Modal ---
function CreateTeamModal({ isOpen, onClose, allUsers, allTeams, onTeamCreated }) {
  const [teamName, setTeamName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [pendingConflicts, setPendingConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setSelectedUserIds(newSet);
  };

  async function checkConflictsAndSubmit(e) {
    if (e) e.preventDefault();
    if (!teamName.trim()) {
      setError("Team name is mandatory");
      return;
    }

    // 1. Check for conflicts
    const conflicts = [];
    selectedUserIds.forEach(uid => {
      const existingTeam = allTeams.find(t => t.memberIds.includes(uid));
      if (existingTeam) {
        const user = allUsers.find(u => u.id === uid);
        conflicts.push({ userId: uid, userName: user?.name, prevTeamName: existingTeam.name });
      }
    });

    if (conflicts.length > 0) {
      setPendingConflicts(conflicts);
      setShowConflictModal(true);
      return;
    }

    await performCreate();
  }

  async function performCreate() {
    setIsSubmitting(true);
    setError("");
    try {
      const newTeam = await createTeam(teamName, Array.from(selectedUserIds));
      toast.success(`Team "${teamName}" created!`);
      onTeamCreated(newTeam);
      onClose();
      // Reset form
      setTeamName("");
      setSelectedUserIds(new Set());
      setSearchQuery("");
      setShowConflictModal(false);
      setPendingConflicts([]);
    } catch (err) {
      toast.error("Failed to create team.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <ConflictConfirmationModal 
        isOpen={showConflictModal}
        onCancel={() => setShowConflictModal(false)}
        onConfirm={performCreate}
        conflicts={pendingConflicts}
      />
      {createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800">Create New Team</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <form onSubmit={checkConflictsAndSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team Name *</label>
                <input 
                  type="text"
                  autoFocus
                  placeholder="e.g. Frontend Squad"
                  className={`w-full border ${error ? 'border-red-300 ring-1 ring-red-100' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'} rounded-lg p-2.5 text-sm outline-none transition-all`}
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); if(error) setError(""); }}
                />
                {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Members</label>
                
                <div className="relative mb-3">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </span>
                  <input 
                    type="text"
                    placeholder="Search users..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:bg-white focus:border-blue-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-100 rounded-lg bg-slate-50/50 p-1 mb-6 space-y-1 custom-scrollbar">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No users found.</div>
                  ) : (
                    filteredUsers.map(user => (
                      <label key={user.id} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-md cursor-pointer transition-colors group">
                        <input 
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                          checked={selectedUserIds.has(user.id)}
                          onChange={() => toggleUser(user.id)}
                        />
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                             {user.name.charAt(0)}
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{user.name}</span>
                             <span className="text-[10px] text-slate-400 leading-tight">{user.email}</span>
                           </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  {isSubmitting ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// --- Sub-component: Move Member Modal ---
function ChangeMemberTeamModal({ isOpen, onClose, member, allTeams, onMoved }) {
  const [isMoving, setIsMoving] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState([]);
  
  if (!isOpen || !member) return null;

  const currentTeam = allTeams.find(t => t.memberIds.includes(member.id));
  const otherTeams = allTeams.filter(t => t.id !== currentTeam?.id);

  function checkMove(teamId) {
    if (currentTeam) {
      setConflictData([{ userId: member.id, userName: member.name, prevTeamName: currentTeam.name }]);
      setSelectedTeamId(teamId);
      setShowConflictModal(true);
    } else {
      performMove(teamId);
    }
  }

  async function performMove(teamId = selectedTeamId) {
    setIsMoving(true);
    try {
      await moveMemberToTeam(member.id, teamId);
      toast.success(`${member.name} moved to new team.`);
      onMoved(); 
      onClose();
      setShowConflictModal(false);
    } catch (err) {
      toast.error("Failed to move member.");
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <>
      <ConflictConfirmationModal 
        isOpen={showConflictModal}
        onCancel={() => setShowConflictModal(false)}
        onConfirm={() => performMove()}
        conflicts={conflictData}
      />
      {createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">Change Team</h3>
            <p className="text-slate-500 text-sm mb-5">Select a new team for <span className="font-semibold text-slate-800">{member.name}</span>.</p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto mb-6 pr-1 custom-scrollbar">
              {otherTeams.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  No other teams available.
                </div>
              ) : (
                otherTeams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => checkMove(team.id)}
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
              <button
                onClick={onClose}
                disabled={isMoving}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// --- Main TeamsPage Component ---
export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [memberToChange, setMemberToChange] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [teamsData, usersData] = await Promise.all([fetchTeams(), fetchMembers()]);
      setTeams(teamsData);
      setAllUsers(usersData);
    } catch (err) {
      toast.error("Failed to load page data.");
    } finally {
      setIsLoading(false);
    }
  }

  const findUserById = (id) => allUsers.find(u => u.id === id);

  return (
    <div className="max-w-4xl mx-auto">
      <CreateTeamModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        allUsers={allUsers}
        allTeams={teams}
        onTeamCreated={() => loadData()}
      />

      <ChangeMemberTeamModal 
        isOpen={!!memberToChange}
        onClose={() => setMemberToChange(null)}
        member={memberToChange}
        allTeams={teams}
        onMoved={() => loadData()}
      />

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

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center shadow-inner">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">No teams found</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">Create your first team to start grouping your users together for better organization.</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 font-bold hover:text-blue-700 underline"
          >
            Create your first team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-100 hover:shadow-md transition-all">
              <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center text-blue-600">
                     <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                   </div>
                   <h3 className="font-extrabold text-slate-800 text-lg">{team.name}</h3>
                 </div>
                 <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider shadow-sm">
                   {team.memberIds.length} members
                 </span>
              </div>
              
              <div className="flex-1 p-6 space-y-4">
                {team.memberIds.length === 0 ? (
                  <p className="text-slate-400 text-sm italic text-center py-4">No members assigned.</p>
                ) : (
                  team.memberIds.map(memberId => {
                    const user = findUserById(memberId);
                    return user ? (
                      <div key={user.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold border border-blue-100 shadow-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{user.name}</span>
                            <span className="text-xs text-slate-400 leading-none">{user.email}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setMemberToChange(user)}
                          className="opacity-0 group-hover:opacity-100 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50/0 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Change Team
                        </button>
                      </div>
                    ) : null;
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
