import { createCipheriv, createDecipheriv, scrypt, createHash } from 'crypto';
import { promisify } from 'util';
import * as bcrypt from 'bcrypt';

function generateIV(key: string) {
  return createHash('sha512')
    .update(key.split('').reverse().join(''))
    .digest('hex')
    .substring(0, 16);
}

async function encrypt(textToEncrypt: string, iv: string, password: string) {
  const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
  const cipher = createCipheriv('aes-256-ctr', key, iv);

  const encryptedText = Buffer.concat([
    cipher.update(textToEncrypt),
    cipher.final(),
  ]);

  return encryptedText.toString('base64');
}

async function decrypt(encryptedText: string, iv: string, password: string) {
  const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
  const decipher = createDecipheriv('aes-256-ctr', key, iv);
  const decryptedText = Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64')),
    decipher.final(),
  ]);

  return decryptedText.toString('utf-8');
}

async function hash(textToHash: string, rounds = 10) {
  return await bcrypt.hash(textToHash, rounds);
}

/**
 * Decrypts a data value in the database if it is encrypted.
 *
 * @param {string} key - The key of the data.
 * @param {any} value - The value of the data.
 * @returns {any} - The decrypted value or the original value if not encrypted.
 */
async function parseEncryptedValue(key: string, value: any) {
  if (typeof value === 'string' && value.startsWith('ev:')) {
    const decryptedValue = await decrypt(
      value.replace('ev:', ''),
      generateIV(key),
      process.env.ENCODE_SECRET,
    );

    return JSON.parse(decryptedValue);
  }

  return value;
}

const Crypt = {
  encrypt,
  decrypt,
  generateIV,
  hash,
  parseEncryptedValue,
};

export default Crypt;
