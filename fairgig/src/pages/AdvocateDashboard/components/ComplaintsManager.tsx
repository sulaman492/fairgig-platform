// src/pages/AdvocateDashboard/components/ComplaintsManager.tsx
import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { type Complaint } from '../types';

interface ComplaintsManagerProps {
    complaints: Complaint[];
    onUpdateStatus: (id: number, status: string, tags?: string[]) => Promise<void>;
    showNotification: (message: string, type: 'info' | 'warning' | 'success') => void;
}

const ComplaintsManager: React.FC<ComplaintsManagerProps> = ({ complaints, onUpdateStatus, showNotification }) => {
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [filter, setFilter] = useState<string>('all');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="badge pending">Pending</span>;
            case 'investigating': return <span className="badge investigating">Investigating</span>;
            case 'escalated': return <span className="badge escalated">Escalated</span>;
            case 'resolved': return <span className="badge resolved">Resolved</span>;
            default: return <span className="badge">{status}</span>;
        }
    };

    const filteredComplaints = complaints.filter(c => filter === 'all' || c.status === filter);

    return (
        <div className="complaints-manager">
            <div className="manager-header">
                <h2>Complaints Management</h2>
                <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
                    <option value="all">All Complaints</option>
                    <option value="pending">Pending</option>
                    <option value="investigating">Investigating</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>

            <div className="complaints-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Worker</th>
                            <th>Platform</th>
                            <th>Category</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Upvotes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredComplaints.map(complaint => (
                            <tr key={complaint.id}>
                                <td>#{complaint.id}</td>
                                <td>{complaint.worker_name}</td>
                                <td>{complaint.platform}</td>
                                <td>{complaint.category}</td>
                                <td>{complaint.title}</td>
                                <td>{getStatusBadge(complaint.status)}</td>
                                <td>👍 {complaint.upvotes}</td>
                                <td>
                                    <button 
                                        className="btn-icon" 
                                        onClick={() => setSelectedComplaint(complaint)}
                                        title="View Details"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for complaint details */}
            {selectedComplaint && (
                <div className="modal-overlay" onClick={() => setSelectedComplaint(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Complaint #{selectedComplaint.id}</h3>
                            <button onClick={() => setSelectedComplaint(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Worker:</strong> {selectedComplaint.worker_name}</p>
                            <p><strong>Platform:</strong> {selectedComplaint.platform}</p>
                            <p><strong>Category:</strong> {selectedComplaint.category}</p>
                            <p><strong>Title:</strong> {selectedComplaint.title}</p>
                            <p><strong>Description:</strong> {selectedComplaint.description}</p>
                            <p><strong>Tags:</strong> {selectedComplaint.tags?.join(', ') || 'None'}</p>
                            <p><strong>Upvotes:</strong> {selectedComplaint.upvotes}</p>
                            
                            <div className="status-actions">
                                <button 
                                    className="btn-status pending"
                                    onClick={() => {
                                        onUpdateStatus(selectedComplaint.id, 'pending');
                                        setSelectedComplaint(null);
                                    }}
                                >
                                    <Clock size={16} /> Pending
                                </button>
                                <button 
                                    className="btn-status investigating"
                                    onClick={() => {
                                        onUpdateStatus(selectedComplaint.id, 'investigating');
                                        setSelectedComplaint(null);
                                    }}
                                >
                                    🔍 Investigating
                                </button>
                                <button 
                                    className="btn-status escalated"
                                    onClick={() => {
                                        onUpdateStatus(selectedComplaint.id, 'escalated');
                                        setSelectedComplaint(null);
                                    }}
                                >
                                    ⬆️ Escalated
                                </button>
                                <button 
                                    className="btn-status resolved"
                                    onClick={() => {
                                        onUpdateStatus(selectedComplaint.id, 'resolved');
                                        setSelectedComplaint(null);
                                    }}
                                >
                                    <CheckCircle size={16} /> Resolved
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintsManager;