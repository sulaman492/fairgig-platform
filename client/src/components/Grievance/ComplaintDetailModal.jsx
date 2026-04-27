import { useState } from 'react';
import { ThumbsUp, X, Flag, Share2, Bookmark, AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ComplaintDetailModal({ complaint, onClose, onUpvote }) {
    const [copied, setCopied] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-PK', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const copyComplaintLink = () => {
        const url = `${window.location.origin}/complaint/${complaint.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-white/20 rounded-lg text-white text-xs font-medium">
                                    {complaint.platform}
                                </span>
                                <StatusBadge status={complaint.status} />
                                <span className="text-white/80 text-xs">
                                    Complaint #{complaint.id}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold text-white">{complaint.title}</h2>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="text-white/80 hover:text-white transition p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6 space-y-6">
                    {/* Author info */}
                    <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-600">W</span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Anonymous Worker</p>
                            <p className="text-sm text-gray-500">Posted {formatDate(complaint.created_at)}</p>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 rounded-xl p-5">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Issue Description
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {complaint.description}
                        </p>
                    </div>

                    {/* Tags */}
                    {complaint.tags && complaint.tags.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {complaint.tags.map((tag, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 py-2">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <ThumbsUp className="h-5 w-5 text-blue-600" />
                                <span className="text-2xl font-bold text-blue-600">{complaint.upvotes || 0}</span>
                            </div>
                            <p className="text-xs text-gray-600">Workers supporting this</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-green-600 mb-1">0</div>
                            <p className="text-xs text-gray-600">Similar complaints</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
                    <div className="flex gap-3">
                        <button
                            onClick={() => onUpvote(complaint.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition"
                        >
                            <ThumbsUp className="h-4 w-4" />
                            Support this complaint
                        </button>
                        <button
                            onClick={copyComplaintLink}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            Share
                        </button>
                    </div>
                    <button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        className={`p-2 rounded-lg transition ${
                            isBookmarked ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500'
                        }`}
                    >
                        <Bookmark className="h-5 w-5" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                </div>
            </div>
        </div>
    );
}