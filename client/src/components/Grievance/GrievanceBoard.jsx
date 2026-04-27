import { useState } from 'react';
import { ShieldAlert, Plus, Users, User } from 'lucide-react';
import MyComplaints from './MyComplaints';
import CommunityBulletin from './CommunityBulletin';
import NewComplaintModal from './NewComplaintModal';

export default function GrievanceBoard() {
    const [activeTab, setActiveTab] = useState('my');
    const [showNewModal, setShowNewModal] = useState(false);

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                    <ShieldAlert className="h-12 w-12 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Grievance Board</h1>
                <p className="text-gray-600 mt-1 text-sm">
                    Report issues, see what others are facing, and track your complaints
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition ${
                            activeTab === 'my'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <User className="h-4 w-4" />
                        My Complaints
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition ${
                            activeTab === 'community'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Users className="h-4 w-4" />
                        Community Bulletin
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'my' && <MyComplaints />}
                {activeTab === 'community' && <CommunityBulletin />}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setShowNewModal(true)}
                className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center gap-2 z-10"
            >
                <Plus className="h-5 w-5" />
                <span className="hidden md:inline">New Complaint</span>
            </button>

            {/* Modal */}
            <NewComplaintModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} />
        </div>
    );
}