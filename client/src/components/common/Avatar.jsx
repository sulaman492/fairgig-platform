// client/src/components/common/Avatar.jsx
import { useState, useRef } from 'react';
import { authApi } from '../../lib/authApi';
import { User, Camera, Loader2, Trash2, CheckCircle, XCircle } from 'lucide-react';

// Simple Toast Component (or you can use react-hot-toast/react-toastify)
const Toast = ({ message, type, onClose }) => {
    const [isVisible, setIsVisible] = useState(true);
    
    setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    }, 3000);
    
    if (!isVisible) return null;
    
    return (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
                {type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message}
                </span>
            </div>
        </div>
    );
};

export default function Avatar({ user, onUpdate, size = 'lg' }) {
    const [uploading, setUploading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [toast, setToast] = useState(null);
    const fileInputRef = useRef(null);

    const sizes = {
        sm: 'w-8 h-8 text-xs ring-2',
        md: 'w-10 h-10 text-sm ring-2',
        lg: 'w-28 h-28 text-xl ring-4',
        xl: 'w-32 h-32 text-2xl ring-4'
    };

    const showToast = (message, type) => {
        setToast({ message, type });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Please select a valid image file (JPEG, PNG, GIF, or WEBP)', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('File size must be less than 5MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        setUploading(true);
        
        try {
            const response = await authApi.post('/api/auth/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (onUpdate) {
                onUpdate(response.data.profile_picture);
            }
            setImageError(false);
            showToast('Profile picture updated successfully!', 'success');
        } catch (error) {
            console.error('Upload failed:', error);
            showToast(error.response?.data?.error || 'Failed to upload profile picture', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async () => {
        setUploading(true);
        try {
            await authApi.delete('/api/auth/profile-picture');
            if (onUpdate) {
                onUpdate(null);
            }
            setImageError(false);
            showToast('Profile picture removed successfully', 'success');
        } catch (error) {
            console.error('Delete failed:', error);
            showToast(error.response?.data?.error || 'Failed to remove profile picture', 'error');
        } finally {
            setUploading(false);
        }
    };

    const getInitials = () => {
        if (!user?.name) return 'U';
        return user.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            <div className="relative group">
                {/* Avatar Container */}
                <div 
                    className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden ring-white shadow-xl transition-all duration-300 group-hover:ring-blue-200 cursor-pointer`}
                    onClick={() => fileInputRef.current?.click()}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    {uploading ? (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                    ) : user?.profile_picture && !imageError ? (
                        <img 
                            src={user.profile_picture} 
                            alt={user.name || 'Profile'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <span className="text-white font-bold text-center drop-shadow-md">
                            {getInitials()}
                        </span>
                    )}
                </div>
                
                {/* Tooltip */}
                {showTooltip && !uploading && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                        Click to change photo
                    </div>
                )}
                
                {/* Camera Icon Overlay */}
                <label 
                    className={`absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-1.5 shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer ring-2 ring-white ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Upload profile picture"
                >
                    <Camera className={`w-4 h-4 text-white ${uploading ? 'animate-pulse' : ''}`} />
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
                
                {/* Delete Button */}
                {user?.profile_picture && !uploading && (
                    <button
                        onClick={handleDelete}
                        className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 rounded-full p-1 shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 ring-2 ring-white"
                        title="Remove profile picture"
                    >
                        <Trash2 className="w-3 h-3 text-white" />
                    </button>
                )}
            </div>
            
            {/* Toast Notifications */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}

            {/* Add animation styles */}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </>
    );
}