import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  async onModuleInit(): Promise<void> {
    await this.createConnection();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.logger.log('Closing Redis connection...');
      await this.client.quit();
    }
  }

  private async createConnection(): Promise<void> {
    try {
      this.client = new Redis(`${process.env.REDIS_URL}?family=0`);

      this.setupEventListeners();
      await this.client.ping();
      this.logger.log('Redis connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client is ready');
    });

    this.client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.client.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      this.logger.log('Reconnecting to Redis...');
    });
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }

    return this.client;
  }

  async set(
    key: string,
    value: string | object,
    ttlInSeconds?: number,
  ): Promise<void> {
    const serializedValue =
      typeof value === 'object' ? JSON.stringify(value) : value;

    this.logger.debug(`Setting value in Redis (key: ${key})`);

    if (ttlInSeconds) {
      await this.client.setex(key, ttlInSeconds, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async get<T = string>(key: string, parseJson = false): Promise<T | null> {
    const value = await this.client.get(key);

    this.logger.debug(`Getting value from Redis (key: ${key})`);

    if (value === null) {
      return null;
    }

    if (parseJson) {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    }

    return value as T;
  }

  async delete(...keys: string[]): Promise<number> {
    this.logger.debug(`Deleting value from Redis (keys: ${keys.join(', ')})`);
    return await this.client.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async tryLock(
    key: string,
    value: string | object,
    ttlInSeconds: number,
  ): Promise<boolean> {
    const serializedValue =
      typeof value === 'object' ? JSON.stringify(value) : value;

    // This is atomic - either succeeds completely or fails completely
    const result = await this.client.set(
      key,
      serializedValue,
      'EX',
      ttlInSeconds,
      'NX',
    );
    return result === 'OK';
  }

  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
