export const RedisKeys = {
  session: (userId: string) => `session:${userId}`,
  authKey: (userId: string) => `auth_key:${userId}`,
} as const;
