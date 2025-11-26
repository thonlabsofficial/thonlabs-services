export const RedisKeys = {
  session: (userId: string) => `session:${userId}`,
} as const;
