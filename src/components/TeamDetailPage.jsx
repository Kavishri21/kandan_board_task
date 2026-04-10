import { useState, useEffect, useContext } from "react";
import { 
  fetchTeams, 
  fetchMembers, 
  removeMemberFromTeam,
  moveMemberToTeam 
} from "../services/api";
import AuthContext from "../context/AuthContext";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";

// --- Sub-component: Change Team Modal (Re-used/Modified) ---
function ChangeMemberModal({ isOpen, onClose, member, currentTeamId, allTeams, onMoved }) {
  const [isMoving, setIsMoving] = useState(false);
  if (!isOpen || !member) return null;

  const otherTeams = allTeams.filter(t =>
    t.id !== currentTeamId &&           // Not the current team
    t.createdByUserId !== member.id     // Not a team this member created
  );

  async function handleMove(teamId) {
    setIsMoving(true);
    try {
      await moveMemberToTeam(member.id, teamId);
      toast.success(`${member.name} moved successfully.`);
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
        <h3 className="text-lg font-bold text-slate-800 mb-1">Move to Another Team</h3>
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
                onClick={() => handleMove(team.id)}
                disabled={isMoving}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group text-left"
              >
                <span className="font-semibold text-slate-700">{team.name}</span>
                <svg className="text-slate-300 group-hover:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-50">
          <button onClick={onClose} disabled={isMoving} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-600">Cancel</button>
        </div>
      </div>
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
  const [allTeams, setAllTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [memberToChange, setMemberToChange] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);

  useEffect(() => {
    loadData();
  }, [team.id]);

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

  async function handleRemoveMember() {
    try {
      await removeMemberFromTeam(teamData.id, memberToRemove.id);
      toast.success(`${memberToRemove.name} removed from team.`);
      loadData();
    } catch (err) {
      toast.error("Failed to remove member.");
    }
  }

  const findUserById = (id) => allUsers.find(u => u.id === id);
  const isCreator = currentUser?.id === teamData.createdByUserId;

  const adminUser = findUserById(teamData.createdByUserId);
  const otherMemberIds = teamData.memberIds.filter(id => id !== teamData.createdByUserId);

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

        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">{teamData.name}</h1>
        <p className="flex items-center gap-2 text-slate-500 font-medium">
          Created by: <span className="text-slate-700 font-bold">{adminUser?.name || "System"}</span>
        </p>

        <div className="mt-12 space-y-px bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
          {/* Admin Row */}
          <div className="bg-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg shadow-blue-100 italic">
                 {adminUser?.name.charAt(0)}
               </div>
               <div>
                 <span className="font-extrabold text-slate-800 text-lg">{adminUser?.name} (You)</span>
                 <p className="text-xs text-slate-400 font-medium">{adminUser?.email}</p>
               </div>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Team Admin
            </span>
          </div>

          {/* Member Rows */}
          {otherMemberIds.length === 0 ? (
            <div className="bg-white p-12 text-center">
              <p className="text-slate-400 italic">No other members in this team.</p>
            </div>
          ) : (
            otherMemberIds.map(memberId => {
              const member = findUserById(memberId);
              if (!member) return null;
              return (
                <div key={member.id} className="bg-white px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">{member.name}</span>
                      <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                    </div>
                  </div>
                  
                  {isCreator && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setMemberToChange(member)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        Change Team
                      </button>
                      <button 
                        onClick={() => setMemberToRemove(member)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <ChangeMemberModal 
        isOpen={!!memberToChange}
        onClose={() => setMemberToChange(null)}
        member={memberToChange}
        currentTeamId={teamData.id}
        allTeams={allTeams}
        onMoved={() => loadData()}
      />

      <RemoveMemberModal 
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        member={memberToRemove}
        onConfirm={handleRemoveMember}
      />
    </div>
  );
}
