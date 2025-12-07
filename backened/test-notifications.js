#!/usr/bin/env node

/**
 * Test script for notification settings API
 * 
 * Usage:
 * node test-notifications.js
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

// Test doctor credentials (you'll need to adjust these for your test data)
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'testpassword123'
};

async function testNotificationAPIs() {
  console.log('🧪 Testing Notification APIs...\n');

  try {
    // 1. Login to get token
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // 2. Get current notification settings
    console.log('2. Getting current notification settings...');
    const getResponse = await fetch(`${API_BASE}/api/doctors/settings/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (getResponse.ok) {
      const settings = await getResponse.json();
      console.log('✅ Current settings:', JSON.stringify(settings, null, 2));
    } else {
      console.log('⚠️  No existing settings found (this is normal for new accounts)');
    }
    console.log('');

    // 3. Update notification settings with enhanced structure
    console.log('3. Updating notification settings with enhanced structure...');
    const newSettings = {
      globalMute: false,
      appointments: {
        enabled: true,
        email: true,
        push: true,
        sms: false
      },
      billing: {
        enabled: true,
        email: true,
        push: false,
        sms: false
      },
      chat: {
        enabled: true,
        email: false,
        push: true,
        sms: false
      },
      patients: {
        enabled: true,
        email: true,
        push: true,
        sms: false
      },
      system: {
        enabled: false,
        email: false,
        push: false,
        sms: false
      },
      frequency: 'immediate',
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '07:00'
      }
    };

    const updateResponse = await fetch(`${API_BASE}/api/doctors/settings/notifications`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newSettings)
    });

    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('✅ Settings updated successfully:', updateResult.message);
    } else {
      throw new Error(`Update failed: ${updateResponse.status}`);
    }
    console.log('');

    // 4. Get notification preferences (formatted)
    console.log('4. Getting formatted notification preferences...');
    const prefsResponse = await fetch(`${API_BASE}/api/doctors/settings/notification-preferences`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (prefsResponse.ok) {
      const prefs = await prefsResponse.json();
      console.log('✅ Formatted preferences:', JSON.stringify(prefs.data, null, 2));
    } else {
      console.log('⚠️  Preferences endpoint not available');
    }
    console.log('');

    // 5. Test notification sending
    console.log('5. Testing notification sending...');
    const testCases = [
      { type: 'appointments', method: 'email' },
      { type: 'billing', method: 'push' },
      { type: 'chat', method: 'push' }
    ];

    for (const testCase of testCases) {
      try {
        const testResponse = await fetch(`${API_BASE}/api/doctors/settings/test-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testCase)
        });

        if (testResponse.ok) {
          const testResult = await testResponse.json();
          console.log(`✅ Test ${testCase.type}/${testCase.method}: ${testResult.message}`);
        } else {
          console.log(`❌ Test ${testCase.type}/${testCase.method} failed: ${testResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Test ${testCase.type}/${testCase.method} error:`, error.message);
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   - Backend server is running on localhost:3001');
    console.log('   - Test credentials are valid');
    console.log('   - Database is properly initialized');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testNotificationAPIs();
}

export { testNotificationAPIs };