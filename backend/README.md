# MediSync Backend

Backend API for the Doctor Dashboard application.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
PGHOST=your_neon_host
PGDATABASE=your_database_name
PGUSER=your_username
PGPASSWORD=your_password
ARCJET_KEY=your_arcjet_key
```

### 3. Start Development Server
```bash
npm run dev
```

The server will start at `http://localhost:5000`

### 4. Seed Sample Data (Optional)
```bash
npm run seed
```

This will create sample doctors, patients, appointments, and billing records.

## 📁 Project Structure

```
backend/
├── server.js                 # Main server file
├── seed.js                   # Database seeding script
├── API_DOCUMENTATION.md      # Complete API documentation
├── config/
│   └── db.js                 # Database configuration
├── controllers/
│   ├── doctorController.js       # Doctor profile & settings
│   ├── appointmentController.js  # Appointment management
│   ├── patientController.js      # Patient management
│   ├── analyticsController.js    # Dashboard analytics
│   ├── billingController.js      # Billing & payments
│   └── productController.js      # Product management
├── routes/
│   ├── doctorRoutes.js
│   ├── appointmentRoutes.js
│   ├── patientRoutes.js
│   ├── analyticsRoutes.js
│   ├── billingRoutes.js
│   └── productRoutes.js
└── lib/
    └── arcjet.js             # Rate limiting & security
```

## 🔑 Key Features

### Doctor Management
- ✅ Get/update doctor profile
- ✅ Dashboard statistics
- ✅ Doctor settings management

### Appointment Management
- ✅ Create, read, update, cancel appointments
- ✅ Filter by status, date
- ✅ Today's appointments
- ✅ Time slot validation

### Patient Management
- ✅ Patient CRUD operations
- ✅ Search functionality
- ✅ Medical history tracking
- ✅ Medical records management

### Analytics
- ✅ Appointment analytics (by status, type, trends)
- ✅ Patient analytics (demographics, age groups)
- ✅ Revenue analytics
- ✅ Peak hours analysis

### Billing
- ✅ Billing records management
- ✅ Payment tracking
- ✅ Billing summary statistics
- ✅ Mark as paid functionality

## 🗄️ Database Tables

- **doctors** - Doctor profiles and information
- **doctor_settings** - Doctor preferences (working hours, fees, etc.)
- **patients** - Patient information and demographics
- **appointments** - Appointment scheduling and tracking
- **medical_records** - Patient medical history and records
- **billing** - Billing and payment information
- **products** - Product catalog (existing)

## 🛠️ API Endpoints

All endpoints are prefixed with `/api`

### Doctor Routes (`/api/doctors`)
- `GET /:doctorId/profile` - Get doctor profile
- `PUT /:doctorId/profile` - Update doctor profile
- `GET /:doctorId/stats` - Get dashboard statistics
- `GET /:doctorId/settings` - Get doctor settings
- `PUT /:doctorId/settings` - Update doctor settings

### Appointment Routes (`/api/appointments`)
- `GET /doctor/:doctorId` - Get all appointments
- `GET /doctor/:doctorId/today` - Get today's appointments
- `GET /:appointmentId` - Get appointment by ID
- `POST /doctor/:doctorId` - Create new appointment
- `PUT /:appointmentId` - Update appointment
- `PATCH /:appointmentId/cancel` - Cancel appointment

### Patient Routes (`/api/patients`)
- `GET /doctor/:doctorId` - Get all patients
- `GET /:patientId` - Get patient details
- `POST /` - Create new patient
- `PUT /:patientId` - Update patient
- `GET /:patientId/medical-history` - Get medical history
- `POST /:patientId/medical-records` - Add medical record

### Analytics Routes (`/api/analytics`)
- `GET /doctor/:doctorId/appointments` - Appointment analytics
- `GET /doctor/:doctorId/patients` - Patient analytics
- `GET /doctor/:doctorId/revenue` - Revenue analytics

### Billing Routes (`/api/billing`)
- `GET /doctor/:doctorId` - Get billing records
- `GET /doctor/:doctorId/summary` - Get billing summary
- `POST /doctor/:doctorId` - Create billing record
- `PUT /:billingId` - Update billing record
- `PATCH /:billingId/mark-paid` - Mark as paid

📖 **See `API_DOCUMENTATION.md` for detailed endpoint documentation with request/response examples.**

## 🔒 Security Features

- ✅ **Arcjet Rate Limiting** - Prevents API abuse
- ✅ **Bot Detection** - Blocks malicious bots
- ✅ **Helmet.js** - Security headers
- ✅ **CORS** - Cross-origin resource sharing
- ✅ **SQL Injection Protection** - Parameterized queries
- ⚠️ **Authentication** - TODO: Implement JWT auth

## 🧪 Testing

### Test with cURL
```bash
# Get doctor profile
curl http://localhost:5000/api/doctors/1/profile

# Get today's appointments
curl http://localhost:5000/api/appointments/doctor/1/today

# Create appointment
curl -X POST http://localhost:5000/api/appointments/doctor/1 \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "appointment_date": "2024-12-01",
    "appointment_time": "09:00",
    "appointment_type": "Consultation"
  }'
```

## 📊 Sample Data

After running `npm run seed`, you'll have:
- 3 Sample doctors
- 5 Sample patients
- 5 Sample appointments (including today's appointments)
- Medical records
- Billing records

**Sample Doctor Email:** `john.doe@medisync.com`

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `PGHOST` | PostgreSQL host | Yes |
| `PGDATABASE` | Database name | Yes |
| `PGUSER` | Database user | Yes |
| `PGPASSWORD` | Database password | Yes |
| `ARCJET_KEY` | Arcjet API key | Yes |

## 📝 Development

### Adding New Routes

1. Create controller in `controllers/`
2. Create route file in `routes/`
3. Import and use in `server.js`
4. Update API documentation

### Database Migrations

Currently using direct SQL queries. For production:
- Consider using migration tools like Knex.js or Prisma
- Add versioning for schema changes
- Implement backup strategies

## 🚧 TODO

- [ ] Add JWT authentication middleware
- [ ] Implement input validation (express-validator)
- [ ] Add request logging
- [ ] Create unit tests
- [ ] Add WebSocket for real-time updates
- [ ] Implement file upload for images/documents
- [ ] Add email notification service
- [ ] Create admin panel routes
- [ ] Add audit logging
- [ ] Implement caching (Redis)

## 📄 License

ISC

## 👨‍💻 Author

MediSync Team
