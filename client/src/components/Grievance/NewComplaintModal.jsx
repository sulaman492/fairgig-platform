import { useState } from 'react';
import { authApi } from '../../lib/authApi';
import { AlertCircle, X } from 'lucide-react';

const PLATFORMS = ['Uber', 'Careem', 'Foodpanda', 'Bykea', 'DoorDash'];
const CATEGORIES = ['Commission', 'Payment Discrepancy', 'Account Deactivation', 'Late Payment', 'Support Issue', 'Other'];

export default function NewComplaintModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        platform: 'Uber',
        category: 'Commission',
        title: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || formData.title.length < 5) {
            setError('Title must be at least 5 characters');
            return;
        }
        
        if (!formData.description || formData.description.length < 10) {
            setError('Description must be at least 10 characters');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            await authApi.post('/api/complaints', formData);
            onClose();
            window.location.reload();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to create complaint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-900">New Complaint</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* Platform */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                        <select
                            value={formData.platform}
                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Brief summary of the issue"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detailed explanation of the issue..."
                            rows="5"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Complaint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}