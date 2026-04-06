import { useState } from "react";

function AddTaskForm(props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("high");
  const [isFormVisible, setIsFormVisible] = useState(false);

  function handleAdd(e) {
    if (e) e.preventDefault();
    if (title.trim() === "") return;

    const newTask = {
      id: Date.now(),
      title: title,
      description: description,
      status: "todo",
      priority: priority
    };

    props.addTask(newTask);

    setTitle("");
    setDescription("");
    setPriority("high");
    setIsFormVisible(false);
  }

  return (
    <>
      <button 
        type="button"
        onClick={function() { setIsFormVisible(true); }}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Task
      </button>

      {isFormVisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200 text-left">
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md transform transition-all border border-slate-200">
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold text-slate-800 text-xl tracking-tight">Create New Task</h2>
        <button 
          type="button"
          onClick={function() { setIsFormVisible(false); }}
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
          <input
            type="text"
            autoFocus
            placeholder="What needs to be done?"
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
            value={title}
            onChange={function(e) {
              setTitle(e.target.value);
            }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            placeholder="Add some details..."
            rows="2"
            maxLength={200}
            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-400 text-slate-600 resize-none"
            value={description}
            onChange={function(e) {
              setDescription(e.target.value);
            }}
          ></textarea>
          <div className={`text-right text-xs mt-1 font-medium ${description.length >= 200 ? 'text-red-500' : description.length >= 180 ? 'text-amber-500' : 'text-slate-400'}`}>
            {description.length} / 200
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
            <select
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none transition-all text-slate-700 bg-white cursor-pointer"
              value={priority}
              onChange={function(e) {
                setPriority(e.target.value);
              }}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={function() { setIsFormVisible(false); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            Create Task
          </button>
        </div>

          </form>
        </div>
      )}
    </>
  );
}

export default AddTaskForm;