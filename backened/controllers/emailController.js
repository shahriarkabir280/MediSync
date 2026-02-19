import { supabase } from '../config/db.js';
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
    const doctorId = req.user?.id;
    const { folder = 'inbox', search = '', page = 1, limit = 20, unread_only = false } = req.query;

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('emails')
      .select('*', { count: 'exact' });

    // Filter by folder
    if (folder === 'inbox') {
      query = query
        .eq('recipient_id', doctorId)
        .eq('deleted_by_recipient', false)
        .eq('folder', 'inbox');
    } else if (folder === 'sent') {
      query = query
        .eq('sender_id', doctorId)
        .eq('deleted_by_sender', false)
        .eq('is_draft', false);
    } else if (folder === 'drafts') {
      query = query
        .eq('sender_id', doctorId)
        .eq('is_draft', true)
        .eq('deleted_by_sender', false);
    } else if (folder === 'starred') {
      query = query
        .eq('recipient_id', doctorId)
        .eq('is_starred', true)
        .eq('deleted_by_recipient', false);
    } else if (folder === 'trash') {
      // (sender_id = ID AND deleted_by_sender = true AND purged_by_sender = false) OR (recipient_id = ID AND deleted_by_recipient = true AND purged_by_recipient = false)
      query = query.or(`and(sender_id.eq.${doctorId},deleted_by_sender.eq.true,purged_by_sender.eq.false),and(recipient_id.eq.${doctorId},deleted_by_recipient.eq.true,purged_by_recipient.eq.false)`);
    } else if (folder === 'archived') {
      query = query.eq('folder', 'archived').or(`sender_id.eq.${doctorId},recipient_id.eq.${doctorId}`).eq('purged_by_sender', false).eq('purged_by_recipient', false);
    } else if (folder === 'spam') {
      query = query.eq('folder', 'spam').or(`sender_id.eq.${doctorId},recipient_id.eq.${doctorId}`).eq('purged_by_sender', false).eq('purged_by_recipient', false);
    } else {
      // For all other folders, ensure we hide purged items 
      // This is a safety measure as purged items should only be in trash logic anyway
      query = query.or(`and(sender_id.eq.${doctorId},purged_by_sender.eq.false),and(recipient_id.eq.${doctorId},purged_by_recipient.eq.false)`);
    }

    // Filter by unread
    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    // Search filter
    if (search) {
      query = query.or(`subject.ilike.%${search}%,body.ilike.%${search}%,sender_email.ilike.%${search}%,recipient_email.ilike.%${search}%`);
    }

    const { data: emails, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Process display names
    const processedEmails = emails.map(email => ({
      ...email,
      display_email: email.sender_id === doctorId ? email.recipient_email : email.sender_email,
      display_name: email.sender_id === doctorId ? email.recipient_name : email.sender_name
    }));

    res.json({
      success: true,
      data: {
        emails: processedEmails,
        pagination: {
          total: count || 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((count || 0) / parseInt(limit))
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
    const doctorId = req.user?.id;
    const { id } = req.params;

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: email, error } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .or(`sender_id.eq.${doctorId},recipient_id.eq.${doctorId}`)
      .single();

    if (error || !email) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    // Mark as read if recipient is viewing
    if (email.recipient_id === doctorId && !email.is_read) {
      await supabase
        .from('emails')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
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
    const {
      id,
      recipient_email,
      recipient_name,
      recipient_id,
      subject,
      body,
      cc,
      bcc,
      reply_to_id
    } = req.body;

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

    if (!recipient_email || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email and subject are required'
      });
    }

    // Get sender info
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id, email, first_name, last_name')
      .eq('id', doctorId)
      .single();

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Resolve recipient ID
    let finalRecipientId = recipient_id;
    if (!finalRecipientId) {
      const { data: recipientDoctor } = await supabase.from('doctors').select('id').eq('email', recipient_email).maybeSingle();
      if (recipientDoctor) {
        finalRecipientId = recipientDoctor.id;
      } else {
        const { data: recipientPatient } = await supabase.from('patients').select('id').eq('email', recipient_email).maybeSingle();
        if (recipientPatient) {
          finalRecipientId = recipientPatient.id;
        }
      }
    }

    // Insert into database
    const { data: email, error } = await supabase
      .from('emails')
      .insert({
        sender_id: doctorId,
        sender_email: doctor.email,
        sender_name: `${doctor.first_name} ${doctor.last_name}`,
        recipient_id: finalRecipientId || null,
        recipient_email,
        recipient_name: recipient_name || recipient_email,
        subject,
        body,
        cc: cc || null,
        bcc: bcc || null,
        reply_to_id: reply_to_id || null,
        attachments,
        is_draft: false,
        folder: 'inbox'
      })
      .select()
      .single();

    if (error) throw error;

    // If this was a draft, delete the draft record
    if (id) {
      await supabase
        .from('emails')
        .delete()
        .eq('id', id)
        .eq('sender_id', doctorId);
    }

    // Send via SMTP
    if (process.env.SMTP_ENABLED === 'true') {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: `"${doctor.first_name} ${doctor.last_name}" <${doctor.email}>`,
          to: recipient_email,
          cc,
          bcc,
          subject,
          html: body,
          attachments: attachments.map(att => ({
            filename: att.name,
            path: att.url
          }))
        });
      } catch (smtpError) {
        console.error('SMTP Error:', smtpError);
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
    const doctorId = req.user?.id;
    const {
      id,
      recipient_email,
      recipient_name,
      subject,
      body,
      cc,
      bcc
    } = req.body;

    if (!doctorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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
        attachments = typeof req.body.attachments === 'string' ? JSON.parse(req.body.attachments) : req.body.attachments;
      } catch (e) {
        attachments = [];
      }
    }

    if (req.body.existing_attachments) {
      try {
        const existing = typeof req.body.existing_attachments === 'string' ? JSON.parse(req.body.existing_attachments) : req.body.existing_attachments;
        if (Array.isArray(existing)) attachments = [...attachments, ...existing];
      } catch (e) {
        console.error('Error parsing existing attachments', e);
      }
    }

    const { data: doctor } = await supabase.from('doctors').select('id, email, first_name, last_name').eq('id', doctorId).single();
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    let finalRecipientId = null;
    if (recipient_email) {
      const { data: recipientDoctor } = await supabase.from('doctors').select('id').eq('email', recipient_email).maybeSingle();
      if (recipientDoctor) finalRecipientId = recipientDoctor.id;
      else {
        const { data: recipientPatient } = await supabase.from('patients').select('id').eq('email', recipient_email).maybeSingle();
        if (recipientPatient) finalRecipientId = recipientPatient.id;
      }
    }

    if (id) {
      const { data: email, error } = await supabase.from('emails').update({
        recipient_email,
        recipient_name: recipient_name || recipient_email,
        recipient_id: finalRecipientId || null,
        subject,
        body,
        cc: cc || null,
        bcc: bcc || null,
        attachments,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('sender_id', doctorId).eq('is_draft', true).select().single();
      if (error) throw error;
      return res.json({ success: true, data: email, message: 'Draft updated' });
    } else {
      const { data: email, error } = await supabase.from('emails').insert({
        sender_id: doctorId,
        sender_email: doctor.email,
        sender_name: `${doctor.first_name} ${doctor.last_name}`,
        recipient_email,
        recipient_name: recipient_name || recipient_email,
        recipient_id: finalRecipientId || null,
        subject,
        body,
        cc: cc || null,
        bcc: bcc || null,
        attachments,
        is_draft: true,
        folder: 'drafts'
      }).select().single();
      if (error) throw error;
      return res.json({ success: true, data: email, message: 'Draft saved' });
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ success: false, message: 'Failed to save draft', error: error.message });
  }
};

