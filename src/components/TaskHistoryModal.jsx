import { useMemo } from "react";

function TaskHistoryModal(props) {
  const task = props.task;

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return "Unknown time";
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).replace(',', ' at');
  };

  // Convert raw status to readable label
  const getStatusLabel = (statusStr) => {
    switch (statusStr) {
      case "todo": return "To Do";
      case "in-progress": return "In Progress";
      case "done": return "Done";
      case "backlog": return "Backlog";
      default: return statusStr;
    }
  };

  const statusColors = {
    "todo": "bg-slate-100 text-slate-700 border-slate-200",
    "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
    "done": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "backlog": "bg-red-50 text-red-700 border-red-200"
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl transform transition-all border border-slate-200">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-slate-800 text-xl tracking-tight leading-tight">Timeline History</h2>
            <p className="text-sm text-slate-500 font-medium truncate max-w-sm mt-0.5" title={task.title}>
              {task.title}
            </p>
          </div>
          <button 
            type="button"
            onClick={props.closeModal}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors self-start"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10 font-bold tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Username</th>
                  <th scope="col" className="px-6 py-4">Status Moved To</th>
                  <th scope="col" className="px-6 py-4 text-right">Moved At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {task.statusHistory && task.statusHistory.length > 0 ? (
                  task.statusHistory.map((historyItem, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                        {historyItem.changedBy || "Unknown User"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${statusColors[historyItem.status] || "bg-slate-100 text-slate-700"}`}>
                          {getStatusLabel(historyItem.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-500">
                        {formatTime(historyItem.changedAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-slate-400 font-medium italic">
                      No history recorded for this task.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={props.closeModal}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
}

export default TaskHistoryModal;
