import { useState, useRef, useEffect } from "react";

function TaskModal(props) {
  const task = props.task;

  const [description, setDescription] = useState(task.description || "");
  const [reason, setReason] = useState(task.reason || "");
  const [priority, setPriority] = useState(task.priority || "high");

  const textareaRef = useRef(null);

  // Auto-resize description/reason textarea automatically
  useEffect(function() {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [description, reason]);

  function handleSave(e) {
    if (e) e.preventDefault();
    const updatedTask = {
      ...task,
      description: description,
      reason: reason,
      priority: priority
    };

    props.updateTask(updatedTask);
    props.closeModal();
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all border border-slate-200">
        
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-slate-800 text-lg tracking-tight">Edit Task</h2>
          <button 
            type="button"
            onClick={props.closeModal}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Task Title</label>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-slate-700 text-sm font-medium">
            {task.title}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            ref={textareaRef}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 resize-none overflow-hidden text-slate-700 min-h-[100px]"
            maxLength={200}
            placeholder="Add more details about this task..."
            value={description}
            onChange={function(e) { setDescription(e.target.value); }}
          />
          <div className={`text-right text-xs mt-1 font-medium ${200 - description.length === 0 ? "text-red-500" : "text-slate-400"}`}>
            {200 - description.length} characters left
          </div>
        </div>

        {task.status === "backlog" && (
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason for Backlog</label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 resize-none overflow-hidden text-slate-700 min-h-[80px]"
              maxLength={100}
              placeholder="Why was this dropped in the backlog?"
              value={reason}
              onChange={function(e) { setReason(e.target.value); }}
            />
            <div className={`text-right text-xs mt-1 font-medium ${100 - reason.length === 0 ? "text-red-500" : "text-slate-400"}`}>
              {100 - reason.length} characters left
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
            <select
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none transition-all text-slate-700 bg-white cursor-pointer"
              value={priority}
              onChange={function(e) {
                setPriority(e.target.value);
              }}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={props.closeModal}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
            Save Changes
          </button>
        </div>

      </form>
    </div>
  );
}

export default TaskModal;