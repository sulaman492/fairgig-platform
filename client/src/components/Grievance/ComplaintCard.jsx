import { useState } from 'react';
import { ThumbsUp, MessageCircle, Flag, AlertTriangle, Clock, CheckCircle, AlertCircle, Share2, Bookmark } from 'lucide-react';
import StatusBadge from '../common/statusBadge';
import ComplaintDetailModal from './ComplaintDetailModal';

export default function ComplaintCard({ complaint, onUpvote, showUser = true, isAnonymous = false }) {
    const [showDetail, setShowDetail] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const formatDate = (date) => {
        const now = new Date();
        const then = new Date(date);
        const diffHours = Math.floor((now - then) / (1000 * 60 * 60));
        
        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffHours < 48) return 'Yesterday';
        return then.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' });
    };

    const getUrgencyIcon = () => {
        if (complaint.upvotes > 20) return <AlertTriangle className="h-4 w-4 text-red-500" />;
        if (complaint.upvotes > 10) return <Flag className="h-4 w-4 text-orange-500" />;
        return null;
    };

    const getUrgencyText = () => {
        if (complaint.upvotes > 20) return 'Urgent';
        if (complaint.upvotes > 10) return 'Trending';
        return null;
    };

    return (
        <>
            <div 
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                onClick={() => setShowDetail(true)}
            >
                {/* Top bar with urgency indicator */}
                {complaint.upvotes > 10 && (
                    <div className={`h-1 ${complaint.upvotes > 20 ? 'bg-red-500' : 'bg-orange-500'}`} />
                )}
                
                <div className="p-5">
                    {/* Header with avatar and meta info */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isAnonymous ? 'bg-gray-100' : 'bg-blue-100'
                            }`}>
                                {isAnonymous ? (
                                    <AlertCircle className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                                        {complaint.user_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                            
                            {/* User info */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-900">
                                        {isAnonymous ? 'Anonymous Worker' : complaint.user_name || 'Worker'}
                                    </p>
                                    {getUrgencyIcon()}
                                    {getUrgencyText() && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            complaint.upvotes > 20 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                            {getUrgencyText()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500">{formatDate(complaint.created_at)}</span>
                                    <span className="text-xs text-gray-300">•</span>
                                    <span className="text-xs text-gray-500">Complaint #{complaint.id}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Platform badge */}
                        <div className="flex items-center gap-2">
                            <div className="px-2 py-1 bg-gray-100 rounded-lg">
                                <span className="text-xs font-medium text-gray-700">{complaint.platform}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Title - Made to look like a real complaint headline */}
                    <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {complaint.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={complaint.status} />
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500 capitalize">{complaint.category}</span>
                        </div>
                    </div>
                    
                    {/* Description - Preview with "..." */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {complaint.description}
                    </p>
                    
                    {/* Tags */}
                    {complaint.tags && complaint.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                            {complaint.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    #{tag}
                                </span>
                            ))}
                            {complaint.tags.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                                    +{complaint.tags.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex gap-4">
                            {/* Upvote button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUpvote(complaint.id);
                                }}
                                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition group/upvote"
                            >
                                <div className="p-1 rounded-full group-hover/upvote:bg-blue-50 transition">
                                    <ThumbsUp className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium">{complaint.upvotes || 0}</span>
                                <span className="text-xs text-gray-400 hidden sm:inline">supporters</span>
                            </button>
                            
                            {/* Comments button */}
                            <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition">
                                <MessageCircle className="h-4 w-4" />
                                <span className="text-sm">0</span>
                                <span className="text-xs text-gray-400 hidden sm:inline">comments</span>
                            </button>
                            
                            {/* Share button */}
                            <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition">
                                <Share2 className="h-4 w-4" />
                                <span className="text-xs text-gray-400 hidden sm:inline">Share</span>
                            </button>
                        </div>
                        
                        {/* Bookmark button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsBookmarked(!isBookmarked);
                            }}
                            className={`p-1 rounded-full transition ${
                                isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                            }`}
                        >
                            <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Detail Modal */}
            {showDetail && (
                <ComplaintDetailModal
                    complaint={complaint}
                    onClose={() => setShowDetail(false)}
                    onUpvote={onUpvote}
                />
            )}
        </>
    );
}