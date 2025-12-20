import { sql } from '../config/db.js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure email transporter (you'll need to set these in .env)
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Get all emails for a doctor with filters
export const getEmails = async (req, res) => {
  try {
    const doctorId = req.user?.id || req.doctorId;

    if (!doctorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No user ID found' });
    }

    const { folder = 'inbox', search = '', page = 1, limit = 20, unread_only = false } = req.query;

    // Ensure logs dir exists and log debug info
    try {
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      const logMsg = `[${new Date().toISOString()}] getEmails - DoctorID: ${doctorId}, Folder: ${folder}, User: ${JSON.stringify(req.user)}\n`;
      fs.appendFileSync(path.join(logDir, 'debug.txt'), logMsg);
    } catch (e) { console.error('Log error', e); }

    const offset = (page - 1) * limit;

    let baseQuery = sql`
      SELECT 
        e.*,
        CASE 
          WHEN e.sender_id = ${doctorId} THEN e.recipient_email
          ELSE e.sender_email
        END as display_email,
        CASE 
          WHEN e.sender_id = ${doctorId} THEN e.recipient_name
          ELSE e.sender_name
        END as display_name
      FROM emails e
    `;

    let whereClause = sql``;

    // Filter by folder
    if (folder === 'inbox') {
      whereClause = sql`WHERE e.recipient_id = ${doctorId} AND e.deleted_by_recipient = false AND e.folder = 'inbox'`;
    } else if (folder === 'sent') {
      whereClause = sql`WHERE e.sender_id = ${doctorId} AND e.deleted_by_sender = false AND e.folder = 'sent'`;
    } else if (folder === 'drafts') {
      whereClause = sql`WHERE e.sender_id = ${doctorId} AND e.is_draft = true AND e.deleted_by_sender = false`;
    } else if (folder === 'starred') {
      whereClause = sql`WHERE e.recipient_id = ${doctorId} AND e.is_starred = true AND e.deleted_by_recipient = false`;
    } else if (folder === 'trash') {
      whereClause = sql`WHERE ((e.sender_id = ${doctorId} AND e.deleted_by_sender = true) OR (e.recipient_id = ${doctorId} AND e.deleted_by_recipient = true))`;
    } else {
      // Default safety fallback
      whereClause = sql`WHERE e.recipient_id = ${doctorId} AND e.folder = 'inbox'`;
    }

    // Filter by unread
    if (unread_only === 'true') {
      whereClause = sql`${whereClause} AND e.is_read = false`;
    }

    // Search filter
    if (search) {
      whereClause = sql`${whereClause} AND (
        e.subject ILIKE ${`%${search}%`} OR 
        e.body ILIKE ${`%${search}%`} OR 
        e.sender_email ILIKE ${`%${search}%`} OR
        e.recipient_email ILIKE ${`%${search}%`}
      )`;
    }

    const query = sql`${baseQuery} ${whereClause} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    const emails = await query;

    // Log result count
    try {
      const logDir = path.join(__dirname, '../logs');
      fs.appendFileSync(path.join(logDir, 'debug.txt'), `[${new Date().toISOString()}] Found ${emails.length} emails\n`);
    } catch (e) { }

    // Get total count
    let countQuery = sql`SELECT COUNT(*) as total FROM emails e ${whereClause}`;
    const [{ total }] = await countQuery;

    res.json({
      success: true,
      data: {
        emails,
        pagination: {
          total: parseInt(total),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        },
        debugInfo: {
          queryDoctorId: doctorId,
          queryFolder: folder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    try {
      const logDir = path.join(__dirname, '../logs');
      fs.appendFileSync(path.join(logDir, 'debug.txt'), `Error: ${error.message}\n`);
    } catch (e) { }
    res.status(500).json({ success: false, message: 'Failed to fetch emails', error: error.message });
  }
};

// Get single email
export const getEmail = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;

    const [email] = await sql`
      SELECT * FROM emails 
      WHERE id = ${id} 
      AND (sender_id = ${doctorId} OR recipient_id = ${doctorId})
    `;

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    // Mark as read if recipient is viewing
    if (email.recipient_id === doctorId && !email.is_read) {
      await sql`
        UPDATE emails 
        SET is_read = true, read_at = NOW() 
        WHERE id = ${id}
      `;
      email.is_read = true;
    }

    res.json({ success: true, data: email });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email', error: error.message });
  }
};

// Send email
export const sendEmail = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    let {
      recipient_email,
      recipient_name,
      recipient_id,
      subject,
      body,
      cc,
      bcc,
      reply_to_id,
      attachments = []
    } = req.body;

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      const uploadedAttachments = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        path: file.path,
        type: file.mimetype,
        size: file.size
      }));

      // If attachments came as a JSON string in FormData, parse it
      let existingAttachments = [];
      if (typeof attachments === 'string') {
        try {
          existingAttachments = JSON.parse(attachments);
        } catch (e) {
          existingAttachments = [];
        }
      } else if (Array.isArray(attachments)) {
        existingAttachments = attachments;
      }

      attachments = [...existingAttachments, ...uploadedAttachments];
    }

    if (!recipient_email || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and subject are required'
      });
    }

    // Get sender info from database
    const [doctor] = await sql`
      SELECT id, email, first_name, last_name 
      FROM doctors 
      WHERE id = ${doctorId}
    `;

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Check if recipient is an internal user
    let internalRecipientId = recipient_id;
    let internalRecipientName = recipient_name;

    if (!internalRecipientId && recipient_email) {
      const cleanEmail = recipient_email.trim();

      // Try to find doctor
      const [doc] = await sql`SELECT id, first_name, last_name FROM doctors WHERE email ILIKE ${cleanEmail}`;
      if (doc) {
        internalRecipientId = doc.id;
        internalRecipientName = `${doc.first_name} ${doc.last_name}`;
      } else {
        // Try to find patient
        const [pat] = await sql`SELECT id, first_name, last_name FROM patients WHERE email ILIKE ${cleanEmail}`;
        if (pat) {
          internalRecipientId = pat.id;
          internalRecipientName = `${pat.first_name} ${pat.last_name}`;
        }
      }
    }

    // Insert SENDER copy (Sent folder)
    const [senderCopy] = await sql`
      INSERT INTO emails (
        sender_id, sender_email, sender_name,
        recipient_id, recipient_email, recipient_name,
        subject, body, cc, bcc,
        reply_to_id, attachments,
        is_draft, folder, is_read
      ) VALUES (
        ${doctorId},
        ${doctor.email},
        ${doctor.first_name + ' ' + doctor.last_name},
        ${internalRecipientId || null},
        ${recipient_email},
        ${internalRecipientName || recipient_name || recipient_email},
        ${subject},
        ${body},
        ${cc || null},
        ${bcc || null},
        ${reply_to_id || null},
        ${JSON.stringify(attachments)},
        false,
        'sent',
        true 
      )
      RETURNING *
    `;

    // If internal user, insert RECIPIENT copy (Inbox folder)
    if (internalRecipientId) {
      await sql`
        INSERT INTO emails (
          sender_id, sender_email, sender_name,
          recipient_id, recipient_email, recipient_name,
          subject, body, cc, bcc,
          reply_to_id, attachments,
          is_draft, folder, is_read
        ) VALUES (
          ${doctorId},
          ${doctor.email},
          ${doctor.first_name + ' ' + doctor.last_name},
          ${internalRecipientId},
          ${recipient_email},
          ${internalRecipientName},
          ${subject},
          ${body},
          ${cc || null},
          ${bcc || null},
          ${reply_to_id || null},
          ${JSON.stringify(attachments)},
          false,
          'inbox',
          false
        )
      `;
    }

    // Send actual email via SMTP (optional - can be disabled for internal system)
    if (process.env.SMTP_ENABLED === 'true') {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: `"${doctor.first_name} ${doctor.last_name}" <${doctor.email}>`,
          to: recipient_email,
          cc: cc,
          bcc: bcc,
          subject: subject,
          html: body,
          attachments: attachments.map(att => ({
            filename: att.name,
            path: att.path // Use absolute path for nodemailer
          }))
        });
      } catch (smtpError) {
        console.error('SMTP Error:', smtpError);
        // Email saved in database but SMTP failed
      }
    }

    res.json({ success: true, data: senderCopy, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
};

// Save draft
export const saveDraft = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    let {
      id,
      recipient_email,
      recipient_name,
      subject,
      body,
      cc,
      bcc,
      attachments = []
    } = req.body;

    // Handle uploaded files
    if (req.files && req.files.length > 0) {
      const uploadedAttachments = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        path: file.path,
        type: file.mimetype,
        size: file.size
      }));

      let existingAttachments = [];
      if (typeof attachments === 'string') {
        try {
          existingAttachments = JSON.parse(attachments);
        } catch (e) {
          existingAttachments = [];
        }
      } else if (Array.isArray(attachments)) {
        existingAttachments = attachments;
      }

      attachments = [...existingAttachments, ...uploadedAttachments];
    } else if (typeof attachments === 'string') {
      // If no new files but attachments present as string (e.g. from FormData)
      try {
        attachments = JSON.parse(attachments);
      } catch (e) {
        attachments = [];
      }
    }

    // Get sender info from database
    const [doctor] = await sql`
      SELECT id, email, first_name, last_name 
      FROM doctors 
      WHERE id = ${doctorId}
    `;

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (id) {
      // Update existing draft
      const [email] = await sql`
        UPDATE emails 
        SET 
          recipient_email = ${recipient_email},
          recipient_name = ${recipient_name || recipient_email},
          subject = ${subject},
          body = ${body},
          cc = ${cc || null},
          bcc = ${bcc || null},
          attachments = ${JSON.stringify(attachments)},
          updated_at = NOW()
        WHERE id = ${id} AND sender_id = ${doctorId} AND is_draft = true
        RETURNING *
      `;

      return res.json({ success: true, data: email, message: 'Draft updated' });
    } else {
      // Create new draft
      const [email] = await sql`
        INSERT INTO emails (
          sender_id, sender_email, sender_name,
          recipient_email, recipient_name,
          subject, body, cc, bcc,
          attachments, is_draft, folder
        ) VALUES (
          ${doctorId},
          ${doctor.email},
          ${doctor.first_name + ' ' + doctor.last_name},
          ${recipient_email},
          ${recipient_name || recipient_email},
          ${subject},
          ${body},
          ${cc || null},
          ${bcc || null},
          ${JSON.stringify(attachments)},
          true,
          'drafts'
        )
        RETURNING *
      `;

      return res.json({ success: true, data: email, message: 'Draft saved' });
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ success: false, message: 'Failed to save draft', error: error.message });
  }
};

// Delete email (move to trash or permanent delete)
export const deleteEmail = async (req, res) => {
  try {
    const doctorId = req.user?.id || 1;
    const { id } = req.params;
    const { permanent = false } = req.query;

    const [email] = await sql`
      SELECT * FROM emails 
      WHERE id = ${id} 
      AND (sender_id = ${doctorId} OR recipient_id = ${doctorId})
    `;

    if (!email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    if (permanent === 'true') {
      // Permanent delete
      await sql`DELETE FROM emails WHERE id = ${id}`;
      return res.json({ success: true, message: 'Email permanently deleted' });
    } else {
      // Move to trash
      if (email.sender_id === doctorId) {
        await sql`
          UPDATE emails 
          SET deleted_by_sender = true, folder = 'trash'
          WHERE id = ${id}
        `;
      }
      if (email.recipient_id === doctorId) {
        await sql`
          UPDATE emails 
          SET deleted_by_recipient = true, folder = 'trash'
          WHERE id = ${id}
        `;
      }

      return res.json({ success: true, message: 'Email moved to trash' });
    }
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ success: false, message: 'Failed to delete email', error: error.message });
  }
};

// Empty trash
export const emptyTrash = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Permanently delete emails in trash for this user
    await sql`
      DELETE FROM emails 
      WHERE (sender_id = ${doctorId} AND deleted_by_sender = true) 
         OR (recipient_id = ${doctorId} AND deleted_by_recipient = true)
    `;

    res.json({ success: true, message: 'Trash emptied successfully' });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ success: false, message: 'Failed to empty trash', error: error.message });
  }
};

// Mark as read/unread
export const markAsRead = async (req, res) => {
  try {
    const doctorId = req.user?.id || 1;
    const { id } = req.params;
    const { is_read } = req.body;

    await sql`
      UPDATE emails 
      SET is_read = ${is_read}, read_at = ${is_read ? sql`NOW()` : null}
      WHERE id = ${id} AND recipient_id = ${doctorId}
    `;

    res.json({ success: true, message: `Email marked as ${is_read ? 'read' : 'unread'}` });
  } catch (error) {
    console.error('Error marking email:', error);
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
};

// Star/unstar email
export const toggleStar = async (req, res) => {
  try {
    const doctorId = req.user?.id || 1;
    const { id } = req.params;
    const { is_starred } = req.body;

    await sql`
      UPDATE emails 
      SET is_starred = ${is_starred}
      WHERE id = ${id} AND recipient_id = ${doctorId}
    `;

    res.json({ success: true, message: `Email ${is_starred ? 'starred' : 'unstarred'}` });
  } catch (error) {
    console.error('Error starring email:', error);
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
};

// Get email statistics
export const getStats = async (req, res) => {
  try {
    const doctorId = req.user?.id || 1;

    const stats = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE recipient_id = ${doctorId} AND folder = 'inbox' AND deleted_by_recipient = false) as inbox_count,
        COUNT(*) FILTER (WHERE recipient_id = ${doctorId} AND is_read = false AND deleted_by_recipient = false) as unread_count,
        COUNT(*) FILTER (WHERE sender_id = ${doctorId} AND deleted_by_sender = false AND is_draft = false) as sent_count,
        COUNT(*) FILTER (WHERE sender_id = ${doctorId} AND is_draft = true AND deleted_by_sender = false) as drafts_count,
        COUNT(*) FILTER (WHERE recipient_id = ${doctorId} AND is_starred = true AND deleted_by_recipient = false) as starred_count,
        COUNT(*) FILTER (WHERE (sender_id = ${doctorId} AND deleted_by_sender = true) OR (recipient_id = ${doctorId} AND deleted_by_recipient = true)) as trash_count
      FROM emails
      WHERE sender_id = ${doctorId} OR recipient_id = ${doctorId}
    `;

    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
};

// Get all patients/doctors for email recipients
export const getRecipients = async (req, res) => {
  try {
    const { search = '' } = req.query;

    // Get patients
    const patients = await sql`
      SELECT 
        id, 
        first_name || ' ' || last_name as name,
        email,
        'patient' as type
      FROM patients
      WHERE email IS NOT NULL
      ${search ? sql`AND (first_name || ' ' || last_name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})` : sql``}
      LIMIT 20
    `;

    // Get doctors  
    const doctors = await sql`
      SELECT 
        id,
        first_name || ' ' || last_name as name,
        email,
        'doctor' as type
      FROM doctors
      WHERE email IS NOT NULL
      ${search ? sql`AND (first_name || ' ' || last_name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`})` : sql``}
      LIMIT 20
    `;

    const recipients = [...patients, ...doctors];

    res.json({ success: true, data: recipients });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recipients', error: error.message });
  }
};
