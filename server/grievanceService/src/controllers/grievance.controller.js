// src/controllers/grievanceController.js
import Complaint from '../models/grievance.model.js';
import { query } from '../utils/db.js';
// Worker: Create a complaint
export const createComplaint = async (req, res) => {
    try {
        const { platform, category, title, description, tags } = req.body;
        
        if (!platform || !title || !description) {
            return res.status(400).json({ error: 'Platform, title, and description are required' });
        }
        
        const complaint = await Complaint.create({
            user_id: req.user.id,
            platform,
            category,
            title,
            description,
            tags: tags || []
        });
        
        res.status(201).json({ success: true, complaint });
    } catch (error) {
        console.error('Create complaint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Worker: Get my complaints
// Update getMyComplaints
export const getMyComplaints = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const result = await Complaint.findByUserId(req.user.id, page, limit);
        
        res.json({ 
            success: true, 
            complaints: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get complaints error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update getAllComplaints
export const getAllComplaints = async (req, res) => {
    try {
        const { status, platform } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const result = await Complaint.findAll({ status, platform }, page, limit);
        
        res.json({ 
            success: true, 
            complaints: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Get all complaints error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Update getCommunityBulletin
export const getCommunityBulletin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        const result = await Complaint.getCommunityBulletin(page, limit);
        
        res.json({ 
            success: true, 
            complaints: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Community bulletin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Advocate: Get single complaint
export const getComplaintById = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findById(id);
        
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        
        res.json({ success: true, complaint });
    } catch (error) {
        console.error('Get complaint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Advocate: Update complaint (status, tags, cluster)
export const updateComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tags, cluster_id } = req.body;
        
        const complaint = await Complaint.update(id, { status, tags, cluster_id });
        
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        
        res.json({ success: true, complaint });
    } catch (error) {
        console.error('Update complaint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Advocate: Delete complaint
export const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        await Complaint.delete(id);
        res.json({ success: true, message: 'Complaint deleted' });
    } catch (error) {
        console.error('Delete complaint error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Worker: Upvote complaint
export const upvoteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.upvote(id);
        
        if (!complaint) {
            return res.status(404).json({ error: 'Complaint not found' });
        }
        
        res.json({ success: true, upvotes: complaint.upvotes });
    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Advocate: Get trending complaints
export const getTrending = async (req, res) => {
    try {
        const trending = await Complaint.getTrending();
        res.json({ success: true, trending });
    } catch (error) {
        console.error('Get trending error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
