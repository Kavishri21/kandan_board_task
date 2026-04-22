import { NavLink } from "react-router-dom";

function Sidebar({ isCollapsed, setIsCollapsed, unreadNotifications, onLogoutClick }) {
  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col pt-8 pb-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 shrink-0 hidden md:flex transition-all duration-300 relative ${isCollapsed ? 'w-20 px-3' : 'w-64 px-4'}`}>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:border-blue-400 hover:text-blue-500 transition-all z-30"
        title={isCollapsed ? "Expand" : "Collapse"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>

      <div className={`mb-8 transition-all ${isCollapsed ? 'px-1' : 'px-3'}`}>
        <div className="flex items-center gap-3 text-blue-700 font-bold text-lg tracking-tight overflow-hidden whitespace-nowrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          {!isCollapsed && <span>Kanban Board</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <NavLink
          to="/"
          end
          title="Dashboard"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
            isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Dashboard</span>}
        </NavLink>

        <NavLink
          to="/users"
          title="Users"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
            isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Users</span>}
        </NavLink>

        <NavLink
          to="/teams"
          title="Teams"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
            isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Teams</span>}
        </NavLink>

        <NavLink
          to="/reports"
          title="Reports"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
            isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          } ${isCollapsed ? 'justify-center px-0 text-center' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          {!isCollapsed && <span className="tracking-tight uppercase text-[10px]">Reports</span>}
        </NavLink>

        <NavLink
          to="/notifications"
          title="Notifications"
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold w-full text-left transition-all ${
            isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          } ${isCollapsed ? 'justify-center px-0 text-center relative' : 'relative'}`}
        >
          <div className="relative shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center justify-between flex-1">
              <span className="tracking-tight uppercase text-[10px]">Alerts</span>
              {unreadNotifications > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-black rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </div>
          )}
        </NavLink>
      </div>

      <button
        onClick={onLogoutClick}
        title="Logout"
        className={`mt-auto flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors w-full text-left overflow-hidden whitespace-nowrap ${
          isCollapsed ? 'justify-center px-0 text-center' : ''
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        {!isCollapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}

export default Sidebar;
