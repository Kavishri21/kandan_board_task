import { useState } from "react";
import { sendInvitation } from "../services/api";

export default function UsersPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleInvite(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg("Please enter both name and email.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await sendInvitation(name, email);
      setSuccessMsg(`Invitation sent to ${email}!`);
      setName("");
      setEmail("");
      setShowAddForm(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">All Members</h1>
        <p className="text-slate-500 text-sm mt-1">Invite new members to join your Kanban workspace.</p>
      </header>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="mb-5 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200 font-medium flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 font-medium">
          {errorMsg}
        </div>
      )}

      {/* Add Members Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 text-base flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
            Add members
          </h2>
          {!showAddForm && (
            <button
              onClick={() => { setShowAddForm(true); setErrorMsg(""); setSuccessMsg(""); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Invite Member
            </button>
          )}
        </div>

        {/* Inline Invite Form */}
        {showAddForm && (
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              autoFocus
              onChange={(e) => { setName(e.target.value); setErrorMsg(""); }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-800"
            />
            <div className="flex gap-2 shrink-0">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {isLoading ? "Sending..." : "Send Invite"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setErrorMsg(""); setName(""); setEmail(""); }}
                className="px-3 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {!showAddForm && (
          <p className="text-slate-400 text-sm">Click "Invite Member" to send an email invitation.</p>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="2" className="text-center py-10 text-slate-400 text-sm">
                No members yet. Send your first invite above!
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
