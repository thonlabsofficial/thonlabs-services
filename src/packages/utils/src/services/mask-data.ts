/**
 * Enum for mask data types.
 */
export enum MaskDataTypes {
  Email = 'email',
}

/**
 * Masks sensitive data for logs.
 *
 * @param {MaskDataTypes} type - The type of data to mask.
 * @param {string} data - The data to be masked.
 * @returns {string} - The masked data.
 */
export function maskData(type: MaskDataTypes, data: string): string {
  switch (type) {
    case MaskDataTypes.Email:
      return maskEmail(data);
    default:
      throw new Error(`Unsupported log type: ${type}`);
  }
}

/**
 * Masks an email address by replacing part of it with asterisks.
 *
 * @param {string} email - The email address to mask.
 * @returns {string} - The masked email address.
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    throw new Error('Invalid email format');
  }

  const visibleChars = Math.min(3, Math.floor(localPart.length / 2));
  const maskedLocalPart = `${localPart.slice(0, visibleChars)}${'*'.repeat(5)}${localPart.slice(-visibleChars)}`;

  return `${maskedLocalPart}@${domain}`;
}
