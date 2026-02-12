import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const allowInsecureTls = ['true', '1', 'yes'].includes(
  (process.env.ALLOW_INSECURE_TLS || '').trim().toLowerCase(),
);

if (allowInsecureTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('WARNING: TLS certificate verification is globally disabled (dev mode).');
}

if (!process.env.TOKEN_ENC_KEY_HEX) {
  console.error('❌ TOKEN_ENC_KEY_HEX NOT LOADED');
  process.exit(1);
}

import('./app.js');
