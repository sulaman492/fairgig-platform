// src/components/worker/ShiftFormDrawer.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ShiftFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (shift: any) => void;
}

const ShiftFormDrawer: React.FC<ShiftFormDrawerProps> = ({ isOpen, onClose, onSubmit }) => {
  const [newShift, setNewShift] = useState({
    platform: '', shift_date: new Date().toISOString().split('T')[0],
    hours_worked: 0, gross_earned: 0, platform_deductions: 0, net_received: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    setNewShift(prev => {
      const updated = { ...prev, [name]: name === 'platform' || name === 'shift_date' ? value : numValue };
      if ((name === 'gross_earned' || name === 'platform_deductions') && !isNaN(updated.gross_earned) && !isNaN(updated.platform_deductions)) {
        updated.net_received = updated.gross_earned - updated.platform_deductions;
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    onSubmit(newShift);
    setNewShift({ platform: '', shift_date: new Date().toISOString().split('T')[0], hours_worked: 0, gross_earned: 0, platform_deductions: 0, net_received: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <div><h3 className="drawer-title">Log New Shift</h3><p className="drawer-subtitle">Add your recent earnings</p></div>
          <button onClick={onClose} className="drawer-close"><X size={20} /></button>
        </div>
        <div className="drawer-body">
          <div className="form-group"><label className="form-label">Platform</label>
            <select name="platform" value={newShift.platform} onChange={handleChange} className="form-select" required>
              <option value="">Select Platform</option>
              <option value="Uber">Uber</option><option value="Foodpanda">Foodpanda</option>
              <option value="Bykea">Bykea</option><option value="Careem">Careem</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">Date</label>
            <input type="date" name="shift_date" value={newShift.shift_date} onChange={handleChange} className="form-input" required />
          </div>
          <div className="form-group"><label className="form-label">Hours Worked</label>
            <input type="number" name="hours_worked" value={newShift.hours_worked || ''} onChange={handleChange} placeholder="0" className="form-input" required />
          </div>
          <div className="form-group"><label className="form-label">Gross Earnings (Rs.)</label>
            <input type="number" name="gross_earned" value={newShift.gross_earned || ''} onChange={handleChange} placeholder="0" className="form-input" required />
          </div>
          <div className="form-group"><label className="form-label">Platform Deductions (Rs.)</label>
            <input type="number" name="platform_deductions" value={newShift.platform_deductions || ''} onChange={handleChange} placeholder="0" className="form-input" required />
          </div>
          <div className="form-group"><label className="form-label">Net Received (Rs.)</label>
            <input type="number" name="net_received" value={newShift.net_received || ''} onChange={handleChange} placeholder="Auto-calculated" className="form-input" />
          </div>
        </div>
        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Submit Shift</button>
        </div>
      </div>
    </div>
  );
};

export default ShiftFormDrawer;