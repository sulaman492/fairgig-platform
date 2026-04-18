// components/VerifiedRecords.tsx
import React, { useState } from 'react';

interface Submission {
  id: string;
  workerId: string;
  workerName: string;
  platform: string;
  date: string;
  earnings: number;
  status: string;
}

interface VerifiedRecordsProps {
  submissions: Submission[];
}

const VerifiedRecords: React.FC<VerifiedRecordsProps> = ({ submissions }) => {
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');

  const filtered = submissions.filter(s => 
    (s.workerName.toLowerCase().includes(search.toLowerCase()) || s.workerId.toLowerCase().includes(search.toLowerCase())) &&
    (filterPlatform === 'all' || s.platform === filterPlatform)
  );

  return (
    <div className="verified-records">
      <div className="records-header">
        <h2>✅ Verified Records</h2>
        <div className="records-controls">
          <input type="text" placeholder="Search worker..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="filter-select" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="all">All Platforms</option>
            <option value="Uber">Uber</option>
            <option value="Fiverr">Fiverr</option>
            <option value="DoorDash">DoorDash</option>
            <option value="Upwork">Upwork</option>
          </select>
          <button className="export-btn">📎 Export CSV</button>
        </div>
      </div>
      <table className="records-table">
        <thead><tr><th>Worker</th><th>Platform</th><th>Amount</th><th>Verified By</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {filtered.map(sub => (
            <tr key={sub.id}>
              <td><strong>{sub.workerName}</strong><br/><span className="worker-id">{sub.workerId}</span></td>
              <td>{sub.platform}</td>
              <td>${sub.earnings.toLocaleString()}</td>
              <td>Verifier #1</td>
              <td>{sub.date}</td>
              <td><button className="view-btn">View</button> <button className="reopen-btn">Reopen</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VerifiedRecords;