// Quick test to verify backend connectivity
// Run this in browser console after starting both servers

const testBackendConnection = async () => {
  const API_BASE_URL = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Backend Connection...\n');
  
  // Test 1: Server Status
  try {
    const response = await fetch('http://localhost:5000');
    const text = await response.text();
    console.log('✅ Test 1: Server Status');
    console.log('   Response:', text);
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
    return;
  }
  
  // Test 2: Doctor Profile
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/1/profile`);
    const data = await response.json();
    console.log('\n✅ Test 2: Doctor Profile');
    console.log('   Doctor:', data.data?.first_name, data.data?.last_name);
    console.log('   Email:', data.data?.email);
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
  }
  
  // Test 3: Today's Appointments
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/doctor/1/today`);
    const data = await response.json();
    console.log('\n✅ Test 3: Today\'s Appointments');
    console.log('   Count:', data.data?.length || 0);
    if (data.data?.length > 0) {
      console.log('   First:', data.data[0].patient_first_name, data.data[0].patient_last_name);
    }
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
  }
  
  // Test 4: Dashboard Stats
  try {
    const response = await fetch(`${API_BASE_URL}/doctors/1/stats`);
    const data = await response.json();
    console.log('\n✅ Test 4: Dashboard Stats');
    console.log('   Today:', data.data?.todayAppointments);
    console.log('   Week:', data.data?.weekAppointments);
    console.log('   Month:', data.data?.monthAppointments);
    console.log('   Patients:', data.data?.totalPatients);
  } catch (error) {
    console.error('❌ Test 4 Failed:', error.message);
  }
  
  // Test 5: Patients List
  try {
    const response = await fetch(`${API_BASE_URL}/patients/doctor/1`);
    const data = await response.json();
    console.log('\n✅ Test 5: Patients List');
    console.log('   Count:', data.data?.length || 0);
    if (data.data?.length > 0) {
      console.log('   First:', data.data[0].first_name, data.data[0].last_name);
    }
  } catch (error) {
    console.error('❌ Test 5 Failed:', error.message);
  }
  
  // Test 6: Billing Summary
  try {
    const response = await fetch(`${API_BASE_URL}/billing/doctor/1/summary`);
    const data = await response.json();
    console.log('\n✅ Test 6: Billing Summary');
    console.log('   Total Records:', data.data?.total_records);
    console.log('   Total Paid: $', data.data?.total_paid);
    console.log('   Pending: $', data.data?.total_pending);
  } catch (error) {
    console.error('❌ Test 6 Failed:', error.message);
  }
  
  console.log('\n✅ All tests completed!');
};

// Run the test
testBackendConnection();
