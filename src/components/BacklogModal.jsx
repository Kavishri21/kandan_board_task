import { useState, useEffect, useRef } from "react";

function BacklogModal(props) {
  const task = props.task;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [reason, setReason] = useState(""); // Always starts empty as requested!
  const [priority, setPriority] = useState(task.priority || "high");

  const textareaRef = useRef(null);
  const descRef = useRef(null);

  // Auto-resize textareas
  useEffect(function() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
    if (descRef.current) {
      descRef.current.style.height = "auto";
      descRef.current.style.height = descRef.current.scrollHeight + "px";
    }
  }, [reason, description]);

  function handleSave(e) {
    if (e) e.preventDefault();
    if (title.trim() === "") return;

    props.onSave({
      ...task,
      title: title,
      description: description,
      reason: reason,
      priority: priority,
    });
  }

  const remainingChars = 100 - reason.length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-red-200/50">
        
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-red-600 text-lg tracking-tight flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            Send to Backlog
          </h2>
          <button 
            type="button"
            onClick={props.closeModal}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Task Title</label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-red-500 outline-none transition-all text-slate-800 font-medium bg-slate-50"
              value={title}
              onChange={function(e) { setTitle(e.target.value); }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              ref={descRef}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-red-500 outline-none transition-all text-slate-700 font-medium bg-slate-50 resize-none overflow-hidden"
              value={description}
              onChange={function(e) { setDescription(e.target.value); }}
              placeholder="Add more details about this task..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1.5">Reason for Backlog</label>
            <textarea
              ref={textareaRef}
              autoFocus
              className="w-full border border-red-200 rounded-lg p-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition-all placeholder:text-red-300 resize-none overflow-hidden text-slate-700 min-h-[80px]"
              maxLength={100}
              placeholder="Why is this task blocked or delayed...?"
              value={reason}
              onChange={function(e) { setReason(e.target.value); }}
            />
            <div className={`text-right text-xs mt-1 font-medium pb-4 ${remainingChars === 0 ? "text-red-600 font-bold" : remainingChars <= 20 ? "text-amber-500" : "text-slate-400"}`}>
              {remainingChars} characters left
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
            <select
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-red-500 outline-none transition-all text-slate-700 bg-white cursor-pointer"
              value={priority}
              onChange={function(e) { setPriority(e.target.value); }}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={props.closeModal}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2">
            Confirm Move
          </button>
        </div>

      </form>
    </div>
  );
}

export default BacklogModal;
