import { StrictMode, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import './index.css'
import App from './App.jsx'
import { TaskProvider } from "./context/TaskContext"
import { AuthProvider } from "./context/AuthContext"
import AuthContext from "./context/AuthContext"
import AuthScreen from "./components/AuthScreen"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

/**
 * ProtectedRoute: Higher-order component to protect routes that require authentication.
 * If the user is not logged in (no token), it redirects them to the login page.
 */
function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Authenticating...</p>
        </div>
      </div>
    );
  }
  
  if (!token) {
    // replace=true prevents the back button from getting stuck on a protected route while logged out
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppWrapper() {
  const { token } = useContext(AuthContext);
  
  return (
    <Routes>
      {/* Auth Routes: Only accessible if logged out. If logged in, they redirect to dashboard. */}
      <Route path="/login" element={!token ? <AuthScreen /> : <Navigate to="/" replace />} />
      <Route path="/signup" element={!token ? <AuthScreen /> : <Navigate to="/" replace />} />
      {/* Accept Invite Route - essentially a signup page with token logic */}
      <Route path="/accept-invite" element={<AuthScreen />} />

      {/* Main Dashboard: Catch-all to App.jsx for protected sub-routing */}
      <Route path="/*" element={
        <ProtectedRoute>
          <TaskProvider>
            <App />
          </TaskProvider>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <BrowserRouter>
      <AppWrapper />
      {/* ToastContainer at root level — always visible on both login & dashboard */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  </AuthProvider>
)
