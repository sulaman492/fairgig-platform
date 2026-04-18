// src/components/worker/EarningsTable.tsx
import React from 'react';
import { Plus, Eye } from 'lucide-react';
import type { Shift } from './type';

interface EarningsTableProps {
  shifts: Shift[];
  onLogShift: () => void;
}

const EarningsTable: React.FC<EarningsTableProps> = ({ shifts, onLogShift }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge badge-success">Verified</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'discrepancy':
        return <span className="badge badge-danger">Discrepancy</span>;
      default:
        return <span className="badge badge-default">{status}</span>;
    }
  };

  return (
    <div className="tab-content">
      <div className="tab-header">
        <div>
          <h1 className="page-title">Earnings Logger</h1>
          <p className="page-subtitle">Track and verify your platform earnings</p>
        </div>
        <button className="btn btn-primary" onClick={onLogShift}>
          <Plus size={18} /> Log New Shift
        </button>
      </div>
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Date</th>
                <th>Hours</th>
                <th>Gross (Rs.)</th>
                <th>Deductions (Rs.)</th>
                <th>Net (Rs.)</th>
                <th>Hourly Rate</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id} className="table-row-hover">
                  <td className="platform-cell">{shift.platform}</td>
                  <td>{shift.shift_date}</td>
                  <td>{shift.hours_worked} hrs</td>
                  <td>Rs. {shift.gross_earned?.toLocaleString()}</td>
                  <td className="fee-cell">-Rs. {shift.platform_deductions?.toLocaleString()}</td>
                  <td className="net-cell">Rs. {shift.net_received?.toLocaleString()}</td>
                  <td>Rs. {(shift.net_received / shift.hours_worked).toFixed(0)}/hr</td>
                  <td>{getStatusBadge(shift.verification_status)}</td>
                  <td>
                    <button className="btn btn-ghost view-btn" style={{ padding: '4px 8px' }}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                    No shifts logged yet. Click "Log New Shift" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EarningsTable;