import { ErrorCodes } from '@/utils/enums/errors-metadata';

export interface DataReturn<T = null> {
  statusCode?: number;
  code?: ErrorCodes;
  error?: string;
  data?: T;
}
