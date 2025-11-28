# Doctor Dashboard Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Overview
This API provides comprehensive backend services for the Doctor Dashboard, including doctor profile management, appointments, patient records, analytics, and billing.

---

## 🔐 Authentication
Currently, the API is open. In production, implement JWT-based authentication middleware.

---

## 📋 API Endpoints

### **Doctor Management**

#### Get Doctor Profile
```http
GET /doctors/:doctorId/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@careconnect.com",
    "phone": "+1-555-0101",
    "specialization": "Cardiologist",
    "license_number": "MD12345",
    "years_of_experience": 15,
    "bio": "Experienced cardiologist...",
    "profile_image_url": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Doctor Profile
```http
PUT /doctors/:doctorId/profile
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1-555-0101",
  "specialization": "Cardiologist",
  "years_of_experience": 15,
  "bio": "Updated bio...",
  "profile_image_url": "https://example.com/image.jpg"
}
```

#### Get Dashboard Statistics
```http
GET /doctors/:doctorId/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "todayAppointments": 8,
    "weekAppointments": 45,
    "monthAppointments": 187,
    "totalPatients": 324,
    "pendingAppointments": 12
  }
}
```

#### Get Doctor Settings
```http
GET /doctors/:doctorId/settings
```

#### Update Doctor Settings
```http
PUT /doctors/:doctorId/settings
```

**Request Body:**
```json
{
  "default_appointment_duration": 30,
  "working_hours_start": "09:00",
  "working_hours_end": "17:00",
  "consultation_fee": 150.00,
  "accept_new_patients": true
}
```

---

### **Appointment Management**

#### Get All Appointments
```http
GET /appointments/doctor/:doctorId?status=pending&date=2024-01-15&limit=50&offset=0
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, cancelled, completed)
- `date` (optional): Filter by specific date (YYYY-MM-DD)
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "appointment_date": "2024-01-15",
      "appointment_time": "09:00:00",
      "status": "confirmed",
      "appointment_type": "Consultation",
      "notes": "Initial consultation",
      "patient_id": 1,
      "patient_first_name": "John",
      "patient_last_name": "Smith",
      "patient_email": "john.smith@example.com",
      "patient_phone": "+1-555-1001"
    }
  ],
  "count": 1
}
```

#### Get Today's Appointments
```http
GET /appointments/doctor/:doctorId/today
```

#### Get Appointment by ID
```http
GET /appointments/:appointmentId
```

#### Create New Appointment
```http
POST /appointments/doctor/:doctorId
```

**Request Body:**
```json
{
  "patient_id": 1,
  "appointment_date": "2024-01-15",
  "appointment_time": "09:00",
  "appointment_type": "Consultation",
  "notes": "Initial consultation"
}
```

#### Update Appointment
```http
PUT /appointments/:appointmentId
```

**Request Body:**
```json
{
  "appointment_date": "2024-01-16",
  "appointment_time": "10:00",
  "status": "confirmed",
  "appointment_type": "Follow-up",
  "notes": "Updated notes"
}
```

#### Cancel Appointment
```http
PATCH /appointments/:appointmentId/cancel
```

---

### **Patient Management**

#### Get All Patients
```http
GET /patients/doctor/:doctorId?search=john&limit=50&offset=0
```

**Query Parameters:**
- `search` (optional): Search by name or email
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.smith@example.com",
      "phone": "+1-555-1001",
      "date_of_birth": "1990-05-15",
      "gender": "Male",
      "blood_group": "A+",
      "address": "123 Main St, New York, NY",
      "total_appointments": 5
    }
  ],
  "count": 1
}
```

#### Get Patient by ID
```http
GET /patients/:patientId
```

**Response includes patient details, recent appointments, and medical records**

#### Create New Patient
```http
POST /patients
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john.smith@example.com",
  "phone": "+1-555-1001",
  "date_of_birth": "1990-05-15",
  "gender": "Male",
  "blood_group": "A+",
  "address": "123 Main St, New York, NY",
  "emergency_contact_name": "Jane Smith",
  "emergency_contact_phone": "+1-555-1002",
  "medical_history": "No significant medical history",
  "allergies": "None"
}
```

#### Update Patient
```http
PUT /patients/:patientId
```

#### Get Patient Medical History
```http
GET /patients/:patientId/medical-history
```

#### Add Medical Record
```http
POST /patients/:patientId/medical-records
```

**Request Body:**
```json
{
  "doctor_id": 1,
  "diagnosis": "Common Cold",
  "prescription": "Rest and fluids, Vitamin C",
  "notes": "Patient showing mild symptoms",
  "lab_results": "Normal",
  "record_date": "2024-01-15"
}
```

---

### **Analytics**

