import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { sql } from '../config/db.js';

const router = express.Router();

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/support-tickets/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common document and image formats
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only document and image files are allowed'));
        }
    }
});

// FAQ Routes
// Get all FAQs (public endpoint)
router.get('/faq', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        // For now, return hardcoded FAQ data since we haven't created the tables yet
        const faqData = [
            {
                id: 1,
                category: 'Account Management',
                question: 'How do I change my account password?',
                answer: 'Go to Settings > Account Security, enter your current password, then enter your new password twice to confirm the change.',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 2,
                category: 'Appointments',
                question: 'How do I schedule appointments with patients?',
                answer: 'Navigate to the Appointments tab, click "Add New Appointment", fill in patient details, select date and time, then save.',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 3,
                category: 'Billing',
                question: 'How do I set up payment methods?',
                answer: 'In Settings > Billing & Payment, click "Add Payment Method" and enter your payment information securely.',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 4,
                category: 'Patient Records',
                question: 'How do I add patient medical records?',
                answer: 'In the Patients tab, select a patient, then click "Add Record" to upload documents or enter medical information.',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 5,
                category: 'Security',
                question: 'How do I enable two-factor authentication?',
                answer: 'Go to Settings > Account Security, click "Enable 2FA", scan the QR code with your authenticator app, and enter the verification code.',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: 6,
                category: 'Technical Issues',
                question: 'The dashboard is loading slowly. What should I do?',
                answer: 'Try clearing your browser cache, check your internet connection, or switch to a different browser. Contact support if issues persist.',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }
        ];
        
        let filteredData = faqData;
        
        if (category) {
            filteredData = filteredData.filter(faq => faq.category === category);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            filteredData = filteredData.filter(faq => 
                faq.question.toLowerCase().includes(searchLower) ||
                faq.answer.toLowerCase().includes(searchLower) ||
                faq.category.toLowerCase().includes(searchLower)
            );
        }
        
        res.json({
            success: true,
            data: filteredData,
            count: filteredData.length
        });
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch FAQs' 
        });
    }
});

// Support Ticket Routes
// Submit support ticket
router.post('/support-tickets', authenticateToken, upload.array('attachments', 5), async (req, res) => {
    try {
        const { subject, category, priority, description } = req.body;
        const doctorId = req.user.doctorId;
        const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        
        // Validate required fields
        if (!subject || !description) {
            return res.status(400).json({
                success: false,
                error: 'Subject and description are required'
            });
        }
        
        // For now, just return success without actually storing in database
        const ticket = {
            id: Date.now(),
            ticket_number: ticketNumber,
            doctor_id: doctorId,
            subject,
            category: category || 'other',
            priority: priority || 'medium',
            description,
            status: 'open',
            created_at: new Date(),
            updated_at: new Date()
        };
        
        // TODO: Send email notification to support team
        
        res.json({
            success: true,
            message: 'Support ticket submitted successfully',
            data: {
                ticketNumber: ticket.ticket_number,
                ticketId: ticket.id,
                status: ticket.status
            }
        });
        
    } catch (error) {
        console.error('Error submitting support ticket:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to submit support ticket' 
        });
    }
});

// Get user's support tickets
router.get('/support-tickets', authenticateToken, async (req, res) => {
    try {
        const doctorId = req.user.doctorId;
        
        // Return sample data for now
        const sampleTickets = [
            {
                id: 1,
                ticket_number: 'TKT-1234567890-ABC1',
                doctor_id: doctorId,
                subject: 'Unable to upload patient files',
                category: 'technical',
                priority: 'medium',
                description: 'I am having trouble uploading PDF files for patient records.',
                status: 'open',
                created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
                attachments: []
            },
            {
                id: 2,
                ticket_number: 'TKT-0987654321-XYZ2',
                doctor_id: doctorId,
                subject: 'Billing integration question',
                category: 'billing',
                priority: 'low',
                description: 'How do I set up automated billing for recurring patients?',
                status: 'resolved',
                created_at: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days ago
                updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
                attachments: []
            }
        ];
        
        res.json({
            success: true,
            data: sampleTickets,
            count: sampleTickets.length
        });
        
    } catch (error) {
        console.error('Error fetching support tickets:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch support tickets' 
        });
    }
});

