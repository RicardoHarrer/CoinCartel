import crypto from 'crypto';

let cachedKey = null;

function getKey() {
  if (cachedKey) return cachedKey;

  const hex = process.env.TOKEN_ENC_KEY_HEX;

  if (!hex) {
    throw new Error('❌ TOKEN_ENC_KEY_HEX is undefined. ENV not loaded.');
  }

  const key = Buffer.from(hex, 'hex');

  if (key.length !== 32) {
    throw new Error('❌ TOKEN_ENC_KEY_HEX must be 64 hex characters');
  }

  cachedKey = key;
  return cachedKey;
}

export function encryptToken(token) {
  const key = getKey();

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptToken(blob) {
  const key = getKey();

  const raw = Buffer.from(blob, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(data),
    decipher.final(),
  ]).toString('utf8');
}
