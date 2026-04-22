import { useState } from "react";
import { createPortal } from "react-dom";

function DeleteTaskModal({ isOpen, onClose, task, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !task) return null;

  async function handleConfirm() {
    setIsDeleting(true);
    await onConfirm(task.id);
    setIsDeleting(false);
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[110] p-4 text-left">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 text-center animate-in fade-in zoom-in duration-200">
        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Task?</h3>
        <p className="text-slate-500 text-sm mb-6">
          Are you sure you want to delete <span className="font-bold text-slate-700">{task.title}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeleteTaskModal;
