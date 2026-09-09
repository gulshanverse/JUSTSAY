import * as http from 'http';
import { JustSayApiServer } from '../main';

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function getClientIp(req: http.IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function getAuthHeader(req: http.IncomingMessage): string {
  const auth = req.headers['authorization'];
  if (typeof auth === 'string') return auth;
  if (Array.isArray(auth)) return auth[0];
  return '';
}

function mapErrorToStatusCode(errorMsg?: string, defaultCode: number = 400): number {
  if (!errorMsg) return defaultCode;
  const lower = errorMsg.toLowerCase();
  if (lower.includes('unauthorized') || lower.includes('session invalid') || lower.includes('session expired')) {
    return 401;
  }
  if (lower.includes('forbidden') || lower.includes('permission') || lower.includes('do not own')) {
    return 403;
  }
  if (lower.includes('not found') || lower.includes('not exist')) {
    return 404;
  }
  if (lower.includes('too many') || lower.includes('rate limit')) {
    return 429;
  }
  return defaultCode;
}

export async function routeHttpRequest(
  apiServer: JustSayApiServer,
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const clientIp = getClientIp(req);
  const authHeader = getAuthHeader(req);
  const host = req.headers.host || 'localhost';
  const urlObj = new URL(req.url || '/', `http://${host}`);
  const pathName = urlObj.pathname;
  const method = (req.method || 'GET').toUpperCase();

  try {
    // 1. Health & Server Metadata Routes
    if (pathName === '/health' || pathName === '/api/v1/health' || pathName === '/api/v1/health/liveness') {
      return sendJson(res, 200, apiServer.prodHealthController.getLiveness());
    }

    if (pathName === '/api/v1/health/readiness') {
      const readiness = apiServer.prodHealthController.getReadiness();
      const code = readiness.status === 'NOT_READY' ? 503 : 200;
      return sendJson(res, code, readiness);
    }

    if (pathName === '/' || pathName === '/api/v1') {
      return sendJson(res, 200, apiServer.getStatus());
    }

    // 2. Authentication Routes (/api/v1/auth/*)
    if (pathName === '/api/v1/auth/register' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await apiServer.authController.register(body, clientIp);
      const code = result.success ? 201 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/auth/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await apiServer.authController.login(body, clientIp);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 401);
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/auth/logout' && method === 'POST') {
      const result = await apiServer.authController.logout(authHeader);
      const code = result.success ? 200 : 401;
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/auth/me' && method === 'GET') {
      const result = await apiServer.authController.getCurrentUser(authHeader);
      const code = result.authenticated ? 200 : 401;
      return sendJson(res, code, result);
    }

    // 3. Handle Availability Routes (/api/v1/handles/*)
    if (pathName.startsWith('/api/v1/handles/check') && method === 'GET') {
      let handle = pathName.replace('/api/v1/handles/check', '').replace(/^\//, '');
      if (!handle) handle = urlObj.searchParams.get('handle') || '';
      const result = await apiServer.handlesController.checkHandle(handle, clientIp);
      return sendJson(res, 200, result);
    }

    // 4. Users & Profile Routes (/api/v1/users/*)
    if (pathName.startsWith('/api/v1/users/profile/') && method === 'GET') {
      const handle = pathName.replace('/api/v1/users/profile/', '');
      const profile = await apiServer.usersController.getPublicProfile(handle);
      if (!profile) {
        return sendJson(res, 404, { success: false, error: 'User profile not found or private' });
      }
      return sendJson(res, 200, { success: true, profile });
    }

    if (pathName === '/api/v1/users/profile' && (method === 'PUT' || method === 'PATCH')) {
      const body = await parseJsonBody(req);
      const result = await apiServer.usersController.updateProfile(authHeader, body);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/users/push-token' && method === 'POST') {
      const body = await parseJsonBody(req);
      const token = body.deviceToken || body.token || '';
      const platform = body.platform || 'android';
      const result = await apiServer.usersController.registerPushToken(authHeader, token, platform);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/users/push-token' && method === 'DELETE') {
      const body = await parseJsonBody(req);
      const token = body.deviceToken || body.token || '';
      const result = await apiServer.usersController.revokePushToken(authHeader, token);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/users/account' && method === 'DELETE') {
      const result = await apiServer.usersController.deleteAccount(authHeader);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    // 5. Messages Routes (/api/v1/messages/*)
    if (pathName === '/api/v1/messages' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await apiServer.messagesController.postMessage(body, clientIp);
      const code = result.success ? 201 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/messages/inbox' && method === 'GET') {
      const filter = urlObj.searchParams.get('filter') || undefined;
      const result = await apiServer.messagesController.getInbox(authHeader, filter);
      return sendJson(res, 200, result);
    }

    if (pathName.startsWith('/api/v1/messages/') && method === 'POST') {
      const subPath = pathName.replace('/api/v1/messages/', '');
      const parts = subPath.split('/');
      const msgId = parts[0];
      const action = parts[1];
      const body = await parseJsonBody(req);

      if (action === 'reply') {
        const result = await apiServer.messagesController.replyToMessage(authHeader, msgId, body.replyText);
        const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
        return sendJson(res, code, result);
      }
      if (action === 'react') {
        const result = await apiServer.messagesController.reactToMessage(authHeader, msgId, body.emoji);
        const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
        return sendJson(res, code, result);
      }
      if (action === 'favorite') {
        const result = await apiServer.messagesController.toggleFavorite(authHeader, msgId);
        const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
        return sendJson(res, code, result);
      }
      if (action === 'read') {
        const result = await apiServer.messagesController.markAsRead(authHeader, msgId);
        const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
        return sendJson(res, code, result);
      }
      if (action === 'report') {
        const result = await apiServer.messagesController.reportMessage(authHeader, msgId, body.reason || 'User report');
        const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
        return sendJson(res, code, result);
      }
      if (action === 'block') {
        const result = await apiServer.messagesController.blockSenderFromMessage(authHeader, msgId);
        const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
        return sendJson(res, code, result);
      }
    }

    if (pathName.startsWith('/api/v1/messages/') && method === 'DELETE') {
      const msgId = pathName.replace('/api/v1/messages/', '');
      const result = await apiServer.messagesController.deleteMessage(authHeader, msgId);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    // 6. Media Routes (/api/v1/media/*)
    if (pathName === '/api/v1/media/upload' && method === 'POST') {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendJson(res, 401, { success: false, error: 'Unauthorized' });
      }
      const token = authHeader.replace('Bearer ', '').trim();
      const session = await apiServer.authService.getSession(token);
      if (!session) {
        return sendJson(res, 401, { success: false, error: 'Session invalid or expired' });
      }
      const body = await parseJsonBody(req);
      const result = await apiServer.mediaStorageService.uploadMedia(session.user.handle, body);
      const code = result.success ? 201 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName.startsWith('/api/v1/media/') && method === 'GET') {
      const assetId = pathName.replace('/api/v1/media/', '');
      const asset = await apiServer.mediaStorageService.getAsset(assetId);
      if (!asset) {
        return sendJson(res, 404, { success: false, error: 'Media asset not found' });
      }
      return sendJson(res, 200, { success: true, asset });
    }

    // 7. Cards Routes (/api/v1/cards/*)
    if (pathName === '/api/v1/cards/templates' && method === 'GET') {
      const result = await apiServer.cardsController.getTemplates();
      return sendJson(res, 200, result);
    }

    if (pathName === '/api/v1/cards/stickers' && method === 'GET') {
      const result = await apiServer.cardsController.getStickers();
      return sendJson(res, 200, result);
    }

    if (pathName === '/api/v1/cards/projects' && method === 'GET') {
      const result = await apiServer.cardsController.listProjects(authHeader);
      return sendJson(res, 200, result);
    }

    if (pathName === '/api/v1/cards/projects' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await apiServer.cardsController.createProject(authHeader, body);
      const code = result.success ? 201 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName.startsWith('/api/v1/cards/projects/') && method === 'GET') {
      const projectId = pathName.replace('/api/v1/cards/projects/', '');
      const result = await apiServer.cardsController.getProject(authHeader, projectId);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName.startsWith('/api/v1/cards/projects/') && method === 'PUT') {
      const projectId = pathName.replace('/api/v1/cards/projects/', '');
      const body = await parseJsonBody(req);
      const result = await apiServer.cardsController.updateProject(authHeader, projectId, body);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName.startsWith('/api/v1/cards/projects/') && method === 'DELETE') {
      const projectId = pathName.replace('/api/v1/cards/projects/', '');
      const result = await apiServer.cardsController.deleteProject(authHeader, projectId);
      const code = result.success ? 200 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/cards/from-message' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await apiServer.cardsController.createCardFromMessage(authHeader, body);
      const code = result.success ? 201 : mapErrorToStatusCode(result.error, 400);
      return sendJson(res, code, result);
    }

    // 8. Admin Routes (/api/v1/admin/*)
    if (pathName === '/api/v1/admin/auth/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await apiServer.adminController.loginAdmin(body);
      const code = result.authenticated ? 200 : 401;
      return sendJson(res, code, result);
    }

    if (pathName === '/api/v1/admin/health' && method === 'GET') {
      const result = apiServer.adminController.getSystemHealth();
      return sendJson(res, 200, result);
    }

    if (pathName === '/api/v1/admin/moderation/queue' && method === 'GET') {
      const adminToken = (req.headers['x-admin-token'] as string) || '';
      const authResult = await apiServer.adminController.loginAdmin({ authToken: adminToken });
      if (!authResult.authenticated) {
        return sendJson(res, 401, { success: false, error: 'Unauthorized admin access' });
      }
      try {
        const queue = apiServer.adminController.getModerationQueue(authResult.role);
        return sendJson(res, 200, { success: true, queue });
      } catch (err: any) {
        return sendJson(res, 403, { success: false, error: err.message });
      }
    }

    if (pathName === '/api/v1/admin/moderation/action' && method === 'POST') {
      const body = await parseJsonBody(req);
      const adminToken = (req.headers['x-admin-token'] as string) || body.adminToken || '';
      const authResult = await apiServer.adminController.loginAdmin({ authToken: adminToken });
      if (!authResult.authenticated) {
        return sendJson(res, 401, { success: false, error: 'Unauthorized admin access' });
      }
      try {
        const item = apiServer.adminController.actOnModerationItem(authResult.role, 'admin', body.id, body.action);
        return sendJson(res, 200, { success: true, item });
      } catch (err: any) {
        const code = mapErrorToStatusCode(err.message, 400);
        return sendJson(res, code, { success: false, error: err.message });
      }
    }

    if (pathName === '/api/v1/admin/users/action' && method === 'POST') {
      const body = await parseJsonBody(req);
      const adminToken = (req.headers['x-admin-token'] as string) || body.adminToken || '';
      const authResult = await apiServer.adminController.loginAdmin({ authToken: adminToken });
      if (!authResult.authenticated) {
        return sendJson(res, 401, { success: false, error: 'Unauthorized admin access' });
      }
      try {
        const result = apiServer.adminController.performUserAction(authResult.role, 'admin', body.targetHandle, body.action);
        return sendJson(res, 200, result);
      } catch (err: any) {
        const code = mapErrorToStatusCode(err.message, 400);
        return sendJson(res, code, { success: false, error: err.message });
      }
    }

    // 404 Route Not Found
    return sendJson(res, 404, { error: 'Not Found', path: pathName });
  } catch (err: any) {
    return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
  }
}
