import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { fetchMembers, fetchTeams } from "../services/api";
import AuthContext from "../context/AuthContext";

function AddTaskForm(props) {
  const { user: currentUser } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("high");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Load user's teams when form opens
  useEffect(() => {
    if (isFormVisible) {
      loadTeams();
    }
  }, [isFormVisible]);

  // When user picks a team, load that team's members
  useEffect(() => {
    if (selectedTeamId) {
      loadMembersForTeam(selectedTeamId);
    } else {
      setTeamMembers([]);
      // Default to self when no team — so Assigned To always has a value
      setAssignedToId(currentUser?.id || "");
    }
  }, [selectedTeamId, currentUser?.id]);

  async function loadTeams() {
    setIsLoadingTeams(true);
    try {
      const teams = await fetchTeams();
      setUserTeams(teams);
      // Do NOT auto-select a team — let the user choose Personal Task or a team
    } catch (err) {
      console.error("Failed to load teams", err);
    } finally {
      setIsLoadingTeams(false);
    }
  }

  async function loadMembersForTeam(teamId) {
    setIsLoadingMembers(true);
    try {
      const [allMembers, allTeams] = await Promise.all([fetchMembers(), fetchTeams()]);
      const myTeam = allTeams.find(t => t.id === teamId);
      if (myTeam && myTeam.members) {
        const teamMemberIds = myTeam.members.map(m => m.userId);
        const filteredMembers = allMembers.filter(m => teamMemberIds.includes(m.id));
        setTeamMembers(filteredMembers);
        // Default assignee to self if in team, else first member
        const selfInTeam = filteredMembers.find(m => m.id === currentUser?.id);
        setAssignedToId(selfInTeam ? selfInTeam.id : (filteredMembers[0]?.id || ""));
      } else {
        setTeamMembers([]);
        setAssignedToId("");
      }
    } catch (err) {
      console.error("Failed to load team members", err);
    } finally {
      setIsLoadingMembers(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("high");
    setSelectedTeamId("");
    // Reset to self (not empty) — the selectedTeamId useEffect won't re-run
    // if teamId was already "", so we must explicitly set the default assignee here.
    setAssignedToId(currentUser?.id || "");
    setTeamMembers([]);
    setUserTeams([]);
    setError("");
    setIsFormVisible(false);
  }

  function handleAdd(e) {
    if (e) e.preventDefault();
    if (title.trim() === "") {
      setError("Please enter a title for the task.");
      return;
    }
    if (!assignedToId) {
      setError("Please select who to assign this task to.");
      return;
    }

    const newTask = {
      title,
      description,
      status: "todo",
      priority,
      userId: assignedToId,
      // Only include teamId if one is selected
      ...(selectedTeamId ? { teamId: selectedTeamId } : {}),
    };

    props.addTask(newTask);
    resetForm();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsFormVisible(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Task
      </button>

      {isFormVisible && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[100] p-4 text-left">
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">

            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-slate-800 text-xl tracking-tight">Create New Task</h2>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  type="text"
                  autoFocus
                  placeholder="What needs to be done?"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
                  value={title}
                  onChange={e => { setTitle(e.target.value); if (error) setError(""); }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Add some details..."
                  rows="2"
                  maxLength={200}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-600 resize-none"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <div className={`text-right text-xs mt-1 font-medium ${description.length >= 200 ? 'text-red-500' : description.length >= 180 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {description.length} / 200
                </div>
              </div>

              {/* Priority + Team — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none transition-all text-slate-700 bg-white cursor-pointer"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Team</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none transition-all text-slate-700 bg-white cursor-pointer"
                    value={selectedTeamId}
                    onChange={e => { setSelectedTeamId(e.target.value); if (error) setError(""); }}
                    disabled={isLoadingTeams}
                  >
                    {isLoadingTeams ? (
                      <option>Loading teams...</option>
                    ) : userTeams.length === 0 ? (
                      <option value="">No teams — Personal Task</option>
                    ) : (
                      <>
                        <option value="">Personal Task (No Team)</option>
                        {userTeams.map(team => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Assigned To — always visible; filters by team when one is selected */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assigned To *</label>
                <select
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none transition-all text-slate-700 bg-white cursor-pointer"
                  value={assignedToId}
                  onChange={e => { setAssignedToId(e.target.value); if (error) setError(""); }}
                  disabled={isLoadingMembers}
                >
                  {isLoadingMembers ? (
                    <option>Loading members...</option>
                  ) : !selectedTeamId ? (
                    // No team selected — show only Myself
                    <option value={currentUser?.id}>Myself ({currentUser?.name})</option>
                  ) : teamMembers.length === 0 ? (
                    <option value={currentUser?.id}>Myself ({currentUser?.name})</option>
                  ) : (
                    teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}{member.id === currentUser?.id ? " (Me)" : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                disabled={!title.trim() || !assignedToId}
              >
                Create Task
              </button>
            </div>

          </form>
        </div>,
        document.body
      )}
    </>
  );
}

export default AddTaskForm;