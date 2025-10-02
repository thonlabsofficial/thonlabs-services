import { User } from '@prisma/client';

export interface UserDetails extends User {
  firstName: string;
  initials: string;
  metadata: Record<string, any>;
}
