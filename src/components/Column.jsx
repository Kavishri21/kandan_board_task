import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

function Column(props) {
  const { title, tasks, status, deleteTask, openModal } = props;

  const { setNodeRef } = useDroppable({
    id: status
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-white p-4 rounded border min-h-[200px]"
    >
      <h2 className="font-semibold mb-3">{title}</h2>

      {tasks.map(function(task) {
        return (
            <TaskCard
            key={task.id}
            task={task}
            deleteTask={deleteTask}
            openModal={openModal}
            />
        );
        })}
    </div>
  );
}

export default Column;