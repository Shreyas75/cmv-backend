/**
 * Encryption Service for PAN (Permanent Account Number)
 * 
 * Provides reversible AES-256 encryption/decryption for sensitive PAN data.
 * Uses Node.js built-in crypto module with CBC mode and random IV.
 * 
 * IMPORTANT: Encryption key must be 32 bytes (256 bits) for AES-256.
 * Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.encoding = 'hex';
    this.encryptionEnabled = process.env.PAN_ENCRYPTION_ENABLED === 'true';
    
    // Get encryption key from environment
    this.encryptionKey = this.getEncryptionKey();
  }

  /**
   * Get encryption key from environment variable
   * @returns {Buffer} 32-byte encryption key or null if not configured
   */
  getEncryptionKey() {
    try {
      if (!process.env.ENCRYPTION_KEY) {
        logger.warn('ENCRYPTION_KEY not found in environment. PAN encryption disabled.');
        return null;
      }

      // Decode base64 key to buffer
      const keyBuffer = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
      
      // Validate key length (must be 32 bytes for AES-256)
      if (keyBuffer.length !== 32) {
        logger.error(
          `Invalid ENCRYPTION_KEY length: ${keyBuffer.length} bytes. ` +
          `AES-256 requires exactly 32 bytes (256 bits).`
        );
        return null;
      }

      return keyBuffer;
    } catch (error) {
      logger.error('Error loading encryption key:', error.message);
      return null;
    }
  }

  /**
   * Encrypt PAN using AES-256-CBC
   * @param {string} plainPAN - Plain text PAN (e.g., "ABCDE1234F")
   * @returns {string|null} Encrypted PAN in format "iv:ciphertext" or null if encryption disabled
   */
  encryptPAN(plainPAN) {
    // If encryption not enabled or key not set, return plain text (backward compat)
    if (!this.encryptionEnabled || !this.encryptionKey) {
      return plainPAN;
    }

    try {
      if (!plainPAN) {
        return null;
      }

      // Generate random IV (initialization vector)
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt PAN
      let encrypted = cipher.update(plainPAN, 'utf8', this.encoding);
      encrypted += cipher.final(this.encoding);

      // Return IV + encrypted data (IV doesn't need to be secret, just unique per encryption)
      return `${iv.toString(this.encoding)}:${encrypted}`;
    } catch (error) {
      logger.error('PAN encryption error:', error.message);
      return plainPAN; // Fallback: return plain text
    }
  }

  /**
   * Decrypt PAN using AES-256-CBC
   * @param {string} encryptedPAN - Encrypted PAN in format "iv:ciphertext"
   * @returns {string|null} Decrypted PAN or null if decryption fails
   */
  decryptPAN(encryptedPAN) {
    // If encryption not enabled, assume it's plain text
    if (!this.encryptionEnabled || !this.encryptionKey) {
      return encryptedPAN;
    }

    try {
      if (!encryptedPAN) {
        return null;
      }

      // Check if it's encrypted format (contains ':')
      if (!encryptedPAN.includes(':')) {
        // Old hashed PAN or plain text - can't decrypt
        return null;
      }

      // Split IV and ciphertext
      const [ivHex, ciphertext] = encryptedPAN.split(':');
      const iv = Buffer.from(ivHex, this.encoding);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

      // Decrypt PAN
      let decrypted = decipher.update(ciphertext, this.encoding, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('PAN decryption error:', error.message);
      return null;
    }
  }

  /**
   * Mask PAN for display (show only last 4 characters)
   * @param {string} pan - PAN to mask (plain or decrypted)
   * @returns {string} Masked PAN (e.g., "XXXXXX1234F")
   */
  maskPAN(pan) {
    if (!pan || pan.length < 4) {
      return 'XXXXXX****';
    }

    const lastFour = pan.slice(-4);
    return `XXXXXX${lastFour}`;
  }

  /**
   * Check if a string is an encrypted PAN (has iv:ciphertext format)
   * @param {string} value - Value to check
   * @returns {boolean} True if appears to be encrypted PAN
   */
  isEncryptedPAN(value) {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // Check for "iv:ciphertext" format
    const parts = value.split(':');
    return parts.length === 2 && parts[0].length === 32 && parts[1].length > 0;
  }

  /**
   * Get encryption status for logging/debugging
   * @returns {Object} Encryption configuration status
   */
  getStatus() {
    return {
      encryptionEnabled: this.encryptionEnabled,
      keyConfigured: !!this.encryptionKey,
      algorithm: this.algorithm,
      keyLength: this.encryptionKey ? this.encryptionKey.length : 0,
    };
  }
}

// Export singleton instance
module.exports = new EncryptionService();