// Get single support ticket
router.get('/support-tickets/:ticketId', authenticateToken, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const doctorId = req.user.doctorId;
        
        // Return sample ticket data
        const sampleTicket = {
            id: parseInt(ticketId),
            ticket_number: `TKT-${ticketId}-SAMPLE`,
            doctor_id: doctorId,
            subject: 'Sample Support Ticket',
            category: 'technical',
            priority: 'medium',
            description: 'This is a sample support ticket for testing purposes.',
            status: 'open',
            created_at: new Date(),
            updated_at: new Date(),
            attachments: []
        };
        
        res.json({
            success: true,
            data: sampleTicket
        });
        
    } catch (error) {
        console.error('Error fetching support ticket:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch support ticket' 
        });
    }
});

// Add response to support ticket (for follow-ups)
router.post('/support-tickets/:ticketId/responses', authenticateToken, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message } = req.body;
        const doctorId = req.user.doctorId;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
        
        // Return success for now
        const response = {
            id: Date.now(),
            ticket_id: ticketId,
            responder_type: 'doctor',
            responder_id: doctorId,
            message,
            created_at: new Date()
        };
        
        res.json({
            success: true,
            message: 'Response added successfully',
            data: response
        });
        
    } catch (error) {
        console.error('Error adding ticket response:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add response' 
        });
    }
});

// Documentation/Knowledge Base Routes
// Get documentation categories
router.get('/documentation/categories', async (req, res) => {
    try {
        const categories = [
            { category: 'Getting Started', article_count: 3 },
            { category: 'Patient Management', article_count: 5 },
            { category: 'Billing & Payments', article_count: 4 },
            { category: 'Security', article_count: 2 },
            { category: 'API Integration', article_count: 3 },
            { category: 'Troubleshooting', article_count: 6 }
        ];
        
        res.json({
            success: true,
            data: categories
        });
        
    } catch (error) {
        console.error('Error fetching documentation categories:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch documentation categories' 
        });
    }
});

// Get documentation articles
router.get('/documentation', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        const articles = [
            {
                id: 1,
                title: 'Getting Started with CareConnect',
                category: 'Getting Started',
                description: 'Complete setup and onboarding guide for new doctors',
                slug: 'getting-started',
                updated_at: new Date()
            },
            {
                id: 2,
                title: 'Managing Patient Records',
                category: 'Patient Management',
                description: 'Learn how to effectively manage patient records and information',
                slug: 'patient-management',
                updated_at: new Date()
            },
            {
                id: 3,
                title: 'Setting Up Billing',
                category: 'Billing & Payments',
                description: 'Configure billing and payment processing',
                slug: 'billing-setup',
                updated_at: new Date()
            }
        ];
        
        let filteredArticles = articles;
        
        if (category) {
            filteredArticles = filteredArticles.filter(article => article.category === category);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            filteredArticles = filteredArticles.filter(article => 
                article.title.toLowerCase().includes(searchLower) ||
                article.description.toLowerCase().includes(searchLower)
            );
        }
        
        res.json({
            success: true,
            data: filteredArticles,
            count: filteredArticles.length
        });
        
    } catch (error) {
        console.error('Error fetching documentation:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch documentation' 
        });
    }
});

// Get single documentation article
router.get('/documentation/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        
        const sampleArticle = {
            id: 1,
            title: 'Sample Documentation Article',
            slug: slug,
            category: 'Getting Started',
            description: 'This is a sample documentation article',
            content: '<h2>Sample Content</h2><p>This is sample content for the documentation article.</p>',
            is_published: true,
            view_count: 42,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        res.json({
            success: true,
            data: sampleArticle
        });
        
    } catch (error) {
        console.error('Error fetching documentation article:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch documentation article' 
        });
    }
});

// Contact/Feedback Routes
router.post('/contact', authenticateToken, async (req, res) => {
    try {
        const { type, subject, message, email } = req.body;
        const doctorId = req.user.doctorId;
        
        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'Subject and message are required'
            });
        }
        
        const contactMessage = {
            id: Date.now(),
            doctor_id: doctorId,
            type: type || 'general',
            subject,
            message,
            email,
            created_at: new Date(),
            status: 'new'
        };
        
        res.json({
            success: true,
            message: 'Message sent successfully',
            data: contactMessage
        });
        
    } catch (error) {
        console.error('Error sending contact message:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send message' 
        });
    }
});

export default router;