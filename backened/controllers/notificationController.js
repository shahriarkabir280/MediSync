import { sql } from '../config/db.js';

// Get notifications for a doctor
export const getNotifications = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      read, 
      priority, 
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build dynamic where clause
    let whereClause = sql`WHERE doctor_id = ${doctorId}`;
    
    if (type) {
      whereClause = sql`${whereClause} AND type = ${type}`;
    }
    
    if (read !== undefined) {
      const isRead = read === 'true';
      whereClause = sql`${whereClause} AND read = ${isRead}`;
    }
    
    if (priority) {
      whereClause = sql`${whereClause} AND priority = ${priority}`;
    }
    
    if (search) {
      whereClause = sql`${whereClause} AND (title ILIKE ${'%' + search + '%'} OR message ILIKE ${'%' + search + '%'})`;
    }

    // Note: We'll filter expired notifications in the query instead of updating them

    // Get notifications with pagination (filtering out expired ones)
    const notifications = await sql`
      SELECT 
        id, type, title, message, data, read, priority, 
        actionable, action_url, expires_at, created_at, read_at,
        CASE WHEN expires_at IS NOT NULL AND expires_at < NOW() THEN true ELSE false END as expired
      FROM notifications 
      ${whereClause}
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY 
        CASE WHEN read = false THEN 0 ELSE 1 END,
        CASE priority 
          WHEN 'high' THEN 0 
          WHEN 'medium' THEN 1 
          WHEN 'low' THEN 2 
        END,
        created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination (excluding expired)
    const countResult = await sql`
      SELECT COUNT(*) as total 
      FROM notifications 
      ${whereClause}
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    // Get unread count
    const unreadResult = await sql`
      SELECT COUNT(*) as unread 
      FROM notifications 
      WHERE doctor_id = ${doctorId} AND read = false
    `;

    const unreadCount = parseInt(unreadResult[0].unread);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { notificationId } = req.params;

    const result = await sql`
      UPDATE notifications 
      SET read = true, read_at = NOW()
      WHERE id = ${notificationId} AND doctor_id = ${doctorId}
      RETURNING id, read, read_at
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result[0]
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
};

// Mark notification as unread
export const markAsUnread = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { notificationId } = req.params;

    const result = await sql`
      UPDATE notifications 
      SET read = false, read_at = NULL
      WHERE id = ${notificationId} AND doctor_id = ${doctorId}
      RETURNING id, read
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as unread',
      data: result[0]
    });

  } catch (error) {
    console.error('Error marking notification as unread:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as unread' 
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const result = await sql`
      UPDATE notifications 
      SET read = true, read_at = NOW()
      WHERE doctor_id = ${doctorId} AND read = false
      RETURNING count(*)
    `;

    const updatedCount = await sql`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE doctor_id = ${doctorId} AND read = true AND read_at > NOW() - INTERVAL '1 second'
    `;

    res.json({
      success: true,
      message: `${updatedCount[0].count} notifications marked as read`,
      data: { updatedCount: parseInt(updatedCount[0].count) }
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { notificationId } = req.params;

    const result = await sql`
      DELETE FROM notifications 
      WHERE id = ${notificationId} AND doctor_id = ${doctorId}
      RETURNING id
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
};

// Delete selected notifications
export const deleteMultiple = async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification IDs provided'
      });
    }

    const result = await sql`
      DELETE FROM notifications 
      WHERE id = ANY(${notificationIds}) AND doctor_id = ${doctorId}
      RETURNING id
    `;

    res.json({
      success: true,
      message: `${result.length} notifications deleted successfully`,
      data: { deletedCount: result.length }
    });

  } catch (error) {
    console.error('Error deleting multiple notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notifications' 
    });
  }
};

// Create notification (for system use)
export const createNotification = async (req, res) => {
  try {
    const {
      doctorId,
      type,
      title,
      message,
      data = null,
      priority = 'medium',
      actionable = false,
      actionUrl = null,
      expiresAt = null
    } = req.body;

    // Validate required fields
    if (!doctorId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorId, type, title, message'
      });
    }

    // Validate type
    const validTypes = ['appointment', 'billing', 'chat', 'patients', 'system', 'lab'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification type'
      });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level'
      });
    }

    const result = await sql`
      INSERT INTO notifications (
        doctor_id, type, title, message, data, priority, 
        actionable, action_url, expires_at
      )
      VALUES (
        ${doctorId}, ${type}, ${title}, ${message}, ${JSON.stringify(data)}, 
        ${priority}, ${actionable}, ${actionUrl}, ${expiresAt}
      )
      RETURNING *
    `;

    // Get doctor's notification settings to determine delivery methods
    const settings = await sql`
      SELECT notification_settings FROM doctor_settings 
      WHERE doctor_id = ${doctorId}
    `;

    let deliveryMethods = [];
    if (settings.length > 0 && settings[0].notification_settings) {
      const notificationSettings = settings[0].notification_settings;
      const categorySettings = notificationSettings[type];
      
      if (categorySettings && categorySettings.enabled) {
        if (categorySettings.email) deliveryMethods.push('email');
        if (categorySettings.push) deliveryMethods.push('push');
        if (categorySettings.sms) deliveryMethods.push('sms');
      }
    }

    // Create delivery logs for enabled methods
    if (deliveryMethods.length > 0) {
      const doctorInfo = await sql`
        SELECT email, phone FROM doctors WHERE id = ${doctorId}
      `;

      if (doctorInfo.length > 0) {
        const doctor = doctorInfo[0];
        
        for (const method of deliveryMethods) {
          let recipient = '';
          if (method === 'email') recipient = doctor.email;
          if (method === 'sms') recipient = doctor.phone || '';
          if (method === 'push') recipient = `doctor_${doctorId}`;

          if (recipient) {
            await sql`
              INSERT INTO notification_delivery_logs (
                notification_id, delivery_method, recipient, status
              )
              VALUES (${result[0].id}, ${method}, ${recipient}, 'pending')
            `;
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: result[0]
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification' 
    });
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read = false THEN 1 END) as unread,
        COUNT(CASE WHEN read = true THEN 1 END) as read,
        COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority = 'medium' THEN 1 END) as medium_priority,
        COUNT(CASE WHEN priority = 'low' THEN 1 END) as low_priority,
        COUNT(CASE WHEN type = 'appointment' THEN 1 END) as appointments,
        COUNT(CASE WHEN type = 'billing' THEN 1 END) as billing,
        COUNT(CASE WHEN type = 'chat' THEN 1 END) as messages,
        COUNT(CASE WHEN type = 'patients' THEN 1 END) as patients,
        COUNT(CASE WHEN type = 'system' THEN 1 END) as system,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days
      FROM notifications 
      WHERE doctor_id = ${doctorId}
    `;

    res.json({
      success: true,
      data: stats[0]
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification statistics' 
    });
  }
};