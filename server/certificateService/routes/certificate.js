// routes/certificate.js
import express from 'express';
import { prepareCertificateData } from '../services/calculator.js';
import { generateCertificateHTML } from '../templates/certificate.html.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
    try {
        const { 
            workerName, 
            workerId, 
            cnic, 
            startDate, 
            endDate, 
            shifts,
            totalEarnings,
            totalHours,
            totalDeductions,
            platformStats
        } = req.body;
        
        // Validate input
        if (!shifts || shifts.length === 0) {
            return res.status(400).json({ error: 'No shift data provided' });
        }
        
        // Prepare certificate data
        const calculatedData = prepareCertificateData(shifts, {
            totalEarnings,
            totalHours,
            totalDeductions,
            platformStats
        });
        
        // Generate HTML
        const html = generateCertificateHTML({
            workerName: workerName || 'Gig Worker',
            workerId: workerId || 'N/A',
            cnic: cnic || 'Not Provided',
            startDate,
            endDate,
            generatedDate: new Date().toISOString().split('T')[0],
            shifts: shifts.slice(0, 20),
            ...calculatedData
        });
        
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
        
    } catch (error) {
        console.error('Certificate generation error:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
});

export default router;