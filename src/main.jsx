import { StrictMode, useContext } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TaskProvider } from "./context/TaskContext"
import { AuthProvider } from "./context/AuthContext"
import AuthContext from "./context/AuthContext"
import AuthScreen from "./components/AuthScreen"

function AppWrapper() {
  const { token, loading } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  
  if (!token) {
    return <AuthScreen />;
  }
  
  return (
    <TaskProvider>
      <App />
    </TaskProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <AppWrapper />
  </AuthProvider>
)
