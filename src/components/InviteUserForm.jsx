import { useState, useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function InviteUserForm() {
  const { token, user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [managerId, setManagerId] = useState("");
  const [myTeam, setMyTeam] = useState([]);
  
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch our team to select "Reports To"
      fetch(`${BASE_URL}/users/my-team`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setMyTeam(data))
      .catch(e => setError("Failed to load team"));
    }
  }, [isOpen, token]);

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInviteLink("");
    
    try {
      const response = await fetch(`${BASE_URL}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email, role, managerId: managerId || user.id })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create invite");
      
      setInviteLink(data.inviteLink);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-all focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
        Invite Member
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Invite Team Member</h2>
              <button onClick={() => { setIsOpen(false); setInviteLink(""); }} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 text-left">
              {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
              
              {!inviteLink ? (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="coworker@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none">
                      {user.role === 'MANAGER' && <option value="ASSISTANT_MANAGER">Assistant Manager</option>}
                      {(user.role === 'MANAGER' || user.role === 'ASSISTANT_MANAGER') && <option value="TL">Team Lead</option>}
                      <option value="EMPLOYEE">Employee</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Reports To</label>
                    <select value={managerId} onChange={e => setManagerId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none">
                      <option value="">{user.name} (Me)</option>
                      {myTeam.map(member => (
                        <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm">
                    {loading ? "Generating..." : "Generate Invite Link"}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <p className="font-bold text-slate-800 mb-2">Invite Generated!</p>
                  <p className="text-sm text-slate-500 mb-4">Copy the link below and send it to your team member.</p>
                  <div className="flex items-center shadow-sm rounded-lg overflow-hidden border border-slate-200">
                    <input type="text" readOnly value={inviteLink} className="flex-1 px-3 py-2 text-sm bg-slate-50 outline-none w-full" />
                    <button onClick={() => navigator.clipboard.writeText(inviteLink)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-semibold text-sm transition-colors">
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
