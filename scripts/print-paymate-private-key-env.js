/**
 * Print a Hostinger-safe single-line PAYMATE_PARTNER_PRIVATE_KEY value.
 * Run: node scripts/print-paymate-private-key-env.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const keyPath = path.join(__dirname, '..', 'ssl-pg-partner', 'partner_private.pem');
const pem = fs.readFileSync(keyPath, 'utf8');
crypto.createPrivateKey(pem);

const oneLine = pem.trim().replace(/\r\n/g, '\n').replace(/\n/g, '\\n');
console.log('Copy this entire line into Hostinger env var PAYMATE_PARTNER_PRIVATE_KEY:\n');
console.log(oneLine);
