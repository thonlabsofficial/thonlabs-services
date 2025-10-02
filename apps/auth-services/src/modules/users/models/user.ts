import { User } from '@prisma/client';

export interface UserDetails extends User {
  metadata: Record<string, any>;
}
