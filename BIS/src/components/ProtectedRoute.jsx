import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner-border text-primary" /><p className="mt-3">Checking your account...</p></div>;
  if (!user || !profile) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={profile.role === 'superadmin' ? '/superadmin' : '/admin'} replace />;
  }
  return <Outlet />;
}
