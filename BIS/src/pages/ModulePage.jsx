import { useState } from 'react';

const descriptions = {
  residents: 'Register, update, and review resident information.',
  households: 'Organize residents by household and purok.',
  officials: 'Maintain the list of current barangay officials.',
  blotter: 'Record and review incidents and complaints.',
  certificates: 'Prepare and track barangay certificate requests.',
  announcements: 'Publish important barangay announcements.',
  reports: 'Review barangay summaries and reports.'
};

export default function ModulePage({ module }) {
  const [search, setSearch] = useState('');
  const title = module.charAt(0).toUpperCase() + module.slice(1);
  return <><div className="page-heading"><div><span className="eyebrow">ADMIN MODULE</span><h2>{module === 'officials' ? 'Barangay Officials' : title}</h2><p>{descriptions[module]}</p></div></div><div className="content-card"><div className="d-flex flex-wrap justify-content-between gap-2 mb-3"><input className="form-control search-input" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(e) => setSearch(e.target.value)} /><button className="btn btn-primary" onClick={() => alert(`Connect ${module} form to your Firestore data model.`)}><i className="bi bi-plus-lg me-2" />Add {module === 'officials' ? 'Official' : module.slice(0, -1) || module}</button></div><div className="empty-state"><i className="bi bi-folder2-open" /><h5>No records displayed yet</h5><p>This module's layout is ready. Connect its CRUD form and Firestore collection to begin managing records.</p></div></div></>;
}
