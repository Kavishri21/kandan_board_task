import { useState, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import { sendInvitation, fetchMembers, toggleUserStatus, deleteUser } from "../services/api";
import AuthContext from "../context/AuthContext";
import { toast } from "react-toastify";

function DeleteConfirmationModal({ isOpen, onCancel, onConfirm, memberName, isLoading }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm transform transition-all border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800">Delete User?</h3>
        </div>
        
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-semibold text-slate-800">{memberName}</span>? 
          This action cannot be undone and all their tasks will be unassigned.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : "Delete User"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function UsersPage() {
  const { user: currentUser } = useContext(AuthContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load members on mount
  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setMembersLoading(true);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (err) {
      toast.error("Failed to load members.");
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.warn("Please enter both name and email.");
      return;
    }
    setIsLoading(true);
    try {
      await sendInvitation(name, email);
      toast.success(`Invitation sent to ${email}!`);
      setName("");
      setEmail("");
      setShowAddForm(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleStatus(member) {
    if (member.email === currentUser?.email) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    try {
      const updated = await toggleUserStatus(member.id);
      setMembers(prev => prev.map(m => m.id === member.id ? updated : m));
      toast.info(`${member.name} is now ${updated.active ? 'Active' : 'Inactive'}`);
    } catch (err) {
      toast.error("Failed to update status.");
    }
  }

  function confirmDelete(member) {
    if (member.email === currentUser?.email) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setMemberToDelete(member);
    setShowDeleteModal(true);
  }

  async function handleActualDelete() {
    if (!memberToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(memberToDelete.id);
      setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
      toast.success("User deleted successfully.");
      setShowDeleteModal(false);
    } catch (err) {
      toast.error("Failed to delete user.");
    } finally {
      setIsDeleting(false);
      setMemberToDelete(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onCancel={() => { setShowDeleteModal(false); setMemberToDelete(null); }}
        onConfirm={handleActualDelete}
        memberName={memberToDelete?.name}
        isLoading={isDeleting}
      />

      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">All Members</h1>
        <p className="text-slate-500 text-sm mt-1">Manage team access and invite new members.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
            Add members
          </h2>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Invite Member
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center animate-in fade-in slide-in-from-top-2 duration-300">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
              >
                {isLoading ? "Sending..." : "Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setName(""); setEmail(""); }}
                className="px-3 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {membersLoading ? (
              <tr>
                <td colSpan="4" className="text-center py-10">
                  <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-slate-400 text-sm">
                   No members yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-800">{member.name}</span>
                    {member.email === currentUser?.email && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded font-bold border border-blue-100">YOU</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{member.email}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(member)}
                      disabled={member.email === currentUser?.email}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        member.active ? 'bg-blue-600' : 'bg-slate-300'
                      } ${member.email === currentUser?.email ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          member.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`ml-2 text-xs font-medium ${member.active ? 'text-blue-600' : 'text-slate-400'}`}>
                      {member.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => confirmDelete(member)}
                      disabled={member.email === currentUser?.email}
                      className={`p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all ${
                        member.email === currentUser?.email ? 'opacity-0 pointer-events-none' : ''
                      }`}
                      title="Delete user"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
