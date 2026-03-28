import { useState } from "react";

function TaskModal(props) {
  const task = props.task;

  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);

  function handleSave() {
    const updatedTask = {
      ...task,
      description: description,
      status: status
    };

    props.updateTask(updatedTask);
    props.closeModal();
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">

      <div className="bg-white p-4 rounded w-80">
        
        <h2 className="font-semibold mb-3">Edit Task</h2>

        <p className="text-sm mb-2">{task.title}</p>

        <input
          type="text"
          className="border p-2 w-full mb-2"
          value={description}
          onChange={function(e) {
            setDescription(e.target.value);
          }}
        />

        <select
          className="border p-2 w-full mb-3"
          value={status}
          onChange={function(e) {
            setStatus(e.target.value);
          }}>
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={props.closeModal}
            className="px-2 py-1 border">
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-2 py-1 bg-blue-500 text-white">
            Save
          </button>
        </div>

      </div>
    </div>
  );
}

export default TaskModal;