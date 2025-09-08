// Simple validation script to check if white screen is fixed
const https = require('https');
const http = require('http');

console.log('🔍 Validating white screen fix...');

// Test basic page load
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // Check if HTML contains expected elements
    const checks = {
      'Has HTML structure': data.includes('<html'),
      'Has React root': data.includes('id="root"'),
      'Has title': data.includes('<title>VUE Dashboard</title>'),
      'Has bundle script': data.includes('bundle.js'),
      'Has proper DOCTYPE': data.includes('<!DOCTYPE html>')
    };
    
    console.log('\n📋 Page Structure Validation:');
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });
    
    // Quick content analysis
    console.log(`\n📊 Page Statistics:`);
    console.log(`- HTML Size: ${data.length} characters`);
    console.log(`- Contains "root": ${data.includes('root')}`);
    console.log(`- Contains script tags: ${(data.match(/<script/g) || []).length}`);
    
    if (res.statusCode === 200 && data.includes('id="root"')) {
      console.log('\n🎉 White screen fix validation: LIKELY SUCCESSFUL');
      console.log('Next step: Check http://localhost:3000 in browser');
    } else {
      console.log('\n❌ White screen issue may persist');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
});

req.end();