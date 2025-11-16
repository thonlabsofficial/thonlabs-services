import { Request } from 'express';
import extractTokenFromHeader from './extract-token-from-header';
import { decode as jwtDecode } from 'jsonwebtoken';
import { SessionData } from '../interfaces/session-data';

export default function decodeSession(req: Request): SessionData {
  const token = extractTokenFromHeader(req);
  const data = jwtDecode(token) as SessionData;

  return data;
}
