import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';

const adminLinks = [
  ['Dashboard', '/admin', 'bi-speedometer2'],
  ['Residents', '/admin/residents', 'bi-people'],
  ['Households', '/admin/households', 'bi-houses'],
  ['Barangay Officials', '/admin/officials', 'bi-person-badge'],
  ['Blotter', '/admin/blotter', 'bi-journal-text'],
  ['Certificates', '/admin/certificates', 'bi-file-earmark-text'],
  ['Announcements', '/admin/announcements', 'bi-megaphone'],
  ['Reports', '/admin/reports', 'bi-bar-chart']
];

export default function AppLayout({ type }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const links = type === 'superadmin'
    ? [['Dashboard', '/superadmin', 'bi-speedometer2'], ['Admin Management', '/superadmin/admins', 'bi-person-gear']]
    : adminLinks;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><i className="bi bi-shield-check" /></div><div><strong>Barangay IS</strong><small>Information System</small></div></div>
        <div className="sidebar-label">{type === 'superadmin' ? 'SUPER ADMIN' : 'ADMINISTRATION'}</div>
        <nav className="nav flex-column">
          {links.map(([label, path, icon]) => (
            <NavLink key={path} to={path} end={path === '/admin' || path === '/superadmin'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <i className={`bi ${icon}`} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom"><div className="user-mini"><img src={profile?.photoURL || user?.photoURL || 'https://placehold.co/40x40?text=A'} alt="" /><div><strong>{profile?.name || user?.displayName || 'Administrator'}</strong><small>{profile?.role || 'admin'}</small></div></div><button className="btn btn-outline-light btn-sm w-100 mt-3" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" />Sign out</button></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div><span className="text-muted small">Barangay Information System</span><h5 className="mb-0">{type === 'superadmin' ? 'Super Admin Portal' : 'Admin Portal'}</h5></div><div className="top-user"><img src={profile?.photoURL || user?.photoURL || 'https://placehold.co/36x36?text=A'} alt="" /><span>{profile?.name || user?.displayName}</span></div></header>
        <section className="page-content"><Outlet /></section>
      </main>
    </div>
  );
}
