// client/src/components/common/Avatar.jsx
import { useState, useRef } from 'react';
import { authApi } from '../../lib/authApi';
import { User, Camera, Loader2, Trash2 } from 'lucide-react';

export default function Avatar({ user, onUpdate, size = 'lg' }) {
    const [uploading, setUploading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const fileInputRef = useRef(null);

    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-28 h-28 text-xl',
        xl: 'w-32 h-32 text-2xl'
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        // ✅ IMPORTANT: Create FormData
        const formData = new FormData();
        formData.append('avatar', file);  // Field name must be 'avatar'

        setUploading(true);
        
        try {
            // ✅ IMPORTANT: Don't set Content-Type header - let browser set it with boundary
            const response = await authApi.post('/api/auth/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'  // This is correct
                }
            });
            
            if (onUpdate) {
                onUpdate(response.data.profile_picture);
            }
            alert('Profile picture updated!');
        } catch (error) {
            console.error('Upload failed:', error);
            alert(error.response?.data?.error || 'Failed to upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Remove your profile picture?')) return;
        
        setUploading(true);
        try {
            await authApi.delete('/api/auth/profile-picture');
            if (onUpdate) {
                onUpdate(null);
            }
            alert('Profile picture removed');
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to remove profile picture');
        } finally {
            setUploading(false);
        }
    };

    const getInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="relative group">
            <div 
                className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer overflow-hidden ring-4 ring-white shadow-lg`}
                onClick={() => fileInputRef.current?.click()}
            >
                {user?.profile_picture && !imageError ? (
                    <img 
                        src={user.profile_picture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="text-white font-bold text-center">
                        {getInitials()}
                    </span>
                )}
                
                {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>
            
            {/* Camera Icon Overlay */}
            <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1.5 shadow-lg hover:bg-blue-700 transition cursor-pointer">
                <Camera className="w-4 h-4 text-white" />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
            
            {/* Delete Button */}
            {user?.profile_picture && (
                <button
                    onClick={handleDelete}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-lg hover:bg-red-600 transition text-xs"
                    disabled={uploading}
                >
                    <Trash2 className="w-3 h-3 text-white" />
                </button>
            )}
        </div>
    );
}