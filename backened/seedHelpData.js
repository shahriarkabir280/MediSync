import { sql } from './config/db.js';

const seedHelpData = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Insert sample FAQ data
        const faqData = [
            {
                category: 'Account Management',
                question: 'How do I change my account password?',
                answer: 'Go to Settings > Account Security, enter your current password, then enter your new password twice to confirm the change. Make sure your new password is at least 8 characters long and includes a mix of letters, numbers, and special characters.'
            },
            {
                category: 'Appointments',
                question: 'How do I schedule appointments with patients?',
                answer: 'Navigate to the Appointments tab, click "Add New Appointment", fill in patient details, select date and time, then save. You can also set recurring appointments for regular patients.'
            },
            {
                category: 'Appointments',
                question: 'How do I cancel or reschedule an appointment?',
                answer: 'In the Appointments tab, find the appointment you want to modify. Click on it and select either "Reschedule" to change the time/date or "Cancel" to cancel it. Patients will be automatically notified of any changes.'
            },
            {
                category: 'Billing',
                question: 'How do I set up payment methods?',
                answer: 'In Settings > Billing & Payment, click "Add Payment Method" and enter your payment information securely. We support major credit cards, bank transfers, and digital wallets.'
            },
            {
                category: 'Billing',
                question: 'How do I generate invoices for patients?',
                answer: 'In the Billing tab, select the patient and services provided, then click "Generate Invoice". The invoice will be automatically sent to the patient\'s email address.'
            },
            {
                category: 'Patient Records',
                question: 'How do I add patient medical records?',
                answer: 'In the Patients tab, select a patient, then click "Add Record" to upload documents or enter medical information. You can upload PDFs, images, and other medical documents.'
            },
            {
                category: 'Patient Records',
                question: 'How do I search for specific patient information?',
                answer: 'Use the search bar in the Patients tab to find patients by name, ID, phone number, or email. You can also filter patients by various criteria like appointment status or last visit date.'
            },
            {
                category: 'Security',
                question: 'How do I enable two-factor authentication?',
                answer: 'Go to Settings > Account Security, click "Enable 2FA", scan the QR code with your authenticator app (like Google Authenticator or Authy), and enter the verification code. This adds an extra layer of security to your account.'
            },
            {
                category: 'Security',
                question: 'What should I do if I suspect my account has been compromised?',
                answer: 'Immediately change your password in Settings > Account Security. Enable two-factor authentication if not already enabled. Check your recent login activity and contact support if you notice any suspicious activity.'
            },
            {
                category: 'Technical Issues',
                question: 'The dashboard is loading slowly. What should I do?',
                answer: 'Try clearing your browser cache and cookies, check your internet connection, or switch to a different browser. If the issue persists, try disabling browser extensions or contact support for assistance.'
            },
            {
                category: 'Technical Issues',
                question: 'I\'m having trouble uploading files. What could be wrong?',
                answer: 'Ensure your file is under 10MB and in a supported format (PDF, DOC, DOCX, JPG, PNG). Check your internet connection and try uploading from a different browser. If issues persist, contact technical support.'
            },
            {
                category: 'Features',
                question: 'How do I customize my public doctor profile?',
                answer: 'Go to the Website tab to edit your public profile. You can add your photo, biography, education, experience, services, chamber information, and contact details. This information will be visible to patients visiting your public profile.'
            }
        ];

        for (const faq of faqData) {
            await client.query(`
                INSERT INTO help_faq (category, question, answer, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, true, NOW(), NOW())
                ON CONFLICT DO NOTHING
            `, [faq.category, faq.question, faq.answer]);
        }

        // Insert sample documentation articles
        const documentationData = [
            {
                title: 'Getting Started with CareConnect',
                slug: 'getting-started',
                category: 'Getting Started',
                description: 'Complete setup and onboarding guide for new doctors',
                content: `
                    <h2>Welcome to CareConnect!</h2>
                    <p>This guide will help you get started with your CareConnect account and make the most of our platform.</p>
                    
                    <h3>1. Complete Your Profile</h3>
                    <p>Start by filling out your doctor profile with accurate information including:</p>
                    <ul>
                        <li>Personal information and contact details</li>
                        <li>Education and qualifications</li>
                        <li>Professional experience</li>
                        <li>Services you provide</li>
                        <li>Chamber/clinic information</li>
                    </ul>
                    
                    <h3>2. Set Up Your Appointment System</h3>
                    <p>Configure your appointment settings:</p>
                    <ul>
                        <li>Set your working hours</li>
                        <li>Define appointment durations</li>
                        <li>Set consultation fees</li>
                        <li>Configure availability</li>
                    </ul>
                    
                    <h3>3. Add Your First Patients</h3>
                    <p>You can add patients manually or they can register themselves through your public profile.</p>
                    
                    <h3>Need Help?</h3>
                    <p>If you need assistance, don't hesitate to contact our support team!</p>
                `
            },
            {
                title: 'Managing Patient Records',
                slug: 'patient-management',
                category: 'Patient Management',
                description: 'Learn how to effectively manage patient records and information',
                content: `
                    <h2>Patient Record Management</h2>
                    <p>Efficiently managing patient records is crucial for providing quality healthcare.</p>
                    
                    <h3>Adding New Patients</h3>
                    <p>There are several ways to add patients to your system:</p>
                    <ul>
                        <li>Manual entry through the Patients tab</li>
                        <li>Patient self-registration via your public profile</li>
                        <li>Import from existing patient databases</li>
                    </ul>
                    
                    <h3>Managing Medical Records</h3>
                    <p>For each patient, you can:</p>
                    <ul>
                        <li>Upload medical documents and test results</li>
                        <li>Add consultation notes</li>
                        <li>Track medical history</li>
                        <li>Manage prescriptions</li>
                        <li>Schedule follow-up appointments</li>
                    </ul>
                    
                    <h3>Search and Filtering</h3>
                    <p>Use advanced search and filtering options to quickly find patient information.</p>
                `
            }
        ];

        for (const doc of documentationData) {
            await client.query(`
                INSERT INTO help_documentation (title, slug, category, description, content, is_published, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
                ON CONFLICT (slug) DO NOTHING
            `, [doc.title, doc.slug, doc.category, doc.description, doc.content]);
        }

        await client.query('COMMIT');
        console.log('Help system data seeded successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding help data:', error);
        throw error;
    } finally {
        client.release();
    }
};

export { seedHelpData };

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedHelpData()
        .then(() => {
            console.log('Data seeding completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Data seeding failed:', error);
            process.exit(1);
        });
}