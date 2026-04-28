import { useState, useEffect } from 'react';
import { authApi } from '../../lib/authApi';
import ComplaintCard from './ComplaintCard';
import Pagination from '../common/pagination';
import LoadingSpinner from '../common/LoadingSpinner';
import { TrendingUp, Flame, Clock, Award } from 'lucide-react';

export default function CommunityBulletin() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [trending, setTrending] = useState([]);
    const [filter, setFilter] = useState('latest'); // latest, trending, most_upvoted

    useEffect(() => {
        fetchComplaints();
        fetchTrending();
    }, [currentPage, filter]);

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            let url = `/api/complaints/community?page=${currentPage}&limit=10`;
            if (filter === 'most_upvoted') url += '&sort=upvotes';
            if (filter === 'trending') url += '&sort=trending';
            
            const response = await authApi.get(url);
            setComplaints(response.data.complaints || []);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Failed to fetch community complaints:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrending = async () => {
        try {
            const response = await authApi.get('/api/complaints/trending');
            setTrending(response.data.trending || []);
        } catch (error) {
            console.error('Failed to fetch trending:', error);
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

    return (
        <div>
            {/* Trending Banner */}
            {trending.length > 0 && (
                <div className="mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="h-5 w-5" />
                        <h3 className="font-bold">Trending Issues This Week</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trending.map((item, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                                {item.category}: {item.count} complaints
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 border-b pb-3">
                <button
                    onClick={() => setFilter('latest')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        filter === 'latest' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Clock className="h-3.5 w-3.5" />
                    Latest
                </button>
                <button
                    onClick={() => setFilter('trending')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        filter === 'trending' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    Trending
                </button>
                <button
                    onClick={() => setFilter('most_upvoted')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        filter === 'most_upvoted' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Award className="h-3.5 w-3.5" />
                    Most Supported
                </button>
            </div>

            {/* Complaints List */}
            <div className="space-y-4">
                {complaints.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <p className="text-gray-500">No complaints in the community yet</p>
                        <p className="text-sm text-gray-400 mt-1">Be the first to report an issue</p>
                    </div>
                ) : (
                    complaints.map((complaint) => (
                        <ComplaintCard
                            key={complaint.id}
                            complaint={complaint}
                            onUpvote={handleUpvote}
                            showUser={false}
                            isAnonymous={true}
                        />
                    ))
                )}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <Pagination pagination={pagination} onPageChange={setCurrentPage} />
            )}
        </div>
    );
}