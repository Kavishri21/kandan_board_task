import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

function Column(props) {
  const { title, tasks, status, deleteTask, openModal, openHistoryModal } = props;

  const { setNodeRef } = useDroppable({
    id: status
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        "--scrollbar-thumb": (status === "todo" ? "#60a5fa" : 
                             status === "inprogress" ? "#f472b6" : 
                             status === "done" ? "#34d399" : 
                             "#fbbf24")
      }}
      className={
        "p-5 rounded-2xl border-2 flex flex-col h-[calc(100vh-180px)] transition-colors duration-300 bg-white " +
        (status === "todo" ? "border-blue-400/60 shadow-[0_8px_30px_rgb(59,130,246,0.05)]" : 
         status === "inprogress" ? "border-purple-400/60 shadow-[0_8px_30px_rgb(192,132,252,0.05)]" : 
         status === "done" ? "border-emerald-400/60 shadow-[0_8px_30px_rgb(52,211,153,0.05)]" : 
         "border-amber-400/60 shadow-[0_8px_30px_rgb(251,191,36,0.05)]")
      }
    >
      <div className={
        "pb-5 mb-5 flex items-center justify-between border-b-2 shrink-0 " +
        (status === "todo" ? "border-blue-400/30" : 
         status === "inprogress" ? "border-purple-400/30" : 
         status === "done" ? "border-emerald-400/30" : 
         "border-amber-400/30")
      }>
        <div className="flex items-center gap-3">
          <div className={
            "w-2.5 h-2.5 rounded-full shadow-sm " +
            (status === "todo" ? "bg-blue-400" : 
             status === "inprogress" ? "bg-purple-400" : 
             status === "done" ? "bg-emerald-400" : 
             "bg-amber-400")
          }></div>
          <h2 className="font-extrabold text-slate-800 capitalize tracking-tight text-lg flex items-center gap-2.5">
            {title}
            <span className={
              "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black text-white shadow-sm " +
              (status === "todo" ? "bg-blue-400" : 
               status === "inprogress" ? "bg-purple-400" : 
               status === "done" ? "bg-emerald-400" : 
               "bg-amber-400")
            }>
              {tasks.length}
            </span>
          </h2>
        </div>
        
        {/* Placeholder for optional column actions like the "+" in reference */}
        <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto column-scroll pr-1 flex flex-col gap-4">
        {tasks.length === 0 && props.isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <p className="text-sm font-bold text-slate-400">No tasks found</p>
            <p className="text-[11px] text-slate-300 mt-1">Try a different keyword</p>
          </div>
        ) : (
          [...tasks]
            .sort(function(a, b) {
              const checkOverdue = (task) => {
                if (!task.dueDate) return false;
                const targetDate = new Date(task.dueDate);
                const targetUTC = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
                const now = new Date();
                const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
                return (targetUTC - todayUTC) <= 0;
              };

              const aOverdue = checkOverdue(a);
              const bOverdue = checkOverdue(b);
              
              if (aOverdue && !bOverdue) return -1;
              if (!aOverdue && bOverdue) return 1;

              const priorityOrder = { high: 1, medium: 2, low: 3 };
              return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
            })
            .map(function(task) {
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  deleteTask={deleteTask}
                  openModal={openModal}
                  openHistoryModal={openHistoryModal}
                />
              );
            })
        )}
      </div>
    </div>
  );
}

export default Column;