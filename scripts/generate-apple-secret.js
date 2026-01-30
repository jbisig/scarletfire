#!/usr/bin/env node

/**
 * Generates an Apple client secret for Supabase Apple Sign-In
 *
 * Usage:
 *   node scripts/generate-apple-secret.js \
 *     --key-id YOUR_KEY_ID \
 *     --team-id YOUR_TEAM_ID \
 *     --client-id com.scarletfire.app.auth \
 *     --private-key-path /path/to/AuthKey.p8
 */

const fs = require('fs');
const jwt = require('jsonwebtoken');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index !== -1 ? args[index + 1] : null;
};

const keyId = getArg('--key-id');
const teamId = getArg('--team-id');
const clientId = getArg('--client-id') || 'com.scarletfire.app.auth';
const privateKeyPath = getArg('--private-key-path');

if (!keyId || !teamId || !privateKeyPath) {
  console.error('Usage: node generate-apple-secret.js --key-id KEY_ID --team-id TEAM_ID --private-key-path /path/to/key.p8');
  console.error('\nRequired arguments:');
  console.error('  --key-id           Your Apple Key ID (10 characters)');
  console.error('  --team-id          Your Apple Team ID');
  console.error('  --private-key-path Path to your .p8 private key file');
  console.error('\nOptional arguments:');
  console.error('  --client-id        Service ID (default: com.scarletfire.app.auth)');
  process.exit(1);
}

// Read the private key
let privateKey;
try {
  privateKey = fs.readFileSync(privateKeyPath, 'utf8');
} catch (err) {
  console.error(`Error reading private key file: ${err.message}`);
  process.exit(1);
}

// Generate the JWT (valid for 6 months - maximum allowed by Apple)
const now = Math.floor(Date.now() / 1000);
const expiry = now + (86400 * 180); // 180 days

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: teamId,
  subject: clientId,
  keyid: keyId,
});

console.log('\n=== Apple Client Secret ===\n');
console.log(token);
console.log('\n=== Instructions ===');
console.log('1. Copy the entire token above');
console.log('2. Paste it into the "Secret Key" field in Supabase');
console.log(`3. This secret expires in 180 days (${new Date(expiry * 1000).toLocaleDateString()})`);
console.log('');
