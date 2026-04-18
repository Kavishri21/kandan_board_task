import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";

function TaskCard(props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const task = props.task;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({id: task.id});
  const isOverlay = props.isOverlay;

  const style = (transform && !isOverlay)
  ? {
      transform: "translate(" + transform.x + "px, " + transform.y + "px)",
      zIndex: 50,
      position: "relative"
    }
  : isOverlay 
  ? { transform: "rotate(2deg)", cursor: "grabbing" } 
  : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      onClick={function(e) { 
        if (isOverlay) return;
        e.stopPropagation(); 
        props.openHistoryModal(task); 
      }}
      className={
        "p-4 rounded-2xl border border-slate-100 mb-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group transition-opacity duration-200 " +
        (isDragging && !isOverlay ? "opacity-0" : "opacity-100") + " " +
        (task.status === "todo" ? "bg-[#F0F7FF]" : 
         task.status === "inprogress" ? "bg-[#FDF2F8]" : 
         task.status === "done" ? "bg-[#ECFDF5]" : 
         "bg-[#FFFBEB]")
      }
    >

      {/* Top Row: Priority Badge & Actions */}
      <div className="flex justify-between items-center mb-3">
        <div className={
          "text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm border border-white/50 " +
          (task.priority === "high" ? "text-red-500" : 
           task.priority === "medium" ? "text-amber-500" : 
           "text-emerald-500")
        }>
          {task.priority}
        </div>
        
        <div className="flex gap-2.5">
          <button
              onPointerDown={function(e) { e.stopPropagation(); }} 
              onClick={function(e) { e.stopPropagation(); props.openModal(task); }}
              className="text-slate-400 hover:text-blue-500 transition-colors p-1"
              title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button
              onPointerDown={function(e) { e.stopPropagation(); }}
              onClick={function(e) { e.stopPropagation(); props.deleteTask(task.id); }}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>

      {/* Middle Row: Title & Description */}
      <div className="mb-4">
        <h3 className="font-extrabold text-slate-800 text-lg leading-tight mb-1.5" title={task.title}>
          {task.taskID ? `${task.taskID} - ` : ""}{task.title}
        </h3>
        <p className={`text-[13px] text-slate-500 leading-relaxed overflow-hidden ${!isExpanded ? 'line-clamp-3' : ''}`}>
          {task.description}
        </p>
        {!isExpanded && task.description && task.description.length > 80 && (
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
            className="text-[12px] font-bold text-blue-500 hover:text-blue-600 mt-1 cursor-pointer"
          >
            ...more
          </button>
        )}
        {isExpanded && (
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            className="text-[12px] font-bold text-blue-500 hover:text-blue-600 mt-1 cursor-pointer"
          >
            Show less
          </button>
        )}
      </div>

      {/* Bottom Row: Due Date & Task ID & Comments - Always visible now */}
      <div className="pt-3 border-t border-slate-200/40 flex items-center justify-between">
          {/* Due Date (Left) */}
          {task.dueDate ? (
            <div className={`flex items-center gap-2 text-[11px] font-bold px-2 py-1 rounded-lg ${
              (() => {
                if (task.status === "done") {
                  return 'bg-emerald-100/50 text-emerald-600 ring-1 ring-emerald-200/50';
                }
                const targetDate = new Date(task.dueDate);
                const targetUTC = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
                const now = new Date();
                const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
                const diffDays = Math.ceil((targetUTC - todayUTC) / (1000 * 60 * 60 * 24));
                
                if (diffDays <= 0) {
                  return 'bg-red-600 text-white shadow-md ring-2 ring-red-300';
                }
                return diffDays === 1 ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-white/60 text-slate-500 shadow-sm border border-white/50';
              })()
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span className="uppercase tracking-wide">
                {new Date(task.dueDate).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short' })}
                {" "}
                {(() => {
                  if (task.status === "done") {
                    return "(Completed)";
                  }
                  const targetDate = new Date(task.dueDate);
                  const targetUTC = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate());
                  const now = new Date();
                  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
                  const diffDays = Math.ceil((targetUTC - todayUTC) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays <= 0) {
                    return "(OVERDUE)";
                  } else if (diffDays < 30) {
                    return `(${diffDays} day${diffDays === 1 ? '' : 's'})`;
                  } else {
                    const months = Math.floor(diffDays / 30);
                    return `(${months} month${months === 1 ? '' : 's'})`;
                  }
                })()}
              </span>
            </div>
          ) : <div />}

          {/* Comment Badge (Right) */}
          <div className="flex items-center gap-1.5 overflow-hidden">
            {(task.comments?.length > 0 || true) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  props.openHistoryModal(task, "tasks");
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all border ${
                  (() => {
                    const hasUnread = task.comments?.some(c => c.mentionedUserIds?.includes(props.currentUser?.id) && !c.readBy?.includes(props.currentUser?.id));
                    return hasUnread ? "bg-blue-50 border-blue-200 comment-unread-glow shadow-sm" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600";
                  })()
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="text-[10px] font-black">{task.comments?.length || 0}</span>
              </button>
            )}
            
            {/* Optional spacer if no ID but comments exist */}
            {!task.taskID && <div className="flex-1" />}
          </div>
        </div>
      

      {task.status === "backlog" && task.reason && (
        <div className="mt-3 pt-3 border-t border-slate-200/40">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1 block">Reason</span>
          <p className="text-[12px] text-slate-500 italic line-clamp-2">"{task.reason}"</p>
        </div>
      )}

    </div>
  );
}

export default TaskCard;