import { useState, useRef, useEffect, useContext } from "react";
import { createPortal } from "react-dom";
import TaskContext from "../context/TaskContext";

function DeleteCommentModal({ isOpen, onConfirm, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  async function handleConfirm() {
    setIsDeleting(true);
    await onConfirm();
    setIsDeleting(false);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 text-center transform transition-all animate-in zoom-in duration-200">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </div>
        <h3 className="text-lg font-black text-slate-800 mb-2">Delete Comment?</h3>
        <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">
          Are you sure you want to delete this comment? This action is permanent and cannot be undone.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase text-xs tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={isDeleting} 
            className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-md active:scale-95 disabled:opacity-50 uppercase text-xs tracking-widest"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TaskDetailsModal(props) {
  const { task, currentUser, teamMembers, initialTab, closeModal } = props;
  const { addComment, markCommentAsRead, updateComment, deleteComment } = useContext(TaskContext);
  
  const [activeTab, setActiveTab] = useState(initialTab || "tasks");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [mentionIndex, setMentionIndex] = useState(-1);
  const commentInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Scroll to bottom of comments when tab changes or new comment added
  useEffect(() => {
    if (activeTab === "tasks") {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        
        // Mark unread mentions as read when opening the tasks tab
        if (task.comments) {
            task.comments.forEach(comment => {
                const isRequiredReader = (task.userId === currentUser?.id) || (comment.mentionedUserIds?.includes(currentUser?.id));
                if (isRequiredReader && comment.authorId !== currentUser?.id && !comment.readBy?.includes(currentUser?.id)) {
                    markCommentAsRead(task.id, comment.id);
                }
            });
        }
    }
  }, [activeTab, task.comments?.length]);

  // Handle Tab Change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return "Unknown time";
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusLabel = (statusStr) => {
    switch (statusStr) {
      case "todo": return "To Do";
      case "inprogress": return "In Progress";
      case "done": return "Done";
      case "backlog": return "Backlog";
      default: return statusStr;
    }
  };

  const statusColors = {
    "todo": "bg-blue-50 text-blue-700 border-blue-200",
    "inprogress": "bg-purple-50 text-purple-700 border-purple-200",
    "done": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "backlog": "bg-red-50 text-red-700 border-red-200"
  };

  // Comment logic
  const handleCommentChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setCommentText(value);

    // Detect @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    
    const members = teamMembers || [];
    if (lastAtIdx !== -1 && !textBeforeCursor.substring(lastAtIdx).includes(" ")) {
        const query = textBeforeCursor.substring(lastAtIdx + 1);
        setMentionQuery(query);
        const filtered = members.filter(m => 
            m && m.name && m.name.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredMembers(filtered);
        setShowMentions(filtered.length > 0);
        setMentionIndex(0);
    } else {
        setShowMentions(false);
    }
  };

  const selectMention = (member) => {
    if (!member) return;
    const cursorPosition = commentInputRef.current.selectionStart;
    const textBeforeCursor = commentText.substring(0, cursorPosition);
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = commentText.substring(cursorPosition);
    
    const newText = textBeforeCursor.substring(0, lastAtIdx) + "@" + member.name + " " + textAfterCursor;
    setCommentText(newText);
    setShowMentions(false);
    
    // Focus back and set cursor
    setTimeout(() => {
        if (commentInputRef.current) {
            commentInputRef.current.focus();
            const newCursorPos = lastAtIdx + member.name.length + 2; // +1 for @, +1 for space
            commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    // Extract mentioned user IDs from text
    const mentionedIds = [];
    teamMembers.forEach(m => {
        if (commentText.includes(`@${m.name}`)) {
            mentionedIds.push(m.id);
        }
    });

    const newComment = {
        text: commentText,
        mentionedUserIds: mentionedIds
    };

    try {
        await addComment(task.id, newComment);
        setCommentText("");
    } catch (err) {
        console.error(err);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveEditedComment = async (commentId) => {
    if (!editingCommentText.trim()) return;

    // Extract mentions
    const mentionedIds = [];
    teamMembers.forEach(m => {
        if (editingCommentText.includes(`@${m.name}`)) {
            mentionedIds.push(m.id);
        }
    });

    try {
        await updateComment(task.id, commentId, {
            text: editingCommentText,
            mentionedUserIds: mentionedIds
        });
        setEditingCommentId(null);
        setEditingCommentText("");
    } catch (err) {
        console.error(err);
    }
  };

  const handleDeleteComment = (comment) => {
    setCommentToDelete(comment);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
        await deleteComment(task.id, commentToDelete.id);
        setCommentToDelete(null);
    } catch (err) {
        console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (showMentions) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setMentionIndex(prev => (prev + 1) % filteredMembers.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            if (filteredMembers[mentionIndex]) selectMention(filteredMembers[mentionIndex]);
        } else if (e.key === "Escape") {
            setShowMentions(false);
        }
    } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitComment();
    }
  };

  // Helper to render text with links and mentions
  const renderCommentText = (text) => {
    // Regex for URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split text into parts
    let parts = [text];
    
    // Handle Mentions first (since they are more specific)
    teamMembers.forEach(m => {
        const mentionStr = `@${m.name}`;
        const newParts = [];
        parts.forEach(part => {
            if (typeof part !== 'string') {
                newParts.push(part);
                return;
            }
            const subparts = part.split(mentionStr);
            for (let i = 0; i < subparts.length; i++) {
                newParts.push(subparts[i]);
                if (i < subparts.length - 1) {
                    newParts.push(
                        <span key={m.id + i} className="font-black text-blue-600 bg-blue-50 px-1 rounded">
                            {mentionStr}
                        </span>
                    );
                }
            }
        });
        parts = newParts;
    });

    // Handle Links
    const finalParts = [];
    parts.forEach(part => {
        if (typeof part !== 'string') {
            finalParts.push(part);
            return;
        }
        const subparts = part.split(urlRegex);
        subparts.forEach((sub, i) => {
            if (sub.match(urlRegex)) {
                finalParts.push(
                    <a key={i} href={sub} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">
                        {sub}
                    </a>
                );
            } else {
                finalParts.push(sub);
            }
        });
    });

    return finalParts;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all border border-slate-200 overflow-hidden text-left">
        
        {/* Header with Tabs */}
        <div className="px-8 pt-6 border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Task Details</h2>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                {task.taskID ? `${task.taskID} - ` : ""}{task.title}
              </h1>
            </div>
            <button 
              onClick={closeModal}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => handleTabChange("tasks")}
              className={`pb-4 text-sm font-black tracking-widest uppercase transition-all relative ${activeTab === "tasks" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              Tasks
              {activeTab === "tasks" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
            </button>
            <div className="h-6 w-px bg-slate-200 mb-4" />
            <button 
              onClick={() => handleTabChange("activity")}
              className={`pb-4 text-sm font-black tracking-widest uppercase transition-all relative ${activeTab === "activity" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
            >
              Activity
              {activeTab === "activity" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
          {activeTab === "activity" ? (
            <div className="p-8 overflow-y-auto">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Status Update</th>
                      <th className="px-6 py-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {task.statusHistory?.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{h.changedBy}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md border text-[11px] font-bold ${statusColors[h.status]}`}>
                            {getStatusLabel(h.status)}
                          </span>
                          {h.reason && <span className="ml-2 text-slate-400 italic">({h.reason})</span>}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 font-medium">{formatTime(h.changedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Section: Details */}
              <div className="w-2/5 border-r border-slate-100 p-8 overflow-y-auto space-y-8">
                <section>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
                    Description
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {task.description || <span className="italic text-slate-300">No description provided</span>}
                  </p>
                </section>

                <div className="grid grid-cols-2 gap-6">
                  <section>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Priority</h3>
                    <div className={`inline-block px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider border shadow-sm ${
                      task.priority === "high" ? "bg-red-50 text-red-600 border-red-100" :
                      task.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}>
                      {task.priority || "Medium"}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Due Date</h3>
                    {task.dueDate ? (
                      <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-slate-300 italic text-sm font-medium">No due date</span>
                    )}
                  </section>
                </div>
              </div>

              {/* Right Section: Comments */}
              <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
                {/* Comment Input */}
                <div className="p-6 border-b border-slate-100 bg-white shrink-0 z-20">
                  <div className="relative">
                    <textarea 
                        ref={commentInputRef}
                        value={commentText}
                        onChange={handleCommentChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a comment... (use @ to mention)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none h-24"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Press Enter to send</p>
                        <button 
                            onClick={submitComment}
                            disabled={!commentText.trim()}
                            className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md hover:bg-blue-700 transition-all disabled:opacity-30 active:scale-95"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>

                    {/* Mentions Dropdown - Positioned below the input */}
                    {showMentions && filteredMembers.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] overflow-hidden py-1 border-t-2 border-t-blue-500">
                            {filteredMembers.map((m, i) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => selectMention(m)}
                                    className={`w-full text-left px-4 py-2 text-sm font-bold flex items-center gap-2 ${i === mentionIndex ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                                >
                                    <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] uppercase">
                                        {m.name.charAt(0)}
                                    </div>
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    )}
                  </div>
                </div>

                {/* Comment Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {task.comments?.length > 0 ? (
                    task.comments.slice().reverse().map((c) => {
                        const isUnread = c.mentionedUserIds?.includes(currentUser?.id) && !c.readBy?.includes(currentUser?.id);
                        return (
                            <div key={c.id} className={`flex gap-4 group animate-in slide-in-from-bottom-2 duration-300 ${isUnread ? "p-3 bg-blue-50/50 rounded-2xl border border-blue-100 ring-2 ring-blue-500/10" : ""}`}>
                                <div className="w-10 h-10 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-black shadow-sm shrink-0">
                                    {c.authorName.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-slate-800 text-sm tracking-tight">{c.authorName}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatTime(c.createdAt)}</span>
                                        {isUnread && <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded">New Mention</span>}
                                    </div>
                                    {editingCommentId === c.id ? (
                                        <div className="mt-2 space-y-2">
                                            <textarea
                                                value={editingCommentText}
                                                onChange={(e) => setEditingCommentText(e.target.value)}
                                                className="w-full bg-white border border-blue-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none h-24 shadow-inner"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={cancelEdit} className="px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider">Cancel</button>
                                                <button onClick={() => saveEditedComment(c.id)} className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-black rounded-lg hover:bg-blue-700 transition-all shadow-sm uppercase tracking-wider">Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative group/text">
                                            <div className="text-[13px] text-slate-600 font-medium leading-relaxed bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm inline-block min-w-[120px]">
                                                {renderCommentText(c.text)}
                                            </div>
                                            {c.authorId === currentUser?.id && (
                                                <div className="absolute right-2 -bottom-2 flex items-center gap-1 opacity-0 group-hover/text:opacity-100 transition-opacity z-10">
                                                    <button 
                                                        onClick={() => handleEditComment(c)} 
                                                        className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-100 shadow-sm transition-all"
                                                        title="Edit Comment"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </button>
                                                        <button 
                                                            onClick={() => handleDeleteComment(c)} 
                                                        className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-100 shadow-sm transition-all"
                                                        title="Delete Comment"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <p className="mt-4 font-black uppercase tracking-widest text-sm">No comments yet</p>
                    </div>
                  )}
                  <div ref={commentsEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteCommentModal 
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
      />
    </div>
  );
}

export default TaskDetailsModal;
