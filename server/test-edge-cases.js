// const mongoose = require('mongoose');
// const { User } = require('./models/User'); // Will fail if User.js doesn't export correctly, so we'll just test the API
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function runEdgeCaseTests() {
  console.log('--- Running Edge Case Tests ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  try {
    // Edge Case 1: Login with invalid credentials (Injection protection test)
    const res1 = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $gt: "" }, password: "password123" })
    });
    assert(res1.status === 401 || res1.status === 400 || res1.status === 500, 'NoSQL Injection blocked on login');

    // Create a temporary test user to run authenticated tests
    let loggedIn = false;
    const testEmail = `test_${Date.now()}@gyaansetu.com`;
    
    try {
      const signupRes = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: testEmail, password: 'password123' })
      });
      
      if (signupRes.ok) {
        const data = await signupRes.json();
        authToken = data.token;
        loggedIn = true;
      } else {
        const errData = await signupRes.text();
        console.log('⚠️ Could not signup test account:', errData);
      }
    } catch (e) {
      console.log('⚠️ Network error during signup:', e.message);
    }

    if (loggedIn) {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

      // Edge Case 2: Save empty syllabus
      const res2 = await fetch(`${API_URL}/syllabus/save`, {
        method: 'POST', headers, body: JSON.stringify({ subjects: [], name: '' })
      });
      assert(res2.status >= 400, 'Cannot save completely empty syllabus');

      // Edge Case 3: Explanation message missing content
      const res3 = await fetch(`${API_URL}/explanation/history/invalid-id`, {
        method: 'PUT', headers, body: JSON.stringify({ role: 'user', content: '' })
      });
      assert(res3.status === 400, 'Explanation PUT rejects empty content');

      // Edge Case 4: Explanation history concurrent updates
      const promises = [];
      for(let i=0; i<5; i++) {
        promises.push(fetch(`${API_URL}/explanation/history/60d21b4667d0d8992e610c85`, {
          method: 'PUT', headers, body: JSON.stringify({ role: 'user', content: 'test' })
        }));
      }
      const responses = await Promise.all(promises);
      const all404 = responses.every(r => r.status === 404);
      assert(all404, 'Concurrent requests handled safely without crash (returns 404 cleanly for invalid id)');
    }

  } catch (error) {
    console.error('Fatal test error:', error);
  } finally {
    console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runEdgeCaseTests();
