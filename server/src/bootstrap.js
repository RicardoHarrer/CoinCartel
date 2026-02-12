import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

if (!process.env.TOKEN_ENC_KEY_HEX) {
  console.error('❌ TOKEN_ENC_KEY_HEX NOT LOADED');
  process.exit(1);
}

import('./app.js');
