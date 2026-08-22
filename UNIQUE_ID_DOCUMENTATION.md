# Unique ID System Documentation

## Overview

The MediSync system now includes unique, human-readable IDs for both doctors and patients to improve identification and tracking throughout the system.

## Unique ID Format

### Doctors
- **Format**: `DOC-XXX` (e.g., DOC-001, DOC-002, DOC-003)
- **Pattern**: DOC- prefix followed by 3-digit sequential number with leading zeros

### Patients
- **Format**: `PAT-XXX` (e.g., PAT-001, PAT-002, PAT-003)
- **Pattern**: PAT- prefix followed by 3-digit sequential number with leading zeros

## Database Schema Changes

### Doctors Table
```sql
ALTER TABLE doctors ADD COLUMN unique_id VARCHAR(20) UNIQUE;
CREATE INDEX idx_doctors_unique_id ON doctors(unique_id);
```

### Patients Table
```sql
ALTER TABLE patients ADD COLUMN unique_id VARCHAR(20) UNIQUE;
CREATE INDEX idx_patients_unique_id ON patients(unique_id);
```

## API Changes

### Doctor Profile Endpoint
**GET** `/api/doctors/:id/profile`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "unique_id": "DOC-001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@medisync.com",
    // ... other fields
  }
}
```

### Patient Endpoints
**GET** `/api/patients/doctor/:doctorId`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "unique_id": "PAT-001",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.smith@example.com",
      // ... other fields
    }
  ]
}
```

### Appointment Endpoints
**GET** `/api/appointments/doctor/:doctorId`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "patient_id": 1,
      "patient_unique_id": "PAT-001",
      "patient_first_name": "John",
      "patient_last_name": "Smith",
      // ... other fields
    }
  ]
}
```

## Frontend Changes

### AppointmentTab.jsx
- Patient names in appointment list now display unique IDs: "John Smith (PAT-001)"
- Patient dropdowns in New/Edit appointment modals show unique IDs
- Improved patient identification in appointment management

### PatientTab.jsx
- Patient list displays unique IDs next to names: "John Smith (PAT-001)"
- Enhanced patient identification and tracking

### ProfileTab.jsx
- Doctor profile shows unique ID: "Doctor ID: DOC-001"
- Clear doctor identification in profile section

## Utility Functions

### Backend: `/backend/lib/uniqueIdGenerator.js`

#### Available Functions:
```javascript
// Generate next available unique ID for doctors
const getNextDoctorId = async () => Promise<string>

// Generate next available unique ID for patients  
const getNextPatientId = async () => Promise<string>

// Validate unique ID format
const validateUniqueIdFormat = (id, type) => boolean

// Check if unique ID already exists
const checkUniqueIdExists = (id, type) => Promise<boolean>
```

#### Usage Example:
```javascript
import { getNextPatientId } from '../lib/uniqueIdGenerator.js';

const uniqueId = await getNextPatientId(); // Returns "PAT-001", "PAT-002", etc.
```

## Migration Scripts

### Initial Migration: `/backend/add-unique-ids.js`
- Adds unique_id columns to existing tables
- Generates unique IDs for all existing doctors and patients
- Creates database indexes for performance
- **Run once**: `npm run add-unique-ids`

### Fresh Installation: `/backend/init-db.js`
- Updated to include unique_id fields in table creation
- Includes indexes for unique_id columns
- Ready for new installations

### Seed Data: `/backend/seed.js`  
- Updated to include unique IDs in sample data
- Doctors: DOC-001, DOC-002, DOC-003
- Patients: PAT-001 through PAT-010

## NPM Scripts

```bash
# Run migration to add unique IDs to existing data
npm run add-unique-ids

# Initialize fresh database with unique ID support
npm run init-db

# Seed database with sample data including unique IDs
npm run seed
```

## Benefits

1. **Human-Readable**: Easy to communicate and reference (e.g., "Patient PAT-001")
2. **Sequential**: Clear ordering and easy to track growth
3. **Type-Safe**: Prefix clearly identifies whether it's a doctor or patient
4. **Database-Optimized**: Indexed for fast queries
5. **API-Friendly**: Included in all relevant API responses
6. **Frontend-Ready**: Displayed throughout the UI for better UX

## Usage Guidelines

### For New Records
- Unique IDs are automatically generated when creating new doctors or patients
- Use helper functions from `uniqueIdGenerator.js` for consistent ID generation

### For Existing Records
- All existing records have been migrated with unique IDs
- No action needed for existing data

### For API Integration
- Always include unique_id in SELECT statements for doctor/patient queries
- Display unique IDs in user interfaces for better identification
- Use unique IDs in logs and error messages for easier debugging

## Example Integration

### Creating a New Patient
```javascript
import { getNextPatientId } from '../lib/uniqueIdGenerator.js';

const createPatient = async (patientData) => {
  const uniqueId = await getNextPatientId();
  
  const result = await sql`
    INSERT INTO patients (unique_id, first_name, last_name, email, ...)
    VALUES (${uniqueId}, ${patientData.first_name}, ...)
    RETURNING *
  `;
  
  return result[0];
};
```

### Displaying in Frontend
```jsx
// In appointment list
<p className="font-medium">
  {appointment.patient_first_name} {appointment.patient_last_name}
  <span className="ml-2 text-xs text-muted-foreground">
    ({appointment.patient_unique_id})
  </span>
</p>

// In patient dropdown
<option value={patient.id}>
  {patient.first_name} {patient.last_name} ({patient.unique_id})
</option>
```

## Testing

### Verify Migration
```bash
# Check that unique IDs were added
npm run add-unique-ids

# Expected output:
# ✓ 3 doctors have unique IDs
# ✓ 10 patients have unique IDs
```

### Test API Endpoints
```bash
# Test doctor profile includes unique_id
curl http://localhost:5000/api/doctors/1/profile

# Test patient list includes unique_id  
curl http://localhost:5000/api/patients/doctor/1

# Test appointments include patient_unique_id
curl http://localhost:5000/api/appointments/doctor/1
```

## Troubleshooting

### If Unique IDs Are Missing
1. Run migration script: `npm run add-unique-ids`
2. Check database columns exist: `unique_id` should be in doctors and patients tables
3. Verify API responses include unique_id fields

### If Frontend Doesn't Show Unique IDs
1. Ensure backend APIs return unique_id fields
2. Check browser console for JavaScript errors
3. Verify frontend components reference correct field names (unique_id, patient_unique_id)

### For New Installations
1. Run `npm run init-db` to create tables with unique_id support
2. Run `npm run seed` to populate with sample data including unique IDs
3. No migration needed for fresh installations