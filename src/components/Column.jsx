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
      className="bg-slate-100/50 p-4 md:p-5 rounded-2xl border border-slate-200 flex flex-col min-h-[500px]"
    >
      <div className="pt-2 pb-4 mb-4 flex items-center justify-center gap-2 border-b border-slate-200/50">
        <h2 className="font-bold text-slate-700 uppercase tracking-wider text-lg">
          {title} <span className="mx-1 text-slate-400">-</span>
        </h2>
        <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-base font-semibold shadow-sm">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {[...tasks]
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
          })}
      </div>
    </div>
  );
}

export default Column;