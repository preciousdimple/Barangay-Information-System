import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import AdminManagement from './pages/AdminManagement.jsx';
import ModulePage from './pages/ModulePage.jsx';

function HomeRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /></div>;
  if (!user || !profile) return <Navigate to="/login" replace />;
  return <Navigate to={profile.role === 'superadmin' ? '/superadmin' : '/admin'} replace />;
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route path="/admin" element={<AppLayout type="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="residents" element={<ModulePage module="residents" />} />
        <Route path="households" element={<ModulePage module="households" />} />
        <Route path="officials" element={<ModulePage module="officials" />} />
        <Route path="blotter" element={<ModulePage module="blotter" />} />
        <Route path="certificates" element={<ModulePage module="certificates" />} />
        <Route path="announcements" element={<ModulePage module="announcements" />} />
        <Route path="reports" element={<ModulePage module="reports" />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
      <Route path="/superadmin" element={<AppLayout type="superadmin" />}>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="admins" element={<AdminManagement />} />
      </Route>
    </Route>
    <Route path="/" element={<HomeRedirect />} />
    <Route path="*" element={<HomeRedirect />} />
  </Routes></BrowserRouter>;
}
