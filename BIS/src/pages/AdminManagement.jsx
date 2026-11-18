import { useEffect, useState } from 'react';

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAdmins() {
    setLoading(true); 
    setError('');
    try {
      const response = await fetch('http://localhost:8080/api/admins');
      if (!response.ok) throw new Error('Failed to fetch admins from server.');
      const data = await response.json();
      setAdmins(data);
    } catch (err) {
      setError(err.message || 'Could not load admin accounts.');
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { loadAdmins(); }, []);

  async function changeStatus(admin) {
    const next = admin.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const response = await fetch(`http://localhost:8080/api/admins/${admin.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
      if (!response.ok) throw new Error('Failed to update status.');
      await loadAdmins();
    } catch (err) {
      alert(err.message);
    }
  }

  async function removeAdmin(admin) {
    if (!window.confirm(`Delete the Admin profile for ${admin.email}?`)) return;
    try {
      const response = await fetch(`http://localhost:8080/api/admins/${admin.id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete admin.');
      await loadAdmins();
    } catch (err) {
      alert(err.message);
    }
  }

  return <>
    <div className="page-heading">
      <div>
        <span className="eyebrow">SUPER ADMIN</span>
        <h2>Admin Management</h2>
        <p>Manage all registered admin accounts from the MySQL database.</p>
      </div>
      <button className="btn btn-outline-primary" onClick={loadAdmins}>
        <i className="bi bi-arrow-clockwise me-2" />Refresh
      </button>
    </div>
    {error && <div className="alert alert-danger">{error}</div>}
    <div className="content-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Registered Admins</h5>
        <span className="badge text-bg-primary">{admins.length} accounts</span>
      </div>
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
      ) : admins.length === 0 ? (
        <div className="empty-state"><i className="bi bi-people" /><p>No Admin accounts found.</p></div>
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Admin Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td><strong>{admin.name || 'Unnamed Admin'}</strong></td>
                  <td>{admin.email}</td>
                  <td>
                    <span className={`badge ${admin.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td>{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '—'}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-warning" title="Activate/deactivate" onClick={() => changeStatus(admin)}>
                        <i className={`bi ${admin.status === 'Active' ? 'bi-person-slash' : 'bi-person-check'}`} />
                      </button>
                      <button className="btn btn-outline-danger" title="Delete profile" onClick={() => removeAdmin(admin)}>
                        <i className="bi bi-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </>;
}