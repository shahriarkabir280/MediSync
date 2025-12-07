import { sql } from './config/db.js';

const createHelpSchema = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // FAQ Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS help_faq (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100) NOT NULL,
                question TEXT NOT NULL,
                answer TEXT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by INTEGER,
                updated_by INTEGER
            );
        `);

        // Support Tickets Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id SERIAL PRIMARY KEY,
                ticket_number VARCHAR(50) UNIQUE NOT NULL,
                doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
                subject VARCHAR(255) NOT NULL,
                category VARCHAR(100) DEFAULT 'other',
                priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
                description TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
                assigned_to INTEGER,
                resolution_notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                resolved_at TIMESTAMP WITH TIME ZONE
            );
        `);

        // Support Ticket Attachments Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS support_ticket_attachments (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                mime_type VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Support Ticket Responses Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS support_ticket_responses (
                id SERIAL PRIMARY KEY,
                ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
                responder_type VARCHAR(20) NOT NULL CHECK (responder_type IN ('doctor', 'support', 'admin')),
                responder_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                is_internal BOOLEAN DEFAULT false
            );
        `);

        // Documentation/Knowledge Base Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS help_documentation (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                category VARCHAR(100) NOT NULL,
                description TEXT,
                content TEXT NOT NULL,
                is_published BOOLEAN DEFAULT false,
                view_count INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_by INTEGER,
                updated_by INTEGER
            );
        `);

        // Contact Messages Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id SERIAL PRIMARY KEY,
                doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
                type VARCHAR(50) DEFAULT 'general',
                subject VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                responded_at TIMESTAMP WITH TIME ZONE,
                response_message TEXT
            );
        `);

        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_help_faq_category ON help_faq(category);
            CREATE INDEX IF NOT EXISTS idx_help_faq_active ON help_faq(is_active);
            CREATE INDEX IF NOT EXISTS idx_support_tickets_doctor ON support_tickets(doctor_id);
            CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
            CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);
            CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON support_ticket_attachments(ticket_id);
            CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket ON support_ticket_responses(ticket_id);
            CREATE INDEX IF NOT EXISTS idx_documentation_category ON help_documentation(category);
            CREATE INDEX IF NOT EXISTS idx_documentation_published ON help_documentation(is_published);
            CREATE INDEX IF NOT EXISTS idx_documentation_slug ON help_documentation(slug);
            CREATE INDEX IF NOT EXISTS idx_contact_messages_doctor ON contact_messages(doctor_id);
            CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
        `);

        await client.query('COMMIT');
        console.log('Help system schema created successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating help schema:', error);
        throw error;
    } finally {
        client.release();
    }
};

export { createHelpSchema };

// Run the schema creation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    createHelpSchema()
        .then(() => {
            console.log('Schema creation completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Schema creation failed:', error);
            process.exit(1);
        });
}