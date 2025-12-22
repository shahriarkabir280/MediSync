import { sql } from '../config/db.js';
import nodemailer from 'nodemailer';

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
    const doctorId = req.user?.id || 1; // Default to doctor ID 1 for testing
    const { folder = 'inbox', search = '', page = 1, limit = 20, unread_only = false } = req.query;

    const offset = (page - 1) * limit;

    let query = sql`
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
      WHERE (
        (e.sender_id = ${doctorId} AND e.purged_by_sender = false) 
        OR 
        (e.recipient_id = ${doctorId} AND e.purged_by_recipient = false)
      )

    `;

    // Filter by folder
    if (folder === 'inbox') {
      query = sql`${query} AND e.recipient_id = ${doctorId} AND e.deleted_by_recipient = false AND e.folder = 'inbox'`;
    } else if (folder === 'sent') {
      query = sql`${query} AND e.sender_id = ${doctorId} AND e.deleted_by_sender = false AND e.is_draft = false`;
    } else if (folder === 'drafts') {
      query = sql`${query} AND e.sender_id = ${doctorId} AND e.is_draft = true AND e.deleted_by_sender = false`;
    } else if (folder === 'starred') {
      query = sql`${query} AND e.recipient_id = ${doctorId} AND e.is_starred = true AND e.deleted_by_recipient = false`;
    } else if (folder === 'trash') {
      query = sql`${query} AND ((e.sender_id = ${doctorId} AND e.deleted_by_sender = true) OR (e.recipient_id = ${doctorId} AND e.deleted_by_recipient = true))`;
    }

    // Filter by unread
    if (unread_only === 'true') {
      query = sql`${query} AND e.is_read = false`;
    }

    // Search filter
    if (search) {
      query = sql`${query} AND (
        e.subject ILIKE ${`%${search}%`} OR 
        e.body ILIKE ${`%${search}%`} OR 
        e.sender_email ILIKE ${`%${search}%`} OR
        e.recipient_email ILIKE ${`%${search}%`}
      )`;
    }

    query = sql`${query} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const emails = await query;

    // Get total count
    let countQuery = sql`
      SELECT COUNT(*) as total
      FROM emails e
      WHERE (e.sender_id = ${doctorId} OR e.recipient_id = ${doctorId})
    `;

    if (folder === 'inbox') {
      countQuery = sql`${countQuery} AND e.recipient_id = ${doctorId} AND e.deleted_by_recipient = false AND e.folder = 'inbox'`;
    } else if (folder === 'sent') {
      countQuery = sql`${countQuery} AND e.sender_id = ${doctorId} AND e.deleted_by_sender = false AND e.is_draft = false`;
    } else if (folder === 'drafts') {
      countQuery = sql`${countQuery} AND e.sender_id = ${doctorId} AND e.is_draft = true AND e.deleted_by_sender = false`;
    }

    if (search) {
      countQuery = sql`${countQuery} AND (
        e.subject ILIKE ${`%${search}%`} OR 
        e.body ILIKE ${`%${search}%`}
      )`;
    }

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
        }
      }
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch emails', error: error.message });
  }
};

// Get single email
export const getEmail = async (req, res) => {
  try {
    const doctorId = req.user?.id || 1;
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
    const doctorId = req.user?.id || 1;
    const {
      recipient_email,
      recipient_name,
      recipient_id,
      subject,
      body,
      cc,
      bcc,
      reply_to_id
    } = req.body;

    // Handle attachments from Multer
    let attachments = [];
    if (req.files && Array.isArray(req.files)) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`, // Assuming static serve setup
        size: file.size,
        type: file.mimetype
      }));
    } else if (req.body.attachments) {
      // Fallback if sent as JSON (less common with files)
      try {
        attachments = typeof req.body.attachments === 'string'
          ? JSON.parse(req.body.attachments)
          : req.body.attachments;
      } catch (e) {
        attachments = [];
      }
    }

    // Merge existing attachments (from drafts)
    if (req.body.existing_attachments) {
      try {
        const existing = typeof req.body.existing_attachments === 'string'
          ? JSON.parse(req.body.existing_attachments)
          : req.body.existing_attachments;
        if (Array.isArray(existing)) {
          attachments = [...attachments, ...existing];
        }
      } catch (e) {
        console.error('Error parsing existing attachments', e);
      }
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

    // Try to find the recipient in doctors or patients tables if ID is missing
    let finalRecipientId = recipient_id;
    if (!finalRecipientId) {
      // Check doctors
      const [recipientDoctor] = await sql`SELECT id FROM doctors WHERE email = ${recipient_email}`;
      if (recipientDoctor) {
        finalRecipientId = recipientDoctor.id;
      } else {
        // Check patients
        const [recipientPatient] = await sql`SELECT id FROM patients WHERE email = ${recipient_email}`;
        if (recipientPatient) {
          finalRecipientId = recipientPatient.id;
        }
      }
    }

    // Insert into database
    const [email] = await sql`
      INSERT INTO emails (
        sender_id, sender_email, sender_name,
        recipient_id, recipient_email, recipient_name,
        subject, body, cc, bcc,
        reply_to_id, attachments,
        is_draft, folder
      ) VALUES (
        ${doctorId},
        ${doctor.email},
        ${doctor.first_name + ' ' + doctor.last_name},
        ${finalRecipientId || null},
        ${recipient_email},
        ${recipient_name || recipient_email},
        ${subject},
        ${body},
        ${cc || null},
        ${bcc || null},
        ${reply_to_id || null},
        ${JSON.stringify(attachments)},
        false,
        'inbox'
      )
      RETURNING *
    `;

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
            path: att.url
          }))
        });
      } catch (smtpError) {
        console.error('SMTP Error:', smtpError);
        // Email saved in database but SMTP failed
      }
    }

    res.json({ success: true, data: email, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
};

// Save draft
export const saveDraft = async (req, res) => {
  try {
    const doctorId = req.user?.id || 1;
    const {
      id,
      recipient_email,
      recipient_name,
      subject,
      body,
      cc,
      bcc
    } = req.body;

    // Handle attachments
    let attachments = [];
    if (req.files && Array.isArray(req.files)) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        size: file.size,
        type: file.mimetype
      }));
    } else if (req.body.attachments) {
      try {
        attachments = typeof req.body.attachments === 'string'
          ? JSON.parse(req.body.attachments)
          : req.body.attachments;
      } catch (e) {
        attachments = [];
      }
    }

    // Merge existing attachments
    if (req.body.existing_attachments) {
      try {
        const existing = typeof req.body.existing_attachments === 'string'
          ? JSON.parse(req.body.existing_attachments)
          : req.body.existing_attachments;
        if (Array.isArray(existing)) {
          attachments = [...attachments, ...existing];
        }
      } catch (e) {
        console.error('Error parsing existing attachments', e);
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

    // Try to find the recipient in doctors or patients tables
    let finalRecipientId = null;
    if (recipient_email) {
      // Check doctors
      const [recipientDoctor] = await sql`SELECT id FROM doctors WHERE email = ${recipient_email}`;
      if (recipientDoctor) {
        finalRecipientId = recipientDoctor.id;
      } else {
        // Check patients
        const [recipientPatient] = await sql`SELECT id FROM patients WHERE email = ${recipient_email}`;
        if (recipientPatient) {
          finalRecipientId = recipientPatient.id;
        }
      }
    }

    if (id) {
      // Update existing draft
      const [email] = await sql`
        UPDATE emails 
        SET 
          recipient_email = ${recipient_email},
          recipient_name = ${recipient_name || recipient_email},
          recipient_id = ${finalRecipientId || null},
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
          recipient_email, recipient_name, recipient_id,
          subject, body, cc, bcc,
          attachments, is_draft, folder
        ) VALUES (
          ${doctorId},
          ${doctor.email},
          ${doctor.first_name + ' ' + doctor.last_name},
          ${recipient_email},
          ${recipient_name || recipient_email},
          ${finalRecipientId || null},
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
          SET deleted_by_sender = true
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

// Empty trash
export const emptyTrash = async (req, res) => {
  try {
    const doctorId = req.user?.id || 1;

    // "Empty Trash" means hiding items currently in trash from my view
    // Items are in trash if deleted_by_X is true. 
    // We want to set purged_by_X = true for those items.

    // Update sender's trash
    await sql`
      UPDATE emails 
      SET purged_by_sender = true
      WHERE sender_id = ${doctorId} AND deleted_by_sender = true
    `;

    // Update recipient's trash
    await sql`
      UPDATE emails 
      SET purged_by_recipient = true
      WHERE recipient_id = ${doctorId} AND deleted_by_recipient = true
    `;

    // Also permanently delete drafts
    await sql`DELETE FROM emails WHERE sender_id = ${doctorId} AND is_draft = true AND folder = 'drafts'`;

    // Cleanup: If both purged, we can actually DELETE the row to save space (optional, but good practice)
    await sql`
      DELETE FROM emails
      WHERE 
        purged_by_sender = true AND purged_by_recipient = true
    `;

    res.json({ success: true, message: 'Trash emptied' });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ success: false, message: 'Failed to empty trash', error: error.message });
  }
};
