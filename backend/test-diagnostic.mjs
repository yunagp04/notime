#!/usr/bin/env node

// Simple diagnostic test to check what's failing
import fetch from 'node-fetch';
import childProcess from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🧪 Starting diagnostic tests...\n");

// Start the server
const serverProcess = childProcess.spawn('node', ['src/index.js'], {
  cwd: __dirname,
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
serverProcess.stdout.on('data', (data) => {
  serverOutput += data.toString();
  console.log("[Server] " + data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  serverOutput += data.toString();
  console.log("[Server Error] " + data.toString().trim());
});

// Wait for server to start
setTimeout(async () => {
  try {
    console.log("\n✅ Testing /api/lists/test/health...");
   let res = await fetch('http://localhost:8080/api/lists/test/health');
    let data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    console.log("\n✅ Testing /api/lists/test/mock-lists...");
    res = await fetch('http://localhost:8080/api/lists/test/mock-lists');
    data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    console.log("\n✅ Testing /api/lists (real endpoint)...");
    res = await fetch('http://localhost:8080/api/lists', {
      headers: { 'X-Ms-Client-Principal-Id': 'test-user-123' }
    });
    console.log("Status:", res.status);
    data = await res.text();
    console.log("Response:", data);
    
  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
  
  serverProcess.kill();
  process.exit(0);
}, 3000);

setTimeout(() => {
  serverProcess.kill();
  process.exit(1);
}, 15000);
