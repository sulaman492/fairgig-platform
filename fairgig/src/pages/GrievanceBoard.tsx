import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, ThumbsUp, MessageCircle, Plus, X } from 'lucide-react';

const API_GATEWAY_URL = 'http://localhost:5000';

interface Complaint {
    id: number;
    user_id: number;
    platform: string;
    category: string;
    title: string;
    description: string;
    tags: string[];
    upvotes: number;
    status: string;
    created_at: string;
    user_name?: string;
}

const GrievanceBoard: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
    const [showMyOnly, setShowMyOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newComplaint, setNewComplaint] = useState({
        platform: '',
        category: '',
        title: '',
        description: '',
        tags: ''
    });

    useEffect(() => {
        fetchComplaints();
        fetchMyComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await axios.get(`${API_GATEWAY_URL}/api/complaints`, {
                withCredentials: true
            });
            setComplaints(response.data.complaints || []);
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyComplaints = async () => {
        try {
            const response = await axios.get(`${API_GATEWAY_URL}/api/complaints/my`, {
                withCredentials: true
            });
            setMyComplaints(response.data.complaints || []);
        } catch (error) {
            console.error('Error fetching my complaints:', error);
        }
    };

    const handleUpvote = async (id: number) => {
        try {
            await axios.post(`${API_GATEWAY_URL}/api/complaints/${id}/upvote`, {}, {
                withCredentials: true
            });
            fetchComplaints();
            fetchMyComplaints();
        } catch (error) {
            console.error('Error upvoting:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_GATEWAY_URL}/api/complaints`, {
                platform: newComplaint.platform,
                category: newComplaint.category,
                title: newComplaint.title,
                description: newComplaint.description,
                tags: newComplaint.tags.split(',').map(t => t.trim())
            }, { withCredentials: true });
            
            setShowForm(false);
            setNewComplaint({ platform: '', category: '', title: '', description: '', tags: '' });
            fetchComplaints();
            fetchMyComplaints();
        } catch (error) {
            console.error('Error submitting complaint:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <span className="badge badge-warning">Pending</span>;
            case 'investigating': return <span className="badge badge-info">Investigating</span>;
            case 'resolved': return <span className="badge badge-success">Resolved</span>;
            case 'rejected': return <span className="badge badge-danger">Rejected</span>;
            default: return <span className="badge badge-default">{status}</span>;
        }
    };

    const displayComplaints = showMyOnly ? myComplaints : complaints;

    if (loading) return <div>Loading grievances...</div>;

    return (
        <div className="grievance-container">
            <div className="grievance-header">
                <div>
                    <h1 className="page-title">Grievance Board</h1>
                    <p className="page-subtitle">Report issues and support fellow workers</p>
                </div>
                <div className="grievance-actions">
                    <button 
                        className={`btn ${showMyOnly ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setShowMyOnly(!showMyOnly)}
                    >
                        {showMyOnly ? 'Show All' : 'My Complaints'}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} /> New Complaint
                    </button>
                </div>
            </div>

            {/* Complaint Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>New Complaint</h3>
                            <button onClick={() => setShowForm(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <select 
                                value={newComplaint.platform} 
                                onChange={e => setNewComplaint({...newComplaint, platform: e.target.value})}
                                required
                            >
                                <option value="">Select Platform</option>
                                <option value="Uber">Uber</option>
                                <option value="Foodpanda">Foodpanda</option>
                                <option value="Bykea">Bykea</option>
                                <option value="Careem">Careem</option>
                            </select>
                            <input 
                                type="text" 
                                placeholder="Category (e.g., Payment, Commission)"
                                value={newComplaint.category}
                                onChange={e => setNewComplaint({...newComplaint, category: e.target.value})}
                            />
                            <input 
                                type="text" 
                                placeholder="Title"
                                value={newComplaint.title}
                                onChange={e => setNewComplaint({...newComplaint, title: e.target.value})}
                                required
                            />
                            <textarea 
                                placeholder="Describe your issue in detail..."
                                value={newComplaint.description}
                                onChange={e => setNewComplaint({...newComplaint, description: e.target.value})}
                                rows={4}
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="Tags (comma separated, e.g., payment, delay)"
                                value={newComplaint.tags}
                                onChange={e => setNewComplaint({...newComplaint, tags: e.target.value})}
                            />
                            <button type="submit" className="btn btn-primary">Submit Complaint</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Complaints List */}
            <div className="complaints-list">
                {displayComplaints.length === 0 ? (
                    <div className="card no-data">No complaints found. Be the first to report an issue!</div>
                ) : (
                    displayComplaints.map(complaint => (
                        <div key={complaint.id} className="card complaint-card">
                            <div className="complaint-vote">
                                <button onClick={() => handleUpvote(complaint.id)} className="vote-btn">
                                    <ThumbsUp size={18} />
                                </button>
                                <span className="vote-count">{complaint.upvotes}</span>
                            </div>
                            <div className="complaint-content">
                                <div className="complaint-badges">
                                    <span className="badge badge-info">{complaint.platform}</span>
                                    {complaint.tags?.map((tag, i) => (
                                        <span key={i} className="badge badge-default">{tag}</span>
                                    ))}
                                    {getStatusBadge(complaint.status)}
                                </div>
                                <h3 className="complaint-title">{complaint.title}</h3>
                                <p className="complaint-text">{complaint.description}</p>
                                <div className="complaint-meta">
                                    <span className="complaint-date">
                                        {new Date(complaint.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="complaint-author">
                                        Posted by: {complaint.user_name || `Worker ${complaint.user_id}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GrievanceBoard;