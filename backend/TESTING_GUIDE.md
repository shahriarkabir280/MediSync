# Quick Testing Guide

## 🚀 Getting Started

### 1. Start the Server
```bash
# Make sure you're in the project root
npm run dev
```

Expected output:
```
Database initialized successfully
Server is running on http://localhost:5000
```

### 2. Seed Sample Data
```bash
# In a new terminal
npm run seed
```

This creates sample data including:
- 3 doctors
- 5 patients  
- 5 appointments (including today's appointments)
- Medical records
- Billing records

---

## 🧪 Test API Endpoints

### Test 1: Check Server Status
```bash
curl http://localhost:5000/
```
Expected: `Server is running!`

### Test 2: Get Doctor Profile
```bash
curl http://localhost:5000/api/doctors/1/profile
```

### Test 3: Get Dashboard Statistics
```bash
curl http://localhost:5000/api/doctors/1/stats
```

### Test 4: Get Today's Appointments
```bash
curl http://localhost:5000/api/appointments/doctor/1/today
```

### Test 5: Get All Patients
```bash
curl http://localhost:5000/api/patients/doctor/1
```

### Test 6: Create New Appointment
```bash
curl -X POST http://localhost:5000/api/appointments/doctor/1 \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "appointment_date": "2024-12-01",
    "appointment_time": "15:00",
    "appointment_type": "Follow-up",
    "notes": "Regular checkup"
  }'
```

### Test 7: Get Appointment Analytics
```bash
curl http://localhost:5000/api/analytics/doctor/1/appointments
```

### Test 8: Get Patient Analytics
```bash
curl http://localhost:5000/api/analytics/doctor/1/patients
```

### Test 9: Get Billing Records
```bash
curl http://localhost:5000/api/billing/doctor/1
```

### Test 10: Get Billing Summary
```bash
curl http://localhost:5000/api/billing/doctor/1/summary
```

---

## 🔍 Test Filtering & Pagination

### Filter Appointments by Status
```bash
curl "http://localhost:5000/api/appointments/doctor/1?status=pending"
```

### Filter Appointments by Date
```bash
curl "http://localhost:5000/api/appointments/doctor/1?date=2024-12-01"
```

### Search Patients
```bash
curl "http://localhost:5000/api/patients/doctor/1?search=john"
```

### Pagination
```bash
curl "http://localhost:5000/api/appointments/doctor/1?limit=10&offset=0"
```

---

## 🛠️ Test Update Operations

### Update Doctor Profile
```bash
curl -X PUT http://localhost:5000/api/doctors/1/profile \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1-555-9999",
    "bio": "Updated bio text"
  }'
```

### Update Appointment
```bash
curl -X PUT http://localhost:5000/api/appointments/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "notes": "Patient confirmed attendance"
  }'
```

### Cancel Appointment
```bash
curl -X PATCH http://localhost:5000/api/appointments/1/cancel
```

### Mark Billing as Paid
```bash
curl -X PATCH http://localhost:5000/api/billing/1/mark-paid
```

---

## 📊 Test Analytics with Date Ranges

### Appointment Analytics (Last 30 Days)
```bash
curl "http://localhost:5000/api/analytics/doctor/1/appointments?startDate=2024-11-01&endDate=2024-11-30"
```

### Revenue Analytics (Last 6 Months)
```bash
curl "http://localhost:5000/api/analytics/doctor/1/revenue?startDate=2024-06-01&endDate=2024-11-30"
```

---

## 🐛 Troubleshooting

### Issue: Database connection error
**Solution:** Check your `.env` file has correct PostgreSQL credentials:
```env
PGHOST=your_neon_host
PGDATABASE=your_database
PGUSER=your_user
PGPASSWORD=your_password
```

### Issue: "Doctor not found" or "Patient not found"
**Solution:** Run the seed script first:
```bash
npm run seed
```

### Issue: Rate limit errors
**Solution:** Check your Arcjet configuration in `.env`:
```env
ARCJET_KEY=your_arcjet_key
```

### Issue: Port already in use
**Solution:** Change the port in `.env`:
```env
PORT=5001
```

Or kill the process using port 5000:
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

---

## 📱 Testing with Frontend

Once the backend is running, you can test it with the frontend:

1. Start backend: `npm run dev` (port 5000)
2. Start frontend: `cd frontend && npm run dev` (usually port 5173)
3. Update frontend API calls to point to `http://localhost:5000/api`

### Example Frontend API Call
```javascript
// In your React component
const fetchDoctorProfile = async (doctorId) => {
  try {
    const response = await fetch(`http://localhost:5000/api/doctors/${doctorId}/profile`);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## ✅ Expected Test Results

After running all tests, you should see:
- ✅ Server running on port 5000
- ✅ Database tables created automatically
- ✅ Sample data populated (3 doctors, 5 patients, appointments, etc.)
- ✅ All API endpoints returning proper JSON responses
- ✅ CRUD operations working correctly
- ✅ Analytics showing meaningful data
- ✅ Filtering and pagination working

---

## 📝 Next Steps

1. **Connect Frontend:** Update frontend to call these APIs
2. **Add Authentication:** Implement JWT tokens
3. **Validate Inputs:** Add express-validator
4. **Error Handling:** Improve error messages
5. **Logging:** Add comprehensive logging
6. **Testing:** Write unit and integration tests

---

## 🔗 Useful Resources

- API Documentation: `backend/API_DOCUMENTATION.md`
- Backend README: `backend/README.md`
- Database Schema: See `server.js` initDB function

---

## 💡 Tips

- Use Postman or Insomnia for easier API testing
- Check terminal logs for detailed error messages
- Use `console.log()` in controllers for debugging
- Monitor database queries in Neon dashboard
- Test with different doctor IDs (1, 2, 3) after seeding

---

Happy Testing! 🎉
