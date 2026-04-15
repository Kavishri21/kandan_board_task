import { useState, useEffect, useContext, useRef } from "react";
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 text-center">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="17" y1="8" x2="23" y2="14"></line><line x1="23" y1="8" x2="17" y2="14"></line></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Remove from Team?</h3>
        <p className="text-slate-500 text-sm mb-6">Are you sure you want to remove <span className="font-bold text-slate-700">{member.name}</span> from this team?</p>
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

// --- Sub-component: Change Team Dropdown (inline) ---
function ChangeTeamDropdown({ member, currentTeamId, allTeams, onMove }) {
  const [open, setOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const ref = useRef(null);

  // Teams this member is NOT already in
  const availableTeams = allTeams.filter(t =>
    t.id !== currentTeamId &&
    !t.members?.some(m => m.userId === member.id)
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSelect(targetTeamId) {
    setOpen(false);
    setIsMoving(true);
    try {
      // Remove from current team, then add to selected team as CONTRIBUTOR
      await removeMemberFromTeam(currentTeamId, member.id);
      await addMemberToTeam(targetTeamId, member.id, "CONTRIBUTOR");
      toast.success(`${member.name} moved to new team.`);
      onMove();
    } catch (err) {
      toast.error(err.message || "Failed to move member.");
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isMoving}
        title="Change team"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50"
      >
        {isMoving ? (
          <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        )}
        Change Team
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {availableTeams.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4 px-3">No other teams available</p>
          ) : (
            availableTeams.map(t => (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {t.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamDetailPage({ team, onBack }) {
  const { user: currentUser } = useContext(AuthContext);
  const [teamData, setTeamData] = useState(team);
  const [allUsers, setAllUsers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => { loadData(); }, [team.id]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [usersData, teamsData] = await Promise.all([fetchMembers(), fetchTeams()]);
      setAllUsers(usersData);
      setAllTeams(teamsData);
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
  const isOrgAdmin = currentUser?.globalRole === "ORG_ADMIN";
  const isManager = currentUser?.globalRole === "MANAGER";
  const isTeamLead = currentMemberRecord?.teamRole === "LEAD";
  // Can manage = any of these 3
  const canManage = isOrgAdmin || isManager || isTeamLead;

  const creatorId = teamData?.createdByUserId;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Loading team details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-left">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors group"
      >
        <svg className="transition-transform group-hover:-translate-x-1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Teams
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 mb-8 relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">{teamData.name}</h1>
          <p className="text-slate-500 font-medium">Manage team members and roles</p>
        </div>

        <div className="mt-8 space-y-px bg-slate-100 rounded-2xl border border-slate-200">
          {!teamData.members || teamData.members.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-500">No members found.</div>
          ) : (
            teamData.members.map((memberObj, index) => {
              const member = findUserById(memberObj.userId);
              if (!member) return null;

              const isCurrentUser = member.id === currentUser?.id;
              const isCreator = member.id === creatorId;

              return (
                <div 
                  key={member.id} 
                  className={`bg-white px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group
                    ${index === 0 ? 'rounded-t-2xl' : ''} 
                    ${index === teamData.members.length - 1 ? 'rounded-b-2xl' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold uppercase">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">
                        {member.name} {isCurrentUser && "(You)"}
                        {isCreator && (
                          <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Creator</span>
                        )}
                      </span>
                      <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role dropdown (for leads/admins) or static badge */}
                    {canManage ? (
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
                        memberObj.teamRole === "LEAD" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {memberObj.teamRole.replace("_", " ")}
                      </span>
                    )}

                    {/* Change Team — visible to canManage, but NOT for the creator */}
                    {canManage && !isCreator && (
                      <ChangeTeamDropdown
                        member={member}
                        currentTeamId={teamData.id}
                        allTeams={allTeams}
                        onMove={loadData}
                      />
                    )}

                    {/* Remove button — visible to canManage, NOT for creator */}
                    {canManage && !isCreator && (
                      <button
                        onClick={() => setMemberToRemove(member)}
                        className="w-9 h-9 rounded-xl flex border border-red-100 items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                        title="Remove Member"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <RemoveMemberModal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        member={memberToRemove}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}
