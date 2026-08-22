# Email System Documentation

## Overview
The MediSync email system provides a complete, modern email solution for healthcare providers to communicate with patients, staff, and other healthcare professionals. The system features a Gmail/Outlook-style interface with full functionality including compose, inbox management, drafts, and more.

## Architecture

### Backend Components

#### Database Schema
The email system uses a PostgreSQL table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS emails (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES doctors(id),
  sender_name VARCHAR(255),
  sender_email VARCHAR(255) NOT NULL,
  recipient_id INTEGER REFERENCES doctors(id),
  recipient_name VARCHAR(255),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  cc VARCHAR(500),
  bcc VARCHAR(500),
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  folder VARCHAR(50) DEFAULT 'inbox',
  reply_to_id INTEGER REFERENCES emails(id),
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_recipient BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Key Features:**
- **Soft Delete**: Separate flags for sender and recipient deletions
- **Flexible Addressing**: Supports internal users (via ID) and external users (via email)
- **Rich Metadata**: Attachments stored as JSONB, support for CC/BCC
- **Organization**: Folder system (inbox, sent, drafts, starred, trash)
- **Threading**: Reply tracking via reply_to_id

#### API Endpoints

**Base URL**: `/api/email`

1. **Get Email Statistics**
   - `GET /api/email/stats`
   - Returns: `{ inbox, sent, drafts, starred, trash, unread }`

2. **Get Email List**
   - `GET /api/email?folder=inbox&search=query&limit=50&offset=0`
   - Query Parameters:
     - `folder`: inbox, sent, drafts, starred, trash
     - `search`: Search in subject, body, sender name
     - `limit`: Results per page (default: 50)
     - `offset`: Pagination offset (default: 0)

3. **Get Single Email**
   - `GET /api/email/:id`
   - Returns: Full email details

4. **Send Email**
   - `POST /api/email/send`
   - Body:
     ```json
     {
       "recipient_email": "patient@example.com",
       "subject": "Appointment Confirmation",
       "body": "Your appointment is confirmed...",
       "cc": "optional@example.com",
       "bcc": "optional@example.com",
       "attachments": ["file1.pdf", "file2.jpg"],
       "use_smtp": false
     }
     ```

5. **Save Draft**
   - `POST /api/email/draft`
   - Body: Same as send email

6. **Delete Email**
   - `DELETE /api/email/:id?permanent=false`
   - Query Parameters:
     - `permanent`: If true, permanently deletes. If false, moves to trash.

7. **Mark as Read/Unread**
   - `PUT /api/email/:id/read`
   - Body: `{ "is_read": true }`

8. **Star/Unstar Email**
   - `PUT /api/email/:id/star`
   - Body: `{ "is_starred": true }`

9. **Get Recipients List**
   - `GET /api/email/recipients?search=john`
   - Returns: List of doctors/users for autocomplete

### Frontend Components

#### EmailTab Component
**Location**: `frontend/src/pages/DoctorDashboardTabs/EmailTab.jsx`

**Key Features:**
- Three-column layout (folders, email list, content viewer)
- Real-time email statistics
- Search functionality
- Compose email with CC/BCC support
- Reply functionality
- Star/unstar emails
- Mark as read/unread
- Delete emails (soft delete)
- Draft saving
- Responsive design

**State Management:**
```javascript
const [emails, setEmails] = useState([]);
const [selectedFolder, setSelectedFolder] = useState('inbox');
const [selectedEmail, setSelectedEmail] = useState(null);
const [searchQuery, setSearchQuery] = useState('');
const [isComposing, setIsComposing] = useState(false);
const [stats, setStats] = useState(null);
```

#### Email API Client
**Location**: `frontend/src/lib/emailApi.js`

Provides convenient methods for all email operations:
```javascript
emailApi.getEmails({ folder: 'inbox', search: 'query' })
emailApi.getEmail(id)
emailApi.sendEmail(emailData)
emailApi.saveDraft(draftData)
emailApi.deleteEmail(id, permanent)
emailApi.markAsRead(id, isRead)
emailApi.toggleStar(id, isStarred)
emailApi.getStats()
emailApi.getRecipients(search)
```

## Features

### 1. Inbox Management
- View all received emails
- Unread count badge
- Visual indicators for unread emails (blue background)
- Auto-mark as read when opened

### 2. Email Composition
- Clean, modern compose interface
- To, CC, BCC fields
- Subject and body text areas
- Draft saving capability
- Send button with loading state
- Cancel/close functionality

### 3. Email Reading
- Full email details display
- Sender information with avatar
- Timestamp with formatted date
- Subject line
- Full body content
- CC/BCC recipient display
- Attachment list (if any)
- Reply button

### 4. Email Organization
- **Inbox**: Received emails
- **Starred**: Important emails
- **Sent**: Sent emails
- **Drafts**: Unsent emails
- **Trash**: Deleted emails

### 5. Email Actions
- **Star/Unstar**: Mark emails as important
- **Delete**: Move to trash (soft delete)
- **Reply**: Quick reply with quoted original
- **Mark Read**: Toggle read status

### 6. Search & Filter
- Real-time search across:
  - Subject line
  - Sender name
  - Sender email
  - Email body
- Search highlight in UI

### 7. Email Statistics
- Real-time counts for each folder
- Unread email tracking
- Updates after actions

## User Experience

### Modern Design
- Clean, professional interface inspired by Gmail/Outlook
- Three-column layout for efficiency
- Color-coded status indicators
- Hover effects and smooth transitions
- Responsive layout

### Performance Optimizations
- Lazy loading of email content
- Efficient state management with React hooks
- Memoized search/filter operations
- Optimistic UI updates
- Debounced search input

### User-Friendly Features
- Visual feedback for all actions
- Loading states during API calls
- Empty states with helpful messages
- Intuitive icons (Lucide React)
- Keyboard-friendly interface

## SMTP Integration (Optional)

The backend supports optional SMTP email sending via Nodemailer. To enable:

1. Add SMTP configuration to your environment:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

2. Send email with SMTP enabled:
```javascript
await emailApi.sendEmail({
  recipient_email: "patient@example.com",
  subject: "Test",
  body: "Hello",
  use_smtp: true  // Enable SMTP sending
});
```

**Note**: Without SMTP configuration, emails are stored in the database only (internal messaging system).

## Security Considerations

1. **Authentication**: All email endpoints require authentication (check session)
2. **Authorization**: Users can only access their own emails
3. **Input Validation**: Email addresses, subject, and body are validated
4. **SQL Injection Protection**: Parameterized queries used throughout
5. **Soft Deletes**: Emails aren't permanently deleted immediately
6. **Privacy**: Separate delete flags for sender/recipient

## Database Indexes

For optimal performance, the following indexes are created:

```sql
CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails(sender_id);
CREATE INDEX IF NOT EXISTS idx_emails_recipient ON emails(recipient_id);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON emails(folder);
CREATE INDEX IF NOT EXISTS idx_emails_read ON emails(is_read);
CREATE INDEX IF NOT EXISTS idx_emails_created ON emails(created_at DESC);
```

## Future Enhancements

Potential improvements for future versions:

1. **Rich Text Editor**: HTML email composition with formatting
2. **File Attachments**: Upload and attach files to emails
3. **Email Templates**: Pre-defined templates for common messages
4. **Auto-Complete**: Recipient suggestions while typing
5. **Email Threading**: Group related emails together
6. **Notifications**: Real-time notifications for new emails
7. **Bulk Actions**: Select multiple emails for bulk operations
8. **Email Filters**: Auto-organize emails based on rules
9. **Signature**: Custom email signatures
10. **Schedule Send**: Schedule emails to send later

## Testing

### Manual Testing Checklist

- [ ] Send email to external address
- [ ] Send email to internal user
- [ ] Save draft
- [ ] Load draft and send
- [ ] Reply to email
- [ ] Star/unstar email
- [ ] Delete email (move to trash)
- [ ] Permanently delete from trash
- [ ] Search emails
- [ ] Switch between folders
- [ ] Mark as read/unread
- [ ] View email statistics
- [ ] Compose with CC/BCC
- [ ] Cancel compose

### API Testing

Use the following curl commands to test endpoints:

```bash
# Get inbox
curl http://localhost:3000/api/email?folder=inbox

# Get stats
curl http://localhost:3000/api/email/stats

# Send email
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "test@example.com",
    "subject": "Test Email",
    "body": "This is a test email"
  }'

# Get single email
curl http://localhost:3000/api/email/1

# Mark as read
curl -X PUT http://localhost:3000/api/email/1/read \
  -H "Content-Type: application/json" \
  -d '{"is_read": true}'

# Star email
curl -X PUT http://localhost:3000/api/email/1/star \
  -H "Content-Type: application/json" \
  -d '{"is_starred": true}'

# Delete email
curl -X DELETE http://localhost:3000/api/email/1
```

## Troubleshooting

### Common Issues

1. **Emails not loading**
   - Check database connection
   - Verify email routes are registered in server.js
   - Check browser console for errors

2. **Send email fails**
   - Verify recipient_email format
   - Check subject and body are not empty
   - Review server logs for errors

3. **Search not working**
   - Ensure search query is properly encoded
   - Check database indexes are created
   - Verify search logic in controller

4. **Statistics not updating**
   - Call loadStats() after actions
   - Check stats endpoint response
   - Verify folder counts logic

## Maintenance

### Regular Tasks

1. **Database Cleanup**: Periodically delete old emails from trash
2. **Index Optimization**: Monitor query performance
3. **Attachment Management**: Clean up orphaned attachment files
4. **Log Review**: Check for unusual patterns or errors

### Monitoring

Track these metrics:
- Email send success rate
- Average email load time
- Search query performance
- User engagement (opens, replies)
- Storage usage

## Conclusion

The MediSync email system provides a complete, professional email solution for healthcare communications. With modern UI, comprehensive features, and solid backend architecture, it enables efficient communication while maintaining security and privacy standards.

For questions or support, refer to the main project documentation or contact the development team.
