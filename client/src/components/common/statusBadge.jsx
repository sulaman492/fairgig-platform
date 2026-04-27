import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
    const badges = {
        pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
        in_review: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, text: 'In Review' },
        resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Resolved' },
        closed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, text: 'Closed' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
            <Icon className="h-3 w-3" />
            {badge.text}
        </span>
    );
}