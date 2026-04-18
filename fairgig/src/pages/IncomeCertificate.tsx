// src/components/worker/IncomeCertificate.tsx
import React, { useRef } from 'react';
import { Printer, Download, Shield, CheckCircle } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import type { User, Summary } from './type';

interface IncomeCertificateProps {
  user: User | null;
  summary: Summary | null;
}

const IncomeCertificate: React.FC<IncomeCertificateProps> = ({ user, summary }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => certificateRef.current,
  });

  const handleDownloadPDF = () => {
    // In a real app, you'd call backend to generate PDF
    // For now, just print
    handlePrint();
  };

  return (
    <div className="certificate-container">
      <div>
        <h1 className="page-title">Income Certificate</h1>
        <p className="page-subtitle">Official income verification document</p>
      </div>

      {/* Certificate Content */}
      <div ref={certificateRef}>
        <div className="card certificate-card" style={{ padding: '32px' }}>
          <div className="certificate-header">
            <div>
              <h1 className="certificate-title">Income Verification Certificate</h1>
              <p className="certificate-subtitle">Issued by FairGig</p>
            </div>
            <div className="certificate-badges">
              <div className="cert-badge green">
                <CheckCircle size={28} />
              </div>
              <div className="cert-badge blue">
                <Shield size={28} />
              </div>
            </div>
          </div>

          <div className="certificate-details">
            <div className="detail-row">
              <span className="detail-label">Worker Name:</span>
              <span className="detail-value">{user?.name || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user?.email || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">City:</span>
              <span className="detail-value">{user?.city || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Period:</span>
              <span className="detail-value">Last 30 Days</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Verified Earnings:</span>
              <span className="detail-value highlight">
                Rs. {summary?.total_net?.toLocaleString() || 0}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Hours Logged:</span>
              <span className="detail-value">{summary?.total_hours || 0} hours</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Average Hourly Rate:</span>
              <span className="detail-value">Rs. {summary?.avg_hourly_rate || 0}/hour</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total Shifts:</span>
              <span className="detail-value">{summary?.total_shifts || 0}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Verification Status:</span>
              <span className="detail-value success">
                <CheckCircle size={16} style={{ display: 'inline', marginRight: '4px' }} />
                Fully Verified
              </span>
            </div>
          </div>

          <div className="certificate-footer">
            <p>This certificate is electronically generated and verified by FairGig.</p>
            <p>Certificate ID: FG-{Date.now()}-{user?.id || '000'}</p>
            <p>Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="certificate-actions">
        <button className="btn btn-secondary" onClick={handlePrint}>
          <Printer size={18} /> Print
        </button>
        <button className="btn btn-secondary">
          <Download size={18} /> Share Link
        </button>
        <button className="btn btn-primary" onClick={handleDownloadPDF}>
          <Download size={18} /> Download PDF
        </button>
      </div>
    </div>
  );
};

export default IncomeCertificate;