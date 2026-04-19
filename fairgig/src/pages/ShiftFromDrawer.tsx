// src/components/worker/ShiftFormDrawer.tsx
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import axios from 'axios';

interface ShiftFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (shift: any) => void;
}

const API_GATEWAY_URL = 'http://localhost:5000';

const ShiftFormDrawer: React.FC<ShiftFormDrawerProps> = ({ isOpen, onClose, onSubmit }) => {
    const [newShift, setNewShift] = useState({
        platform: '',
        shift_date: new Date().toISOString().split('T')[0],
        hours_worked: 0,
        gross_earned: 0,
        platform_deductions: 0,
        net_received: 0
    });
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Convert file to base64
    const convertToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'platform' || name === 'shift_date') {
            setNewShift(prev => ({ ...prev, [name]: value }));
        } else {
            const numValue = parseFloat(value) || 0;
            setNewShift(prev => {
                const updated = { ...prev, [name]: numValue };
                if ((name === 'gross_earned' || name === 'platform_deductions') &&
                    !isNaN(updated.gross_earned) && !isNaN(updated.platform_deductions)) {
                    updated.net_received = updated.gross_earned - updated.platform_deductions;
                }
                return updated;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setScreenshot(file);
            const previewUrl = URL.createObjectURL(file);
            setScreenshotPreview(previewUrl);
        }
    };

    const handleSubmit = async () => {
        if (!newShift.platform) {
            alert('Please select a platform');
            return;
        }
        if (!newShift.shift_date) {
            alert('Please select a date');
            return;
        }
        if (newShift.hours_worked <= 0) {
            alert('Please enter hours worked');
            return;
        }
        if (newShift.gross_earned <= 0) {
            alert('Please enter gross earnings');
            return;
        }

        setLoading(true);

        try {
            let screenshotBase64 = null;
            if (screenshot) {
                screenshotBase64 = await convertToBase64(screenshot);
            }

            // Send as regular JSON with base64 screenshot
            const response = await axios.post(`${API_GATEWAY_URL}/api/shifts`, {
                platform: newShift.platform,
                shift_date: newShift.shift_date,
                hours_worked: newShift.hours_worked,
                gross_earned: newShift.gross_earned,
                platform_deductions: newShift.platform_deductions,
                net_received: newShift.net_received,
                screenshot: screenshotBase64  // ← Send base64 string
            }, { withCredentials: true });

            if (response.data.success) {
                alert('Shift logged successfully!');
                onSubmit(response.data.shift);
                onClose();

                // Reset form
                setNewShift({
                    platform: '',
                    shift_date: new Date().toISOString().split('T')[0],
                    hours_worked: 0,
                    gross_earned: 0,
                    platform_deductions: 0,
                    net_received: 0
                });
                setScreenshot(null);
                setScreenshotPreview(null);
            }
        } catch (error: any) {
            console.error('Error logging shift:', error);
            alert(error.response?.data?.error || 'Failed to log shift');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <div>
                        <h3 className="drawer-title">Log New Shift</h3>
                        <p className="drawer-subtitle">Add your recent earnings</p>
                    </div>
                    <button onClick={onClose} className="drawer-close">
                        <X size={20} />
                    </button>
                </div>
                <div className="drawer-body">
                    <div className="form-group">
                        <label className="form-label">Platform *</label>
                        <select name="platform" value={newShift.platform} onChange={handleChange} className="form-select" required>
                            <option value="">Select Platform</option>
                            <option value="Uber">Uber</option>
                            <option value="Foodpanda">Foodpanda</option>
                            <option value="Bykea">Bykea</option>
                            <option value="Careem">Careem</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date *</label>
                        <input
                            type="date"
                            name="shift_date"
                            value={newShift.shift_date}
                            onChange={handleChange}
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Hours Worked *</label>
                        <input
                            type="number"
                            name="hours_worked"
                            value={newShift.hours_worked || ''}
                            onChange={handleChange}
                            placeholder="0"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Gross Earnings (Rs.) *</label>
                        <input
                            type="number"
                            name="gross_earned"
                            value={newShift.gross_earned || ''}
                            onChange={handleChange}
                            placeholder="0"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Platform Deductions (Rs.)</label>
                        <input
                            type="number"
                            name="platform_deductions"
                            value={newShift.platform_deductions || ''}
                            onChange={handleChange}
                            placeholder="0"
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Net Received (Rs.)</label>
                        <input
                            type="number"
                            name="net_received"
                            value={newShift.net_received || ''}
                            onChange={handleChange}
                            placeholder="Auto-calculated"
                            className="form-input"
                            readOnly
                        />
                        <small className="form-hint">Auto-calculated from Gross - Deductions</small>
                    </div>

                    {/* Screenshot Upload */}
                    <div className="form-group">
                        <label className="form-label">Screenshot (Optional)</label>
                        <div className="upload-area">
                            <input
                                type="file"
                                id="screenshot"
                                accept="image/jpeg,image/png,image/jpg,image/gif"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="screenshot" className="upload-label">
                                <Upload size={28} className="upload-icon" />
                                <p>Click to upload screenshot</p>
                                <small>Supports: JPG, PNG, GIF (Max 5MB)</small>
                            </label>
                            {screenshotPreview && (
                                <div className="screenshot-preview">
                                    <img src={screenshotPreview} alt="Screenshot preview" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScreenshot(null);
                                            setScreenshotPreview(null);
                                        }}
                                        className="remove-screenshot"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="drawer-footer">
                    <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Shift'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftFormDrawer;