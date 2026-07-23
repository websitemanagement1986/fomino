/**
 * Print Hostinger-safe base64 env value for the partner private key.
 * Run: node scripts/print-paymate-private-key-env.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const keyPath = path.join(__dirname, '..', 'ssl-pg-partner', 'partner_private.pem');
const pem = fs.readFileSync(keyPath, 'utf8');
crypto.createPrivateKey(pem);

const b64 = Buffer.from(pem, 'utf8').toString('base64');

console.log('Recommended for Hostinger (avoids newline/base64 corruption):\n');
console.log('Env name: PAYMATE_PARTNER_PRIVATE_KEY_B64');
console.log('Env value length:', b64.length, 'characters\n');
console.log(b64);
