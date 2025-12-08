// Test script to check frontend-backend integration
console.log('🧪 Testing frontend-backend integration...');

// Check if we can reach the backend from the frontend
async function testApiConnection() {
  try {
    // Test 1: Check if backend is reachable
    console.log('📡 Testing backend connectivity...');
    const healthResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'john.doe@careconnect.com',
        password: 'password123'
      })
    });
    
    if (healthResponse.ok) {
      const loginData = await healthResponse.json();
      console.log('✅ Login successful:', loginData);
      
      // Test 2: Check blog API with auth token
      console.log('📝 Testing blog API...');
      const blogResponse = await fetch('/api/blog/posts', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (blogResponse.ok) {
        const blogData = await blogResponse.json();
        console.log('✅ Blog API successful:', blogData);
      } else {
        console.error('❌ Blog API failed:', blogResponse.status, await blogResponse.text());
      }
      
    } else {
      console.error('❌ Login failed:', healthResponse.status, await healthResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

// Run the test
testApiConnection();

// Also check localStorage state
console.log('💾 Current localStorage authToken:', localStorage.getItem('authToken'));
console.log('💾 Current localStorage token:', localStorage.getItem('token'));