#### Get Appointment Analytics
```http
GET /analytics/doctor/:doctorId/appointments?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointmentsByStatus": [
      { "status": "confirmed", "count": "45" },
      { "status": "pending", "count": "12" },
      { "status": "cancelled", "count": "3" }
    ],
    "appointmentsByType": [
      { "appointment_type": "Consultation", "count": "30" },
      { "appointment_type": "Follow-up", "count": "20" }
    ],
    "appointmentsTrend": [
      { "date": "2024-01-15", "count": "8" },
      { "date": "2024-01-16", "count": "10" }
    ],
    "peakHours": [
      { "hour": "9", "count": "15" },
      { "hour": "10", "count": "12" }
    ]
  }
}
```

#### Get Patient Analytics
```http
GET /analytics/doctor/:doctorId/patients
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalPatients": 324,
    "newPatientsThisMonth": 45,
    "patientsByAgeGroup": [
      { "age_group": "18-30", "count": "89" },
      { "age_group": "31-50", "count": "134" }
    ],
    "patientsByGender": [
      { "gender": "Male", "count": "156" },
      { "gender": "Female", "count": "168" }
    ]
  }
}
```

#### Get Revenue Analytics
```http
GET /analytics/doctor/:doctorId/revenue?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRevenue": 28750.00,
    "revenueThisMonth": 4500.00,
    "revenueByMonth": [
      { "month": "Jan 2024", "total": "4500" },
      { "month": "Dec 2023", "total": "5200" }
    ],
    "pendingPayments": {
      "total": 1250.00,
      "count": 8
    }
  }
}
```

---

### **Billing**

#### Get Billing Records
```http
GET /billing/doctor/:doctorId?status=pending&limit=50&offset=0
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, paid, overdue)
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "doctor_id": 1,
      "patient_id": 1,
      "appointment_id": 1,
      "amount": "150.00",
      "description": "Initial Consultation",
      "status": "paid",
      "due_date": "2024-01-15",
      "payment_date": "2024-01-15T10:30:00.000Z",
      "patient_first_name": "John",
      "patient_last_name": "Smith",
      "patient_email": "john.smith@example.com",
      "patient_phone": "+1-555-1001"
    }
  ],
  "count": 1
}
```

#### Get Billing Summary
```http
GET /billing/doctor/:doctorId/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_records": "45",
    "total_paid": "28750.00",
    "total_pending": "1250.00",
    "total_overdue": "350.00"
  }
}
```

#### Create Billing Record
```http
POST /billing/doctor/:doctorId
```

**Request Body:**
```json
{
  "patient_id": 1,
  "appointment_id": 1,
  "amount": 150.00,
  "description": "Initial Consultation",
  "due_date": "2024-01-22"
}
```

#### Update Billing Record
```http
PUT /billing/:billingId
```

**Request Body:**
```json
{
  "amount": 175.00,
  "description": "Updated description",
  "status": "pending",
  "due_date": "2024-01-25"
}
```

#### Mark Billing as Paid
```http
PATCH /billing/:billingId/mark-paid
```

---

## 🗄️ Database Schema

### Tables
1. **doctors** - Doctor profiles
2. **doctor_settings** - Doctor preferences and settings
3. **patients** - Patient information
4. **appointments** - Appointment scheduling
5. **medical_records** - Patient medical history
6. **billing** - Billing and payment records

---

## 🚀 Setup Instructions

### 1. Install Dependencies
```bash
cd backened
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=5000
PGHOST=your_neon_host
PGDATABASE=your_database
PGUSER=your_user
PGPASSWORD=your_password
```

### 3. Initialize Database
```bash
npm run dev
```
This will automatically create all required tables.

### 4. Seed Sample Data (Optional)
```bash
node seed.js
```

### 5. Start Server
```bash
npm run dev
```

---

## 🧪 Testing the API

### Using cURL
```bash
# Get doctor profile
curl http://localhost:5000/api/doctors/1/profile

# Get today's appointments
curl http://localhost:5000/api/appointments/doctor/1/today

# Create new appointment
curl -X POST http://localhost:5000/api/appointments/doctor/1 \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "appointment_date": "2024-01-15",
    "appointment_time": "09:00",
    "appointment_type": "Consultation"
  }'
```

### Using Postman
Import the endpoints and test with the Postman collection.

---

## 📝 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## 🔒 Security Considerations

1. **Add Authentication:** Implement JWT-based authentication
2. **Input Validation:** Add request validation middleware
3. **Rate Limiting:** Already implemented with Arcjet
4. **SQL Injection:** Using parameterized queries
5. **CORS:** Configure CORS for specific domains in production
6. **HTTPS:** Use HTTPS in production

---

## 📊 Performance Optimization

- Database indexes created for frequently queried fields
- Pagination implemented for large datasets
- Efficient JOIN queries to minimize database calls

---

## 🎯 Next Steps

1. Implement authentication middleware
2. Add input validation with express-validator
3. Create WebSocket support for real-time notifications
4. Add file upload for profile images and documents
5. Implement email notifications for appointments
6. Add comprehensive logging and monitoring
