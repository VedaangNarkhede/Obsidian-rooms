import crypto from 'crypto';

// The key must be exactly 32 bytes (256 bits) for AES-256
// We expect MASTER_KEY in .env to be a 64-character hex string (which decodes to 32 bytes)
const getKey = (): Buffer => {
    const hexKey = process.env.MASTER_KEY || '';
    if (hexKey.length !== 64) {
        throw new Error('MASTER_KEY must be exactly a 64-character hex string.');
    }
    return Buffer.from(hexKey, 'hex');
};

/**
 * Encrypts a string using AES-256-GCM.
 * Returns the format: iv(hex):authTag(hex):encryptedData(hex)
 */
export function encryptNote(text: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(12); // 96-bit IV is standard for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a string formatted as iv(hex):authTag(hex):encryptedData(hex) using AES-256-GCM.
 */
export function decryptNote(ciphertext: string): string {
    const key = getKey();
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format. Expected iv:authTag:encryptedData');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}
