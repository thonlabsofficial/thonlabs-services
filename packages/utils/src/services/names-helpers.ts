export function getFirstName(fullName: string) {
  return fullName?.split(' ')?.[0] || '';
}

export function getInitials(fullName: string) {
  const splittedName = fullName.split(' ');
  return `${splittedName[0]?.charAt(0) || ''}${splittedName[splittedName.length - 1]?.charAt(0) || ''}`;
}
