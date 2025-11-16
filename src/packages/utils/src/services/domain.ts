export function getRootDomain(domain: string) {
  if (!domain) {
    return '';
  }

  if (domain.includes('http') || domain.includes('/')) {
    throw new Error('Invalid domain');
  }

  const parts = domain.split('.');

  if (parts.length <= 2) {
    return domain;
  }

  return parts.slice(-2).join('.');
}
