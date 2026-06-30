import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export const JWT_SECRET = process.env.JWT_SECRET || 'mestrelo-dev-secret-troque-em-producao';
export const JWT_EXPIRES_IN = '30d';
export const COOKIE_NAME = 'mestrelo_token';

// ── Cookie parser (sem dependência extra) ────────────────────────────────────
export function parseCookies(cookieHeader: string = ''): Record<string, string> {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => c.trim().split('=').map(decodeURIComponent))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k.trim(), v.trim()])
  );
}

// ── Middleware de autenticação via httpOnly cookie ────────────────────────────
export function authenticateToken(req: any, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Não autenticado.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.profissionalId = payload.profissionalId;
    req.profissional = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
}

// ── Setar cookie de auth (httpOnly, 30 dias) ─────────────────────────────────
export function setAuthCookie(res: Response, profissionalId: string, profissional: any): string {
  const token = jwt.sign(
    {
      profissionalId,
      phone: profissional.phone,
      name: profissional.name,
      slug: profissional.slug,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  const secure = '; Secure';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=None; Max-Age=${30 * 24 * 60 * 60}${secure}`
  );
  return token;
}

// ── Admin auth constants & middleware ────────────────────────────────────────
export const ADMIN_COOKIE = 'mestrelo_admin';
export const ADMIN_SECRET = JWT_SECRET + '_admin';

// Simples rate limiter em memória por IP (substituir por Redis em produção)
const adminLoginAttempts = new Map<string, { count: number; resetAt: number }>();

export function adminRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = (req as any).ip || (req.socket?.remoteAddress) || 'unknown';
  const now = Date.now();
  const entry = adminLoginAttempts.get(ip);
  if (entry && now < entry.resetAt && entry.count >= 5) {
    return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
  }
  if (!entry || now >= entry.resetAt) {
    adminLoginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    entry.count++;
  }
  next();
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[ADMIN_COOKIE];
  if (!token) return res.status(401).json({ error: 'Admin não autenticado.' });
  try {
    jwt.verify(token, ADMIN_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão admin expirada.' });
  }
}
