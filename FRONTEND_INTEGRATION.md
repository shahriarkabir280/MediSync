# Frontend Integration Guide

## ✅ Integration Complete!

The frontend has been successfully integrated with the backend API. All dashboard components now fetch real data from the backend server.

---

## 🚀 Quick Start

### 1. Start the Backend Server
```bash
# In the project root
npm run dev
```
Backend will run on: `http://localhost:5000`

### 2. Seed Sample Data (First Time Only)
```bash
npm run seed
```
This creates sample doctors, patients, appointments, and billing records.

### 3. Start the Frontend
```bash
cd frontened
npm run dev
```
Frontend will run on: `http://localhost:5173` (or similar)

---

## 📋 What's Been Integrated

### ✅ Components Updated

1. **AppointmentTab** - Now fetches:
   - Today's appointments from API
   - Dashboard statistics (today, week, month)
   - Doctor settings (appointment duration, working hours)

2. **PatientTab** - Now fetches:
   - All patients for the doctor
   - Search functionality
   - Patient demographics and visit counts

3. **ProfileTab** - Now fetches:
   - Doctor profile information
   - Editable profile with save functionality
   - Specialization and experience details

4. **AnalyticsTab** - Now fetches:
   - Appointment analytics (by status, type, trends)
   - Patient analytics (demographics, age groups, gender)
   - Revenue analytics and summaries
   - Peak appointment hours

5. **BillingTab** - Now fetches:
   - All billing records
   - Billing summary (paid, pending, overdue)
   - Filter by status
   - Mark as paid functionality

---

## 🔧 API Configuration

### API Base URL
Located in: `frontened/src/lib/api.js`

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

**For Production:** Update this to your production API URL.

### API Functions Available

```javascript
import { 
  doctorApi, 
  appointmentApi, 
  patientApi, 
  analyticsApi, 
  billingApi 
} from './lib/api';
```

---

## 🔑 Current Doctor ID

All components currently use `doctorId = 1` as a hardcoded value.

**To implement proper authentication:**

1. Create an Auth Context:
```javascript
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [doctor, setDoctor] = useState({ id: 1 }); // From login
  
  return (
    <AuthContext.Provider value={{ doctor, setDoctor }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

2. Use it in components:
```javascript
import { useAuth } from '../../contexts/AuthContext';

const AppointmentTab = () => {
  const { doctor } = useAuth();
  const doctorId = doctor.id;
  // ... rest of component
};
```

---

## 📊 Features Implemented

### Loading States
- All components show "Loading..." while fetching data
- Smooth transitions between states

### Error Handling
- Error messages displayed to users
- Retry buttons for failed requests
- Console logging for debugging

### Real-time Data
- Components fetch fresh data on mount
- Manual refresh available via retry buttons

### Search & Filtering
- Patient search by name or email
- Billing filter by status (all, pending, paid, overdue)
- Appointment filtering (ready to implement)

### Interactive Features
- Edit doctor profile
- Mark billing as paid
- Status badges with color coding
- Responsive design

---

## 🎨 Component Features

### AppointmentTab
```javascript
✅ Today's appointments list
✅ Dashboard statistics (today/week/month)
✅ Real-time appointment status
✅ Settings display (duration, working hours)
```

### PatientTab
```javascript
✅ Patient list with demographics
✅ Search functionality
✅ Age calculation from DOB
✅ Total appointments per patient
✅ Avatar initials display
```

### ProfileTab
```javascript
✅ View doctor profile
✅ Edit mode with form validation
✅ Save profile changes
✅ Display specialization and experience
```

### AnalyticsTab
```javascript
✅ Key metrics dashboard
✅ Appointment analytics by status/type
✅ Patient demographics breakdown
✅ Revenue summary with pending payments
✅ Peak hours visualization
```

### BillingTab
```javascript
✅ Billing records table
✅ Summary cards (total, paid, pending, overdue)
✅ Filter by status
✅ Mark as paid functionality
✅ Patient information display
```

---

## 🔄 API Call Patterns

### Fetching Data
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await appointmentApi.getToday(doctorId);
      setAppointments(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

### Creating/Updating Data
```javascript
const handleUpdate = async () => {
  try {
    await doctorApi.updateProfile(doctorId, formData);
    await fetchProfile(); // Refresh data
    alert('Updated successfully!');
  } catch (err) {
    alert('Error: ' + err.message);
  }
};
```

---

## 🛠️ Testing the Integration

### 1. Check Backend is Running
```bash
curl http://localhost:5000/api/doctors/1/profile
```
Should return doctor profile JSON.

### 2. Open Frontend
Navigate to: `http://localhost:5173`

