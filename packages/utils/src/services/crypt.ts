import {
  createCipheriv,
  createDecipheriv,
  scrypt,
  randomBytes,
  createHmac,
} from 'node:crypto';
import { promisify } from 'node:util';
import * as bcrypt from 'bcrypt';

async function encrypt(textToEncrypt: string, password: string) {
  const salt = randomBytes(16).toString('hex');

  const key = (await promisify(scrypt)(password, salt, 32)) as Buffer;

  const iv = randomBytes(16);

  const cipher = createCipheriv('aes-256-ctr', key, iv);

  const encryptedText = Buffer.concat([
    cipher.update(textToEncrypt),
    cipher.final(),
  ]);

  return `${salt}:${iv.toString('hex')}:${encryptedText.toString('base64')}`;
}

async function decrypt(encryptedData: string, password: string) {
  const [salt, ivHex, encryptedBase64] = encryptedData.split(':');

  const key = (await promisify(scrypt)(password, salt, 32)) as Buffer;

  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(encryptedBase64, 'base64');

  const decipher = createDecipheriv('aes-256-ctr', key, iv);
  const decryptedText = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decryptedText.toString('utf-8');
}

async function hash(textToHash: string, rounds?: number) {
  const safeRounds = Math.max(rounds, 13);

  if (safeRounds < 10) {
    throw new Error('Bcrypt rounds must be at least 10');
  }

  return await bcrypt.hash(textToHash, safeRounds);
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
      process.env.ENCODE_SECRET,
    );

    return JSON.parse(decryptedValue);
  }

  return value;
}

function hash256(text: string, secret: string): string {
  return createHmac('sha256', secret).update(text).digest('hex');
}

const Crypt = {
  encrypt,
  decrypt,
  hash,
  parseEncryptedValue,
  hash256,
};

export default Crypt;
