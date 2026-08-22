# Notification System Documentation

## Overview

The MediSync notification system has been enhanced to provide comprehensive, category-based notification management for doctors. This system supports multiple delivery methods and granular control over notification preferences.

## Features

### 🔔 Category-Based Notifications

The system organizes notifications into logical categories:

1. **Appointments** - New appointments, changes, reminders
2. **Billing & Payments** - Payment alerts, invoice updates
3. **Messages & Chat** - Messages from colleagues and patients
4. **Patient Updates** - New registrations, medical records
5. **System Notifications** - Maintenance, updates, announcements

### 📧 Multiple Delivery Methods

Each category supports three delivery methods:
- **Email** - Traditional email notifications
- **Push** - Browser/app push notifications
- **SMS** - Text message alerts

### ⚙️ Global Controls

- **Global Mute** - Temporarily disable all notifications
- **Frequency Control** - Choose immediate, hourly digest, or daily summary
- **Quiet Hours** - Set time ranges to limit notifications

## API Endpoints

### Authentication Required
All notification endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### GET /api/doctors/settings/notifications
Retrieve current notification settings.

**Response:**
```json
{
  "globalMute": false,
  "appointments": {
    "enabled": true,
    "email": true,
    "push": true,
    "sms": false
  },
  "billing": {
    "enabled": true,
    "email": true,
    "push": true,
    "sms": false
  },
  "chat": {
    "enabled": true,
    "email": false,
    "push": true,
    "sms": false
  },
  "patients": {
    "enabled": true,
    "email": true,
    "push": true,
    "sms": false
  },
  "system": {
    "enabled": true,
    "email": true,
    "push": false,
    "sms": false
  },
  "frequency": "immediate",
  "quietHours": {
    "enabled": false,
    "startTime": "22:00",
    "endTime": "07:00"
  }
}
```

### PUT /api/doctors/settings/notifications
Update notification settings.

**Request Body:**
```json
{
  "globalMute": false,
  "appointments": {
    "enabled": true,
    "email": true,
    "push": true,
    "sms": false
  },
  "frequency": "immediate",
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "07:00"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification settings updated successfully",
  "data": { /* updated settings */ }
}
```

### GET /api/doctors/settings/notification-preferences
Get formatted notification preferences with summary statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": { /* categorized settings */ },
    "globalSettings": { /* global controls */ },
    "summary": {
      "totalEnabled": 15,
      "emailEnabled": 4,
      "pushEnabled": 5,
      "smsEnabled": 0
    }
  }
}
```

### POST /api/doctors/settings/test-notification
Send a test notification to verify delivery methods.

**Request Body:**
```json
{
  "type": "appointments",
  "method": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email notification sent successfully",
  "data": {
    "type": "appointments",
    "method": "email",
    "message": "Test: Appointment reminder for Dr. John Doe",
    "timestamp": "2025-12-07T10:30:00.000Z"
  }
}
```

## Frontend Integration

### SettingsTab Component

The `SettingsTab.jsx` component provides the main interface for managing notification preferences:

```jsx
// Update notification settings
const updateNotificationSettings = async () => {
  const response = await fetch(API_URLS.DOCTORS.NOTIFICATIONS, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(notificationSettings)
  });
};

// Test notification
const testNotification = async (type, method) => {
  const response = await fetch(API_URLS.DOCTORS.TEST_NOTIFICATION, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ type, method })
  });
};
```

### API Configuration

Updated API endpoints in `config/api.js`:

```javascript
DOCTORS: {
  NOTIFICATIONS: buildApiUrl('/api/doctors', '/settings/notifications'),
  NOTIFICATION_PREFERENCES: buildApiUrl('/api/doctors', '/settings/notification-preferences'),
  TEST_NOTIFICATION: buildApiUrl('/api/doctors', '/settings/test-notification')
}
```

## Database Schema

### doctor_settings Table

The notification settings are stored as JSONB in the `notification_settings` column:

```sql
CREATE TABLE doctor_settings (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  notification_settings JSONB,
  billing_settings JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migration Support

The system includes backward compatibility with legacy notification settings:

### Legacy Format Support
The API automatically migrates old notification settings to the new format when encountered.

### Validation
- Required categories are validated on update
- Invalid frequency values default to 'immediate'
- Missing settings are filled with defaults

## Testing

### Manual Testing
Use the provided test script:

```bash
cd backend
node test-notifications.js
```

### API Testing with curl

```bash
# Get current settings
curl -X GET "http://localhost:3001/api/doctors/settings/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update settings
curl -X PUT "http://localhost:3001/api/doctors/settings/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"globalMute":false,"appointments":{"enabled":true,"email":true,"push":true,"sms":false}}'

# Test notification
curl -X POST "http://localhost:3001/api/doctors/settings/test-notification" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"type":"appointments","method":"email"}'
```

## Future Enhancements

- Real notification delivery via email/SMS services
- WebSocket integration for real-time push notifications
- Notification history and analytics
- Template customization for different notification types
- Bulk notification management
- Integration with external notification services (Firebase, Twilio, etc.)

## Security Notes

- All endpoints require JWT authentication
- Notification settings are isolated per doctor
- Input validation prevents malicious data injection
- Rate limiting recommended for test notification endpoint

## Error Handling

The API includes comprehensive error handling:

- **400** - Bad request (validation errors)
- **401** - Unauthorized (invalid/missing token)
- **404** - Doctor not found
- **500** - Internal server error

Error responses follow the format:
```json
{
  "success": false,
  "message": "Error description"
}
```