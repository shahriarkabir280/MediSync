import { supabase } from '../config/db.js';

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
    const now = new Date().toISOString();

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('doctor_id', doctorId)
      // Filter out expired notifications
      .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (type) {
      query = query.eq('type', type);
    }

    if (read !== undefined) {
      const isRead = read === 'true';
      query = query.eq('read', isRead);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
    }

    // Sort: Unread first, then by Created At (desc)
    // Note: Custom sorting by priority (high/medium/low) is hard in simpler PostgREST/Supabase calls
    // We'll stick to read status and recency.
    const { data: notifications, error, count } = await query
      .order('read', { ascending: true }) // false (unread) comes first? No, false < true. Yes.
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Filter expired logic is handled in query, but "expired" field in response needs calculation
    // JS calculation for 'expired' field
    const notificationsWithStatus = notifications.map(n => ({
      ...n,
      expired: n.expires_at ? new Date(n.expires_at) < new Date() : false
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    // Get unread count separately
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)
      .eq('read', false);

    res.json({
      success: true,
      data: {
        notifications: notificationsWithStatus,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          total,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        unreadCount: unreadCount || 0
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

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('doctor_id', doctorId)
      .select('id, read, read_at')
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data
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

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: false, read_at: null })
      .eq('id', notificationId)
      .eq('doctor_id', doctorId)
      .select('id, read')
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as unread',
      data
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

    // Update unread notifications
    // Supabase update returns rows, count matches rows
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('doctor_id', doctorId)
      .eq('read', false)
      .select();

    if (error) throw error;

    const updatedCount = data ? data.length : 0;

    res.json({
      success: true,
      message: `${updatedCount} notifications marked as read`,
      data: { updatedCount }
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

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('doctor_id', doctorId)
      .select('id')
      .single();

    if (error) throw error;

    if (!data) {
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

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds)
      .eq('doctor_id', doctorId)
      .select('id');

    if (error) throw error;

    res.json({
      success: true,
      message: `${data.length} notifications deleted successfully`,
      data: { deletedCount: data.length }
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

    // Insert Notification
    const { data: newNotification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        doctor_id: doctorId, type, title, message,
        data: data ? data : null, // JSON handled automatically by library usually
        priority, actionable,
        action_url: actionUrl,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Get doctor's notification settings to determine delivery methods
    const { data: settingsData } = await supabase
      .from('doctor_settings')
      .select('notification_settings')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    let deliveryMethods = [];
    if (settingsData && settingsData.notification_settings) {
      const notificationSettings = settingsData.notification_settings;
      const categorySettings = notificationSettings[type];

      if (categorySettings && categorySettings.enabled) {
        if (categorySettings.email) deliveryMethods.push('email');
        if (categorySettings.push) deliveryMethods.push('push');
        if (categorySettings.sms) deliveryMethods.push('sms');
      }
    }

    // Create delivery logs for enabled methods
    if (deliveryMethods.length > 0) {
      const { data: doctorInfo } = await supabase
        .from('doctors')
        .select('email, phone')
        .eq('id', doctorId)
        .single();

      if (doctorInfo) {
        const logsToInsert = [];

        for (const method of deliveryMethods) {
          let recipient = '';
          if (method === 'email') recipient = doctorInfo.email;
          if (method === 'sms') recipient = doctorInfo.phone || '';
          if (method === 'push') recipient = `doctor_${doctorId}`;

          if (recipient) {
            logsToInsert.push({
              notification_id: newNotification.id,
              delivery_method: method,
              recipient,
              status: 'pending'
            });
          }
        }

        if (logsToInsert.length > 0) {
          await supabase.from('notification_delivery_logs').insert(logsToInsert);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: newNotification
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

    // Instead of complex CASE SQL, we can fetch simplified lists or use built-in counts if low throughput
    // But for stats, it's better to try to be efficient.
    // We can run parallel count queries.

    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: allNotifications, error } = await supabase
      .from('notifications')
      .select('read, priority, type, created_at')
      .eq('doctor_id', doctorId);

    if (error) throw error;

    // Calculate stats in JS
    const stats = {
      total: 0, unread: 0, read: 0,
      high_priority: 0, medium_priority: 0, low_priority: 0,
      appointments: 0, billing: 0, messages: 0, patients: 0, system: 0,
      last_24h: 0, last_7_days: 0
    };

    allNotifications?.forEach(n => {
      stats.total++;
      if (n.read) stats.read++; else stats.unread++;

      if (n.priority === 'high') stats.high_priority++;
      else if (n.priority === 'medium') stats.medium_priority++;
      else if (n.priority === 'low') stats.low_priority++;

      if (n.type === 'appointment') stats.appointments++;
      else if (n.type === 'billing') stats.billing++;
      else if (n.type === 'chat') stats.messages++;
      else if (n.type === 'patients') stats.patients++;
      else if (n.type === 'system') stats.system++;

      if (n.created_at >= oneDayAgo) stats.last_24h++;
      if (n.created_at >= sevenDaysAgo) stats.last_7_days++;
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
};