import { useState, useEffect } from "react";
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, clearAllNotifications } from "../services/api";
import { toast } from "react-toastify";

function NotificationIcon({ type }) {
  if (type === 'TASK_ASSIGNED') {
    return (
      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
      </div>
    );
  }
  if (type === 'TEAM_ADDED') {
    return (
      <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
      </div>
    );
  }
  if (type === 'MENTION') {
    return (
      <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </div>
    );
  }
  return (
    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    </div>
  );
}

import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All caught up!");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  }

  async function handleClearAll() {
    try {
      await clearAllNotifications();
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  }

  const handleNotificationClick = (notif) => {
    if (!notif.read) {
        handleMarkAsRead(notif.id);
    }
    
    if (notif.type === 'TEAM_ADDED') {
        navigate(`/teams/${notif.relatedId}`);
    } else {
        navigate('/', { state: { openTaskId: notif.relatedId } });
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins || 1}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return `Yesterday`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {unreadCount} New
              </span>
            )}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Stay updated on your tasks and team activities.</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">No notifications yet</h3>
            <p className="text-slate-500 text-sm">When you get assigned tasks or mentioned, they'll show up here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 flex flex-col">
            {notifications.map(notif => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-5 flex gap-4 transition-colors relative group cursor-pointer ${!notif.read ? 'bg-blue-50/30 hover:bg-blue-50/60' : 'hover:bg-slate-50'}`}
              >
                {!notif.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>
                )}
                
                <NotificationIcon type={notif.type} />
                
                <div className="flex-1 space-y-1">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900">{notif.senderName}</span> {notif.message}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {formatTime(notif.createdAt)}
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.read && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all hover:scale-105"
                      title="Mark as read"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </button>
                  )}
                  <button 
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 shadow-sm transition-all hover:scale-105"
                    title="Delete notification"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
