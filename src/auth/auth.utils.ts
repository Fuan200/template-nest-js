import 'dotenv/config';
import { createHmac } from 'node:crypto';
import { compare, hash } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPasswordHashed(
  storedHash: string,
  password: string,
): Promise<boolean> {
  return compare(password, storedHash);
}

export function signJwt(payload: Record<string, unknown>): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-me';
  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresInSeconds = 60 * 60;

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode({
    ...payload,
    iat: issuedAt,
    exp: issuedAt + expiresInSeconds,
  });
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');

  return `${data}.${signature}`;
}

function base64UrlEncode(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}
