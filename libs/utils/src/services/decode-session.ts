import { Request } from 'express';
import extractTokenFromHeader from './extract-token-from-header';
import { decode as jwtDecode } from 'jsonwebtoken';

interface JWTData {
  sub: string;
  thonLabsUser: boolean;
  active: boolean;
  environmentId: string;
  environmentKey: string;
  roleId: string;
  iat: number;
  exp: number;
}

export default function decodeSession(req: Request): JWTData {
  const token = extractTokenFromHeader(req);
  const data = jwtDecode(token) as JWTData;

  return data;
}
