import { createCipheriv, createDecipheriv, scrypt, createHash } from 'crypto';
import { promisify } from 'util';
import * as bcrypt from 'bcrypt';

function generateIV(key: string) {
  return createHash('sha512').update(key).digest('hex').substring(0, 16);
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

const Crypt = {
  encrypt,
  decrypt,
  generateIV,
  hash,
};

export default Crypt;