// Delete email
export const deleteEmail = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });

    const { data: email, error } = await supabase.from('emails').select('*').eq('id', id).or(`sender_id.eq.${doctorId},recipient_id.eq.${doctorId}`).single();
    if (error || !email) return res.status(404).json({ success: false, message: 'Email not found' });

    if (permanent === 'true') {
      await supabase.from('emails').delete().eq('id', id);
      return res.json({ success: true, message: 'Email permanently deleted' });
    } else {
      if (email.sender_id === doctorId) await supabase.from('emails').update({ deleted_by_sender: true }).eq('id', id);
      if (email.recipient_id === doctorId) await supabase.from('emails').update({ deleted_by_recipient: true, folder: 'trash' }).eq('id', id);
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
    const doctorId = req.user?.id;
    const { id } = req.params;
    const { is_read } = req.body;
    if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });

    const { error } = await supabase.from('emails').update({ is_read, read_at: is_read ? new Date().toISOString() : null }).eq('id', id).eq('recipient_id', doctorId);
    if (error) throw error;
    res.json({ success: true, message: `Email marked as ${is_read ? 'read' : 'unread'}` });
  } catch (error) {
    console.error('Error marking email:', error);
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
};

// Star/unstar
export const toggleStar = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const { id } = req.params;
    const { is_starred } = req.body;
    if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });

    const { error } = await supabase.from('emails').update({ is_starred }).eq('id', id).eq('recipient_id', doctorId);
    if (error) throw error;
    res.json({ success: true, message: `Email ${is_starred ? 'starred' : 'unstarred'}` });
  } catch (error) {
    console.error('Error starring email:', error);
    res.status(500).json({ success: false, message: 'Failed to update email', error: error.message });
  }
};

