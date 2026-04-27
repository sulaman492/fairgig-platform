import { useState, useEffect } from 'react';
import { authApi } from '../../lib/authApi';
import ComplaintCard from './ComplaintCard';
import Pagination from '../common/Pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import { MessageCircle } from 'lucide-react';

export default function MyComplaints() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchComplaints();
    }, [currentPage]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const response = await authApi.get(`/api/complaints/my?page=${currentPage}&limit=10`);
            setComplaints(response.data.complaints || []);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpvote = async (id) => {
        try {
            await authApi.post(`/api/complaints/${id}/upvote`);
            fetchComplaints();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to upvote');
        }
    };

    if (loading) return <LoadingSpinner />;

    if (complaints.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No complaints yet</p>
                <p className="text-sm text-gray-400 mt-1">Click the + button to report an issue</p>
            </div>
        );
    }

    return (
        <div>
            <div className="space-y-4">
                {complaints.map((complaint) => (
                    <ComplaintCard
                        key={complaint.id}
                        complaint={complaint}
                        onUpvote={handleUpvote}
                        showUser={false}
                    />
                ))}
            </div>
            {pagination && pagination.totalPages > 1 && (
                <Pagination pagination={pagination} onPageChange={setCurrentPage} />
            )}
        </div>
    );
}