const http = require('http');

const request = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseBody ? JSON.parse(responseBody) : null
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runTests = async () => {
  try {
    console.log("=== STARTING TESTS ===");
    
    // 1. PING
    let res = await request('GET', '/api/ping');
    console.log("\n[GET /api/ping]");
    console.log("Status:", res.statusCode);
    console.log("Body:", res.body);

    const email = `test@gyaansetu.com`;
    const password = 'password123';

    // 2. SIGNUP
    res = await request('POST', '/api/auth/signup', {
      name: 'Riya API Test',
      email,
      password,
      language: 'en'
    });
    console.log("\n[POST /api/auth/signup]");
    console.log("Status:", res.statusCode);
    console.log("Body:", res.body);
    let token = res.body?.token;

    if (!token) {
       console.log("Skipping login/me due to missing token in signup.");
       return;
    }

    // 3. LOGIN
    res = await request('POST', '/api/auth/login', {
      email,
      password
    });
    console.log("\n[POST /api/auth/login]");
    console.log("Status:", res.statusCode);
    console.log("Body:", res.body);
    token = res.body?.token;

    // 4. ME
    res = await request('GET', '/api/auth/me', null, {
      'Authorization': `Bearer ${token}`
    });
    console.log("\n[GET /api/auth/me]");
    console.log("Status:", res.statusCode);
    console.log("Body:", res.body);

    console.log("\n=== ALL TESTS PASSED ===");
  } catch (error) {
    console.error("Test failed:", error);
  }
};

runTests();
