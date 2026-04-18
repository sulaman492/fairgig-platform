// src/components/worker/RecentShifts.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { type Shift } from './type';

interface RecentShiftsProps {
  shifts: Shift[];
  onLogShift: () => void;
}

const RecentShifts: React.FC<RecentShiftsProps> = ({ shifts, onLogShift }) => {
  return (
    <div className="card recent-shifts-card">
      <div className="card-header-with-action">
        <div><h3 className="card-title">Recent Shifts</h3><p className="card-subtitle">Your latest logged shifts</p></div>
        <button className="btn btn-primary" onClick={onLogShift}><Plus size={18} /> Log Shift</button>
      </div>
      <div className="shifts-list">
        {shifts.slice(0, 5).map((shift) => (
          <div key={shift.id} className="shift-item">
            <div className="shift-info">
              <div className={`status-indicator status-${shift.verification_status}`}></div>
              <div><p className="shift-platform">{shift.platform}</p><p className="shift-date">{shift.shift_date}</p></div>
            </div>
            <div className="shift-earnings">
              <p className="shift-net">Rs. {shift.net_received}</p>
              <p className="shift-detail">{shift.hours_worked} hrs • Rs. {(shift.net_received / shift.hours_worked).toFixed(0)}/hr</p>
            </div>
          </div>
        ))}
        {shifts.length === 0 && <p>No shifts logged yet. Click "Log Shift" to get started.</p>}
      </div>
    </div>
  );
};

export default RecentShifts;