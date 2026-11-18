import { useAuth } from '../context/AuthContext.jsx';

export default function DashboardHome({ superadmin = false }) {
  const { profile } = useAuth();
  const cards = superadmin
    ? [['Admin Accounts', 'Manage registered administrators', 'bi-people', 'primary'], ['Account Security', 'Roles and account status are protected', 'bi-shield-lock', 'success']]
    : [['Residents', 'Resident records and profiles', 'bi-people', 'primary'], ['Households', 'Household and purok records', 'bi-houses', 'success'], ['Blotter Records', 'Incident and complaint records', 'bi-journal-text', 'warning'], ['Certificates', 'Barangay document requests', 'bi-file-earmark-text', 'info']];
  return <>
    <div className="welcome-banner"><div><span className="eyebrow">OVERVIEW</span><h2>Welcome, {profile?.name || 'Administrator'}!</h2><p className="mb-0">Manage your barangay information from one place.</p></div><div className="welcome-icon"><i className="bi bi-buildings" /></div></div>
    <div className="row g-3 mt-2">{cards.map(([title, desc, icon, color]) => <div className="col-12 col-md-6 col-xl-3" key={title}><div className="stat-card"><div className={`stat-icon text-${color} bg-${color}-subtle`}><i className={`bi ${icon}`} /></div><h5>{title}</h5><p>{desc}</p></div></div>)}</div>
    <div className="content-card mt-4"><h5>System modules</h5><p className="text-muted mb-0">{superadmin ? 'Use Admin Management to review all automatically registered Admin accounts.' : 'Use the navigation menu to manage residents, households, officials, blotter records, certificates, announcements, and reports. Connect these modules to your barangay data collections as your workflow is finalized.'}</p></div>
  </>;
}
