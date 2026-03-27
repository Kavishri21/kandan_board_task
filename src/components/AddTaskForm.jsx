import { useState } from "react";

function AddTaskForm(props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("Work");
  const [priority, setPriority] = useState("urgent");

  function handleAdd() {
    if (title.trim() === "") return;

    const newTask = {
      id: Date.now(),
      title: title,
      description: description,
      status: "todo",
      tag: tag,
      priority: priority
    };

    props.addTask(newTask);

    // clear inputs
    setTitle("");
    setDescription("");
    setTag("Work");
    setPriority("urgent");
  }

  return (
    <div className="bg-white p-4 rounded border mb-4">

      <h2 className="font-semibold mb-3">Add Task</h2>

      {/* Title */}
      <input
        type="text"
        placeholder="Task title"
        className="border p-2 w-full mb-2"
        value={title}
        onChange={function(e) {
          setTitle(e.target.value);
        }}
      />

      {/* Description */}
      <input
        type="text"
        placeholder="Description"
        className="border p-2 w-full mb-2"
        value={description}
        onChange={function(e) {
          setDescription(e.target.value);
        }}
      />

      {/* Tag */}
      <select
        className="border p-2 w-full mb-2"
        value={tag}
        onChange={function(e) {
          setTag(e.target.value);
        }}
      >
        <option>Work</option>
        <option>Study</option>
        <option>Self Care</option>
        <option>Others</option>
      </select>

      {/* Priority */}
      <select
        className="border p-2 w-full mb-2"
        value={priority}
        onChange={function(e) {
          setPriority(e.target.value);
        }}
      >
        <option value="urgent">Urgent</option>
        <option value="medium">Not So Urgent</option>
        <option value="low">Have Time</option>
      </select>

      {/* Button */}
      <button
        onClick={handleAdd}
        className="bg-blue-500 text-white px-3 py-1 rounded w-full"
      >
        Add Task
      </button>

    </div>
  );
}

export default AddTaskForm;