import { useDraggable } from "@dnd-kit/core";

function TaskCard(props) {
  const task = props.task;
  const { attributes, listeners, setNodeRef, transform } = useDraggable({id: task.id});

  const style = transform
  ? {
      transform: "translate(" + transform.x + "px, " + transform.y + "px)",
      zIndex: 50,
      position: "relative"
    }
  : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={
        "bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing group border-l-4 " +
        (task.priority === "high"
          ? "border-l-red-500"
          : task.priority === "medium"
          ? "border-l-amber-400"
          : "border-l-emerald-500")
      }
    >

      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 text-lg leading-snug truncate pr-2" title={task.title}>
          {task.title}
        </h3>
        
        <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <button
              onPointerDown={function(e) { e.stopPropagation(); }} 
              onClick={function() { props.openModal(task); }}
              className="text-slate-400 hover:text-blue-500 transition-colors"
              title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button
              onPointerDown={function(e) { e.stopPropagation(); }}
              onClick={function() { props.deleteTask(task.id); }}
              className="text-slate-400 hover:text-red-500 transition-colors"
              title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
        {task.description}
      </p>

      {task.status === "backlog" && task.reason && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1 block">Reason</span>
          <p className="text-xs text-slate-600 italic line-clamp-2">"{task.reason}"</p>
        </div>
      )}

    </div>
  );
}

export default TaskCard;