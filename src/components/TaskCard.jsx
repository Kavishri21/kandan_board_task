function TaskCard(props) {
  const task = props.task;

  return (
    <div className="border p-3 rounded mb-3 bg-gray-50">

      {/* Top row */}
      <div className="flex justify-between items-center mb-2">
        
        {/* Priority Dot */}
        <div
          className={
            "w-3 h-3 rounded-full " +
            (task.priority === "urgent"
              ? "bg-red-500"
              : task.priority === "medium"
              ? "bg-yellow-400"
              : "bg-green-500")
          }
        ></div>

        {/* Tag */}
        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
          {task.tag}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm">{task.title}</h3>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-2">
        {task.description}
      </p>

      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={function() {
            props.openModal(task);}}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
            Edit
        </button>
        <button onClick={function() {
            props.deleteTask(task.id);}}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded">
            Delete
        </button>
      </div>

    </div>
  );
}

export default TaskCard;    