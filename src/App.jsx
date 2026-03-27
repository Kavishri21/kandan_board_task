function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      
      {/* Title */}
      <h1 className="text-2xl font-bold mb-6 text-center">
        Kanban Board
      </h1>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* To Do */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">To Do</h2>
        </div>

        {/* In Progress */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">In Progress</h2>
        </div>

        {/* Done */}
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-3">Done</h2>
        </div>

      </div>
    </div>
  );
}

export default App;