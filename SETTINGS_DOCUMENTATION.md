# Settings Tab Documentation

## Overview

The Settings Tab has been completely redesigned to provide comprehensive settings management for doctors in the MediSync platform. It includes four main sections:

1. **Notifications** - Manage all notification preferences
2. **Account Security** - Password management, 2FA, and account deletion
3. **Billing & Payment** - Payment methods, billing information, and auto-pay settings
4. **Preferences** - General application preferences like language, timezone, and theme

## Features Implemented

### 🔔 Notifications Tab

**Settings Available:**
- Email Notifications (general email alerts)
- Appointment Reminders (upcoming appointment notifications)
- New Patient Alerts (notifications when new patients register)
- Billing Alerts (payment and invoice notifications)
- SMS Notifications (text message alerts)
- Marketing Emails (promotional content)
- Push Notifications (browser/app push notifications)
- Weekly Reports (summary reports)

**API Endpoints:**
- `GET /api/doctors/settings/notifications` - Retrieve notification settings
- `PUT /api/doctors/settings/notifications` - Update notification settings

### 🔒 Account Security Tab

**Features:**
1. **Password Management**
   - Change current password
   - Strong password validation (minimum 8 characters)
   - Current password verification required

2. **Two-Factor Authentication (2FA)**
   - Enable/disable 2FA
   - Backup codes generation (10 codes)
   - Visual status indicator

3. **Session Management**
   - Configurable session timeout (15 minutes to 8 hours)
   - Automatic logout based on inactivity

4. **Account Deletion**
   - Secure account deletion with confirmation
   - Requires typing "DELETE" to confirm
   - Permanently removes all associated data

**API Endpoints:**
- `PUT /api/auth/change-password` - Change user password
- `POST /api/auth/enable-2fa` - Enable two-factor authentication
- `DELETE /api/auth/disable-2fa` - Disable two-factor authentication
- `DELETE /api/doctors/delete-account` - Delete doctor account

### 💳 Billing & Payment Tab

**Features:**
1. **Billing Information**
   - Invoice email address
   - Tax ID configuration
   - Billing address management

2. **Payment Methods**
   - Add/remove payment methods
   - Set default payment method
   - View payment method details (masked card numbers)

3. **Auto-pay Settings**
   - Enable/disable automatic invoice payment
   - Uses default payment method

**API Endpoints:**
- `GET /api/billing/settings` - Get billing settings
- `PUT /api/billing/settings` - Update billing settings
- `GET /api/billing/payment-methods` - Get payment methods
- `POST /api/billing/payment-methods` - Add payment method
- `DELETE /api/billing/payment-methods/:methodId` - Remove payment method

### ⚙️ Preferences Tab

**Features:**
- Language selection (English, Spanish, French, German)
- Timezone configuration
- Dark mode toggle
- Theme settings

## Database Schema Changes

### Doctors Table Updates
```sql
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS backup_codes JSONB;
```

### Doctor Settings Table Updates
```sql
ALTER TABLE doctor_settings ADD COLUMN IF NOT EXISTS notification_settings JSONB;
ALTER TABLE doctor_settings ADD COLUMN IF NOT EXISTS billing_settings JSONB;
ALTER TABLE doctor_settings ADD COLUMN IF NOT EXISTS payment_methods JSONB;
```

## Security Features

### Authentication Middleware
- JWT token verification on all protected routes
- Automatic token refresh handling
- Secure session management

### Password Security
- Bcrypt hashing for password storage
- Password strength validation
- Current password verification for changes

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF token implementation (recommended for production)

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Frontend Components

### State Management
- React hooks for state management
- Separate state objects for each settings category
- Optimistic updates with error handling
- Loading states for all async operations

### UI Components
- Tab navigation for different settings sections
- Toggle switches for boolean settings
- Form validation with real-time feedback
- Success/error message display
- Confirmation modals for destructive actions

### Form Validation
- Real-time password strength checking
- Email format validation
- Required field validation
- Confirmation matching for password changes

## Usage Examples

### Updating Notification Settings
```javascript
const updateNotifications = async () => {
  const response = await fetch('/api/doctors/settings/notifications', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      emailNotifications: true,
      appointmentReminders: true,
      smsNotifications: false
    })
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('Settings updated successfully');
  }
};
```

### Enabling 2FA
```javascript
const enable2FA = async () => {
  const response = await fetch('/api/auth/enable-2fa', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  if (result.success) {
    console.log('2FA enabled. Backup codes:', result.backupCodes);
  }
};
```

## Installation & Setup

1. **Database Migration**
   ```bash
   cd backend
   node updateSettingsSchema.js
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm start
   ```

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

## Testing

### Manual Testing Checklist
- [ ] Navigate to Settings tab
- [ ] Test notification toggle switches
- [ ] Change password with various scenarios
- [ ] Enable/disable 2FA
- [ ] Update billing information
- [ ] Add/remove payment methods
- [ ] Test account deletion flow
- [ ] Verify persistence of settings after logout/login

### API Testing
Use tools like Postman or curl to test API endpoints:
```bash
# Test notification settings
curl -X GET "http://localhost:3001/api/doctors/settings/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test password change
curl -X PUT "http://localhost:3001/api/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"currentPassword":"old123","newPassword":"newPassword123"}'
```

## Production Considerations

### Security
- Use HTTPS in production
- Implement rate limiting for authentication endpoints
- Add CSRF protection
- Use environment variables for secrets
- Implement audit logging for security events

### Performance
- Add caching for settings data
- Implement database connection pooling
- Use CDN for static assets
- Optimize API response sizes

### Monitoring
- Log all authentication attempts
- Monitor 2FA usage
- Track setting changes
- Alert on multiple failed login attempts

## Troubleshooting

### Common Issues
1. **Settings not saving**: Check authentication token validity
2. **2FA codes not generating**: Ensure database supports JSONB data type
3. **Password change failing**: Verify current password is correct
4. **UI not updating**: Check for JavaScript errors in browser console

### Debug Mode
Enable debug mode by setting environment variable:
```bash
DEBUG=medisync:* npm start
```

## Future Enhancements

### Planned Features
- Email verification for setting changes
- Advanced 2FA with TOTP (Google Authenticator)
- Audit log for all setting changes
- Backup and restore settings
- Team management for clinic accounts
- Advanced billing integrations (Stripe, PayPal)
- Mobile app push notifications
- Custom notification schedules
- Setting templates and presets

### Integration Opportunities
- Calendar integration for appointment notifications
- SMS gateway integration (Twilio)
- Email service provider integration (SendGrid)
- Payment processor integration (Stripe, Square)
- Analytics tracking for setting usage

## Support

For technical support or questions about the settings functionality:
1. Check the API documentation
2. Review error logs in browser console
3. Verify database schema is up to date
4. Test with fresh browser session
5. Check authentication token validity

---

**Last Updated**: December 7, 2025
**Version**: 1.0.0