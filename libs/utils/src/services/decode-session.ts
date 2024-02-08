import { Request } from 'express';
import extractTokenFromHeader from '@/utils/services/extract-token-from-header';
import { decode as jwtDecode } from 'jsonwebtoken';
import { SessionData } from '@/utils/interfaces/session-data';

export default function decodeSession(req: Request): SessionData {
  const token = extractTokenFromHeader(req);
  const data = jwtDecode(token) as SessionData;

  return data;
}
