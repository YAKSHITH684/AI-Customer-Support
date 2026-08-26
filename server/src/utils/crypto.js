const crypto = require('crypto');
const config = require('../config/env');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Derive a 32-byte key from the configured encryption key
const getKey = () => {
  const secret = config.CREDENTIAL_ENCRYPTION_KEY || 'resolveflow_default_32byte_secret!!';
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypt sensitive credentials (e.g. OAuth tokens)
 * @param {string|object} data 
 * @returns {string} iv:authTag:encryptedHex
 */
const encrypt = (data) => {
  if (!data) return null;
  const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt sensitive credentials
 * @param {string} encryptedPayload 
 * @returns {string|object}
 */
const decrypt = (encryptedPayload) => {
  if (!encryptedPayload) return null;
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      // Fallback for simple hex/legacy if any
      return null;
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null;
  }
};

module.exports = {
  encrypt,
  decrypt
};
