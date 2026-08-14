import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { DB } from './db';
import { AdminAuditLog, AnomalyLog } from '../src/types/game';

// DOMPurify setup for server-side HTML sanitization
const dom = new JSDOM('');
// @ts-ignore
export const purify = DOMPurify(dom.window);

export function logAudit(
  adminId: string,
  adminEmail: string,
  action: string,
  targetId?: string,
  before?: unknown,
  after?: unknown,
  ip: string = '127.0.0.1'
): void {
  const auditLog: AdminAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    adminId,
    adminEmail,
    action,
    targetId,
    beforeState: before ? JSON.stringify(before) : undefined,
    afterState: after ? JSON.stringify(after) : undefined,
    ipAddress: ip,
    createdAt: new Date().toISOString(),
  };
  DB.adminAuditLogs.unshift(auditLog);
}

export function logAnomaly(
  accountId: string,
  type: string,
  payload: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'high'
): void {
  const anomalyLog: AnomalyLog = {
    id: `anom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    accountId,
    type,
    payload,
    severity,
    createdAt: new Date().toISOString(),
  };
  DB.anomalyLogs.unshift(anomalyLog);
}

export function corsAndNonceMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Nonce');
  res.setHeader('Access-Control-Expose-Headers', 'X-Next-Nonce, X-Request-Id');

  // Generate cryptographically secure nonce
  const nextNonce = crypto.randomBytes(16).toString('hex');
  res.setHeader('X-Next-Nonce', nextNonce);

  // Maintenance mode check
  if (DB.maintenanceMode && !req.path.startsWith('/api/admin') && !req.path.startsWith('/api/auth')) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.includes('GM_TOKEN')) {
      res.status(503).json({ error: 'Server is currently undergoing scheduled maintenance.' });
      return;
    }
  }

  next();
}