// Get stats
export const getStats = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });

    const [
      { count: inboxCount },
      { count: unreadCount },
      { count: sentCount },
      { count: draftsCount },
      { count: starredCount },
      { count: trashCount },
      { count: archivedCount },
      { count: spamCount }
    ] = await Promise.all([
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('recipient_id', doctorId).eq('folder', 'inbox').eq('deleted_by_recipient', false).eq('purged_by_recipient', false),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('recipient_id', doctorId).eq('is_read', false).eq('deleted_by_recipient', false).eq('purged_by_recipient', false),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('sender_id', doctorId).eq('deleted_by_sender', false).eq('is_draft', false).eq('purged_by_sender', false),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('sender_id', doctorId).eq('is_draft', true).eq('deleted_by_sender', false).eq('purged_by_sender', false),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('recipient_id', doctorId).eq('is_starred', true).eq('deleted_by_recipient', false).eq('purged_by_recipient', false),
      supabase.from('emails').select('*', { count: 'exact', head: true }).or(`and(sender_id.eq.${doctorId},deleted_by_sender.eq.true,purged_by_sender.eq.false),and(recipient_id.eq.${doctorId},deleted_by_recipient.eq.true,purged_by_recipient.eq.false)`),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('folder', 'archived').eq('purged_by_sender', false).eq('purged_by_recipient', false).or(`sender_id.eq.${doctorId},recipient_id.eq.${doctorId}`),
      supabase.from('emails').select('*', { count: 'exact', head: true }).eq('folder', 'spam').eq('purged_by_sender', false).eq('purged_by_recipient', false).or(`sender_id.eq.${doctorId},recipient_id.eq.${doctorId}`),
    ]);

    res.json({
      success: true, data: {
        inbox_count: inboxCount || 0,
        unread_count: unreadCount || 0,
        sent_count: sentCount || 0,
        drafts_count: draftsCount || 0,
        starred_count: starredCount || 0,
        trash_count: trashCount || 0,
        archived_count: archivedCount || 0,
        spam_count: spamCount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
};

// Get recipients
export const getRecipients = async (req, res) => {
  try {
    const { search = '' } = req.query;
    let patientQuery = supabase.from('patients').select('id, first_name, last_name, email').not('email', 'is', null).limit(20);
    let doctorQuery = supabase.from('doctors').select('id, first_name, last_name, email').not('email', 'is', null).limit(20);

    if (search) {
      patientQuery = patientQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      doctorQuery = doctorQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const [{ data: patients }, { data: doctors }] = await Promise.all([patientQuery, doctorQuery]);

    const recipients = [
      ...(patients || []).map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, email: p.email, type: 'patient' })),
      ...(doctors || []).map(d => ({ id: d.id, name: `${d.first_name} ${d.last_name}`, email: d.email, type: 'doctor' }))
    ];

    res.json({ success: true, data: recipients });
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recipients', error: error.message });
  }
};

// Empty trash
export const emptyTrash = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });

    const [{ error: senderError }, { error: recipientError }, { error: draftsError }] = await Promise.all([
      supabase.from('emails').update({ purged_by_sender: true }).eq('sender_id', doctorId).eq('deleted_by_sender', true),
      supabase.from('emails').update({ purged_by_recipient: true }).eq('recipient_id', doctorId).eq('deleted_by_recipient', true),
      supabase.from('emails').delete().eq('sender_id', doctorId).eq('is_draft', true).eq('folder', 'drafts')
    ]);

    if (senderError || recipientError || draftsError) {
      console.error('Errors in emptyTrash:', { senderError, recipientError, draftsError });
    }

    await supabase.from('emails').delete().eq('purged_by_sender', true).eq('purged_by_recipient', true);
    res.json({ success: true, message: 'Trash emptied' });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ success: false, message: 'Failed to empty trash', error: error.message });
  }
};

// Move email to folder
export const moveToFolder = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const { id } = req.params;
    const { folder } = req.body;

    if (!doctorId) return res.status(401).json({ error: 'Unauthorized' });
    if (!folder) return res.status(400).json({ error: 'Folder is required' });

    // Verify ownership
    const { data: email, error: fetchError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', id)
      .or(`sender_id.eq.${doctorId},recipient_id.eq.${doctorId}`)
      .single();

    if (fetchError || !email) return res.status(404).json({ success: false, message: 'Email not found' });

    const updateData = { folder };

    // If moving to inbox/archived/spam, ensure deleted flags are false
    if (['inbox', 'archived', 'spam'].includes(folder)) {
      if (email.sender_id === doctorId) updateData.deleted_by_sender = false;
      if (email.recipient_id === doctorId) updateData.deleted_by_recipient = false;
    }

    const { error: updateError } = await supabase
      .from('emails')
      .update(updateData)
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ success: true, message: `Email moved to ${folder}` });
  } catch (error) {
    console.error('Error moving email:', error);
    res.status(500).json({ success: false, message: 'Failed to move email', error: error.message });
  }
};


