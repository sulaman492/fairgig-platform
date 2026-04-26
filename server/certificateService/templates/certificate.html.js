// templates/certificate.html.js
import { formatCurrency, formatDate, escapeHtml, generateCertificateId } from '../utils/helpers.js';

export const generateCertificateHTML = (data) => {
    const certificateId = generateCertificateId();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FairGig - Income Certificate</title>
    <style>
        ${getStyles()}
    </style>
</head>
<body>
    <div class="print-button no-print">
        <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
    
    <div class="certificate">
        ${getHeader()}
        ${getBody(data, certificateId)}
        ${getFooter()}
    </div>
</body>
</html>`;
};

const getStyles = () => `
    @media print {
        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none; }
        .certificate { box-shadow: none; margin: 0; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 40px 20px; }
    .certificate { max-width: 1000px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
    .certificate-header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 40px; text-align: center; }
    .certificate-header h1 { font-size: 32px; margin-bottom: 10px; }
    .certificate-header p { font-size: 14px; opacity: 0.9; }
    .certificate-body { padding: 40px; position: relative; }
    .watermark { position: relative; }
    .watermark::after { content: "FAIRGIG"; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; opacity: 0.03; pointer-events: none; white-space: nowrap; }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .info-item { display: flex; flex-direction: column; }
    .info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .info-value { font-size: 16px; font-weight: 600; color: #1f2937; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f9fafb; border-radius: 12px; padding: 15px; text-align: center; border: 1px solid #e5e7eb; }
    .stat-value { font-size: 24px; font-weight: bold; color: #1e3c72; }
    .stat-label { font-size: 11px; color: #6b7280; margin-top: 5px; }
    .platform-section { margin-bottom: 30px; }
    .platform-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb; }
    .platform-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .platform-item { background: #f9fafb; border-radius: 8px; padding: 10px 15px; display: flex; justify-content: space-between; align-items: center; }
    .platform-name { font-weight: 500; color: #374151; }
    .platform-earnings { font-weight: 600; color: #059669; }
    .shifts-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    .shifts-table th, .shifts-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .shifts-table th { background: #f9fafb; font-weight: 600; color: #374151; }
    .shifts-table td { color: #4b5563; }
    .certificate-footer { background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
    .verification-badge { display: inline-block; background: #059669; color: white; padding: 2px 8px; border-radius: 20px; font-size: 10px; margin-left: 8px; }
    .print-button { text-align: center; margin-bottom: 20px; }
    .btn-print { background: #1e3c72; color: white; border: none; padding: 12px 30px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.3s; }
    .btn-print:hover { background: #2a5298; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 15px; margin-top: 20px; font-size: 12px; color: #92400e; border-radius: 8px; }
    .qr-code { text-align: center; margin-top: 20px; padding: 15px; background: white; border: 1px dashed #e5e7eb; border-radius: 8px; }
    @media (max-width: 600px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .info-grid { grid-template-columns: 1fr; }
        .certificate-body { padding: 20px; }
        .platform-grid { grid-template-columns: 1fr; }
    }
`;

const getHeader = () => `
    <div class="certificate-header">
        <h1>🏆 Income Certificate</h1>
        <p>Verified Earnings Statement • FairGig Platform</p>
    </div>
`;

const getBody = (data, certificateId) => {
    const formatCurrencyFn = (value) => formatCurrency(value);
    const formatDateFn = (dateStr) => formatDate(dateStr);
    
    return `
    <div class="certificate-body watermark">
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Worker Name</span>
                <span class="info-value">${escapeHtml(data.workerName)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Worker ID</span>
                <span class="info-value">${data.workerId}</span>
            </div>
            <div class="info-item">
                <span class="info-label">CNIC</span>
                <span class="info-value">${data.cnic}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Certificate Date</span>
                <span class="info-value">${formatDateFn(data.generatedDate)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Period Covered</span>
                <span class="info-value">${formatDateFn(data.startDate)} - ${formatDateFn(data.endDate)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Verification Status</span>
                <span class="info-value">✅ Verified <span class="verification-badge">AUTHENTIC</span></span>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${formatCurrencyFn(data.totalEarnings)}</div>
                <div class="stat-label">Total Verified Earnings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.totalHours} hrs</div>
                <div class="stat-label">Total Hours Worked</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatCurrencyFn(data.avgHourlyRate)}<span style="font-size: 12px;">/hr</span></div>
                <div class="stat-label">Average Hourly Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.totalShifts}</div>
                <div class="stat-label">Total Shifts</div>
            </div>
        </div>
        
        <div class="platform-section">
            <div class="platform-title">📊 Earnings by Platform</div>
            <div class="platform-grid">
                ${Object.entries(data.platformStats).map(([platform, stats]) => `
                    <div class="platform-item">
                        <span class="platform-name">${platform}</span>
                        <span class="platform-earnings">${formatCurrencyFn(stats.earnings)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${data.shifts && data.shifts.length > 0 ? `
        <div class="platform-section">
            <div class="platform-title">📋 Recent Verified Shifts</div>
            <table class="shifts-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Platform</th>
                        <th>Hours</th>
                        <th>Gross</th>
                        <th>Deductions</th>
                        <th>Net</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.shifts.map(shift => `
                        <tr>
                            <td>${formatDateFn(shift.shift_date)}</td>
                            <td>${shift.platform}</td>
                            <td>${shift.hours_worked} hrs</td>
                            <td>${formatCurrencyFn(shift.gross_earned)}</td>
                            <td>${formatCurrencyFn(shift.platform_deductions)}</td>
                            <td><strong>${formatCurrencyFn(shift.net_received)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ` : ''}
        
        <div class="note">
            <strong>📌 Important Note:</strong> This certificate includes only VERIFIED earnings from the FairGig platform. 
            All information is based on worker-submitted data that has been manually or automatically verified. 
            FairGig does not guarantee the completeness of this information but confirms it matches submitted records.
        </div>
        
        <div class="qr-code no-print">
            <p style="font-size: 11px; color: #6b7280;">Scan to verify certificate authenticity</p>
            <div style="font-size: 40px;">🔷🔷🔷</div>
            <p style="font-size: 10px; color: #9ca3af; margin-top: 5px;">Certificate ID: ${certificateId}</p>
        </div>
    </div>
    `;
};

const getFooter = () => `
    <div class="certificate-footer">
        <p>Generated by FairGig Platform - Empowering Gig Workers</p>
        <p>This is a computer-generated document and requires no physical signature.</p>
        <p style="margin-top: 5px;">© ${new Date().getFullYear()} FairGig • fairgig.com/verify</p>
    </div>
`;