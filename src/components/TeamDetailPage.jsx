import { useState, useEffect, useContext } from "react";
import { 
  fetchTeams, 
  fetchMembers, 
  addMemberToTeam,
  updateTeamMemberRole,
  removeMemberFromTeam
} from "../services/api";
import AuthContext from "../context/AuthContext";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

// --- Sub-component: Add Member Modal ---
function AddMemberModal({ isOpen, onClose, currentTeamId, allUsers, currentMembers, onAdded }) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [teamRole, setTeamRole] = useState("CONTRIBUTOR");
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  // Filter out users already in the team
  const availableUsers = allUsers.filter(u => !currentMembers.some(m => m.userId === u.id));

  async function handleAdd(e) {
    e.preventDefault();
    if (!selectedUserId) {
      toast.warn("Please select a user.");
      return;
    }
    setIsAdding(true);
    try {
      await addMemberToTeam(currentTeamId, selectedUserId, teamRole);
      toast.success("Member added securely.");
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to add member.");
    } finally {
      setIsAdding(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-1">Add Member</h3>
        <p className="text-slate-500 text-sm mb-5">Assign a new member and role to this team.</p>
        
        <div className="space-y-4 mb-6">
          {availableUsers.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No available users to add.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">User</label>
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Select a user...</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Team Role</label>
                <select 
                  value={teamRole} 
                  onChange={(e) => setTeamRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="CONTRIBUTOR">Contributor</option>
                  <option value="LEAD">Team Lead</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
          <button type="button" onClick={onClose} disabled={isAdding} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">Cancel</button>
          {availableUsers.length > 0 && (
             <button type="submit" disabled={isAdding} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
               {isAdding ? "Adding..." : "Add Member"}
             </button>
          )}
        </div>
      </form>
    </div>,
    document.body
  );
}

// --- Sub-component: Remove Confirmation Modal ---
function RemoveMemberModal({ isOpen, onClose, member, onConfirm }) {
  const [isRemoving, setIsRemoving] = useState(false);
  if (!isOpen || !member) return null;

  async function handleRemove() {
    setIsRemoving(true);
    await onConfirm();
    setIsRemoving(false);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm transform transition-all border border-slate-200 text-center animate-in zoom-in-95 duration-200">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" y1="8" x2="23" y2="14"></line><line x1="23" y1="8" x2="17" y2="14"></line></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Remove from Team?</h3>
        <p className="text-slate-500 text-sm mb-6">Are you sure you want to remove <span className="font-bold text-slate-700">{member.name}</span> from this team? They will become unassigned.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={handleRemove} disabled={isRemoving} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-md active:scale-95">
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function TeamDetailPage({ team, onBack }) {
  const { user: currentUser } = useContext(AuthContext);
  const [teamData, setTeamData] = useState(team);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    loadData();
  }, [team.id]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [usersData, teamsData] = await Promise.all([fetchMembers(), fetchTeams()]);
      setAllUsers(usersData);
      
      const freshTeam = teamsData.find(t => t.id === team.id);
      if (freshTeam) setTeamData(freshTeam);
    } catch (err) {
      toast.error("Failed to load team details.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveConfirm() {
    try {
      await removeMemberFromTeam(teamData.id, memberToRemove.id);
      toast.success(`${memberToRemove.name} removed from team.`);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to remove member.");
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await updateTeamMemberRole(teamData.id, userId, newRole);
      toast.success("Role updated successfully.");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update role. Last LEAD protection blocked this.");
    }
  }

  const findUserById = (id) => allUsers.find(u => u.id === id);

  const currentMemberRecord = teamData?.members?.find(m => m.userId === currentUser?.id);
  const isLead = currentUser?.globalRole === 'ORG_ADMIN' || currentMemberRecord?.teamRole === 'LEAD';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Loading team details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-left animate-in fade-in duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors group"
      >
        <svg className="transition-transform group-hover:-translate-x-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Teams
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </div>

        <div className="flex justify-between items-center mb-8">
           <div>
             <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">{teamData.name}</h1>
             <p className="text-slate-500 font-medium">Manage team members and roles</p>
           </div>
           {isLead && (
             <button 
               onClick={() => setShowAddModal(true)}
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 z-10"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
               Add Member
             </button>
           )}
        </div>

        <div className="mt-8 space-y-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
          {!teamData.members || teamData.members.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-500">
               No members found.
            </div>
          ) : (
            teamData.members.map(memberObj => {
              const member = findUserById(memberObj.userId);
              if (!member) return null;
              
              const isCurrentUser = member.id === currentUser?.id;

              return (
                <div key={member.id} className="bg-white px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">{member.name} {isCurrentUser && "(You)"}</span>
                      <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Role display or dropdown */}
                    {isLead ? (
                      <select 
                         value={memberObj.teamRole}
                         onChange={(e) => handleRoleChange(member.id, e.target.value)}
                         className="border border-slate-200 text-sm font-medium rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-100 outline-none text-slate-700"
                      >
                         <option value="CONTRIBUTOR">Contributor</option>
                         <option value="LEAD">Team Lead</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest border ${
                        memberObj.teamRole === 'LEAD' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                         {memberObj.teamRole.replace('_', ' ')}
                      </span>
                    )}

                    {/* Remove button */}
                    {isLead && (
                      <button 
                        onClick={() => setMemberToRemove(member)}
                         className="w-10 h-10 rounded-xl flex border border-red-100 items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                         title="Remove Member"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <AddMemberModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        currentTeamId={teamData.id}
        allUsers={allUsers}
        currentMembers={teamData.members || []}
        onAdded={() => loadData()}
      />

      <RemoveMemberModal 
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        member={memberToRemove}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