### 3. Navigate Through Tabs
- **Profile Tab** - Should show doctor details
- **Appointments Tab** - Should show today's appointments
- **Patients Tab** - Should show patient list
- **Analytics Tab** - Should show dashboard metrics
- **Billing Tab** - Should show billing records

### 4. Check Browser Console
- Open Developer Tools (F12)
- Check Console for any errors
- Network tab should show API calls

---

## 🐛 Troubleshooting

### Issue: "Loading..." Never Ends
**Solution:** 
1. Check if backend is running: `http://localhost:5000`
2. Check browser console for CORS errors
3. Verify doctor with ID 1 exists in database

### Issue: CORS Error
**Solution:** Backend already has CORS enabled. If issues persist:
```javascript
// In backened/server.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue: No Data Showing
**Solution:** Run the seed script:
```bash
npm run seed
```

### Issue: API Calls Failing
**Solution:**
1. Check API_BASE_URL in `lib/api.js`
2. Verify backend is running on port 5000
3. Check network tab in browser dev tools

---

## 📝 Next Steps

### Immediate
- [ ] Add authentication (JWT tokens)
- [ ] Implement doctor login/logout
- [ ] Create protected routes

### Features to Add
- [ ] Create new appointment modal
- [ ] Add new patient form
- [ ] Create billing record form
- [ ] Patient details modal
- [ ] Appointment edit functionality
- [ ] Date range filters for analytics

### Improvements
- [ ] Add toast notifications instead of alerts
- [ ] Implement pagination for large lists
- [ ] Add loading skeletons
- [ ] Implement optimistic updates
- [ ] Add form validation
- [ ] Error boundary components

### Performance
- [ ] Implement React Query for caching
- [ ] Add debouncing to search
- [ ] Lazy load components
- [ ] Optimize re-renders

---

## 📚 File Structure

```
frontened/src/
├── lib/
│   └── api.js                    # ✅ API utility functions
├── pages/
│   ├── DoctorDashboard.jsx
│   └── DoctorDashboardTabs/
│       ├── AppointmentTab.jsx    # ✅ Updated with API
│       ├── PatientTab.jsx        # ✅ Updated with API
│       ├── ProfileTab.jsx        # ✅ Updated with API
│       ├── AnalyticsTab.jsx      # ✅ Updated with API
│       ├── BillingTab.jsx        # ✅ Updated with API
│       ├── CalendarTab.jsx       # ⚪ Not yet integrated
│       ├── ChatTab.jsx           # ⚪ Not yet integrated
│       ├── EmailTab.jsx          # ⚪ Not yet integrated
│       └── ... (other tabs)
```

---

## 🔗 API Endpoints Used

### Doctor
- `GET /api/doctors/:doctorId/profile` - Get profile
- `PUT /api/doctors/:doctorId/profile` - Update profile
- `GET /api/doctors/:doctorId/stats` - Get statistics
- `GET /api/doctors/:doctorId/settings` - Get settings

### Appointments
- `GET /api/appointments/doctor/:doctorId/today` - Today's appointments
- `GET /api/appointments/doctor/:doctorId` - All appointments

### Patients
- `GET /api/patients/doctor/:doctorId` - All patients
- `GET /api/patients/:patientId` - Patient details

### Analytics
- `GET /api/analytics/doctor/:doctorId/appointments` - Appointment analytics
- `GET /api/analytics/doctor/:doctorId/patients` - Patient analytics
- `GET /api/analytics/doctor/:doctorId/revenue` - Revenue analytics

### Billing
- `GET /api/billing/doctor/:doctorId` - Billing records
- `GET /api/billing/doctor/:doctorId/summary` - Billing summary
- `PATCH /api/billing/:billingId/mark-paid` - Mark as paid

---

## 💡 Tips

1. **Keep Backend Running:** Always start backend before frontend
2. **Check Console:** Browser console shows helpful error messages
3. **Use Network Tab:** See all API requests and responses
4. **Seed Data:** Run seed script for testing with real-looking data
5. **Hot Reload:** Both frontend and backend support hot reload

---

## 🎉 Success!

Your frontend is now fully integrated with the backend API. All components are fetching real data and ready for further development.

**Happy Coding!** 🚀
