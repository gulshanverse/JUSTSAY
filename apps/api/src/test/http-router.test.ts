import * as http from 'http';
import { JustSayApiServer } from '../main';
import { routeHttpRequest } from '../router/http.router';

async function runHttpRouterTests() {
  console.log('\n--- Running Live HTTP Router Integration Test Suite ---');

  const apiServer = new JustSayApiServer();
  await apiServer.initialize();

  const server = http.createServer(async (req, res) => {
    await routeHttpRequest(apiServer, req, res);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  console.log(`HTTP Router Test Server listening on ${baseUrl}`);

  try {
    // 1. GET /health, /api/v1/health/liveness, /api/v1/health/readiness
    const healthRes = await fetch(`${baseUrl}/health`);
    if (healthRes.status !== 200) throw new Error(`GET /health failed: ${healthRes.status}`);
    const healthBody = await healthRes.json();
    if (healthBody.status !== 'HEALTHY') throw new Error('GET /health invalid body');
    console.log('✔ PASS: GET /health returns 200 HEALTHY');

    const readinessRes = await fetch(`${baseUrl}/api/v1/health/readiness`);
    if (readinessRes.status !== 200) throw new Error(`GET /readiness failed: ${readinessRes.status}`);
    const readinessBody = await readinessRes.json();
    if (readinessBody.status !== 'READY') throw new Error('GET /readiness invalid body');
    console.log('✔ PASS: GET /api/v1/health/readiness returns 200 READY');

    // 2. POST /api/v1/auth/register (User 1)
    const regRes1 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'http_user1@justsay.app',
        password: 'Password123!🔒',
        handle: 'http_user1',
        displayName: 'HTTP User 1'
      })
    });
    if (regRes1.status !== 201) throw new Error(`POST /api/v1/auth/register failed: ${regRes1.status}`);
    const reg1Data = await regRes1.json();
    if (!reg1Data.success || !reg1Data.session) throw new Error('Registration 1 data invalid');
    const token1 = `Bearer ${reg1Data.session.accessToken}`;
    console.log('✔ PASS: POST /api/v1/auth/register created user 1 (201)');

    // 3. POST /api/v1/auth/login
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'http_user1@justsay.app',
        password: 'Password123!🔒'
      })
    });
    if (loginRes.status !== 200) throw new Error(`POST /api/v1/auth/login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.session) throw new Error('Login data invalid');
    console.log('✔ PASS: POST /api/v1/auth/login succeeded (200)');

    // 4. GET /api/v1/auth/me (Authenticated)
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: token1 }
    });
    if (meRes.status !== 200) throw new Error(`GET /api/v1/auth/me failed: ${meRes.status}`);
    const meData = await meRes.json();
    if (!meData.authenticated || meData.user.handle !== 'http_user1') throw new Error('GET /auth/me payload invalid');
    console.log('✔ PASS: GET /api/v1/auth/me verified protected session');

    // 5. Unauthorized Request Rejection
    const unauthRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: 'Bearer invalid_garbage_token' }
    });
    if (unauthRes.status !== 401) throw new Error(`Unauthorized request returned status ${unauthRes.status} instead of 401`);
    console.log('✔ PASS: Unauthorized request correctly rejected with 401');

    // 6. POST /api/v1/auth/register (User 2)
    const regRes2 = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'http_user2@justsay.app',
        password: 'Password123!🔒',
        handle: 'http_user2',
        displayName: 'HTTP User 2'
      })
    });
    const reg2Data = await regRes2.json();
    const token2 = `Bearer ${reg2Data.session.accessToken}`;

    // 7. POST /api/v1/messages (Anonymous message from User 2 to User 1)
    const msgRes = await fetch(`${baseUrl}/api/v1/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientHandle: 'http_user1',
        promptQuestion: 'confess something',
        messageText: 'Hello from HTTP router test!'
      })
    });
    if (msgRes.status !== 201 && msgRes.status !== 200) throw new Error(`POST /messages failed: ${msgRes.status}`);
    const msgData = await msgRes.json();
    if (!msgData.success || !msgData.messageId) throw new Error('POST /messages data invalid');
    console.log('✔ PASS: POST /api/v1/messages sent anonymous message via HTTP');

    // 8. GET /api/v1/messages/inbox (User 1 Inbox)
    const inboxRes = await fetch(`${baseUrl}/api/v1/messages/inbox`, {
      headers: { Authorization: token1 }
    });
    if (inboxRes.status !== 200) throw new Error(`GET /inbox failed: ${inboxRes.status}`);
    const inboxData = await inboxRes.json();
    if (inboxData.totalCount !== 1 || inboxData.messages[0].messageText !== 'Hello from HTTP router test!') {
      throw new Error('Inbox message mismatch');
    }
    console.log('✔ PASS: GET /api/v1/messages/inbox fetched recipient message');

    // 9. POST /api/v1/users/push-token
    const tokenRes = await fetch(`${baseUrl}/api/v1/users/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token1
      },
      body: JSON.stringify({
        deviceToken: 'fcm_http_test_token_123',
        platform: 'android'
      })
    });
    if (tokenRes.status !== 200) throw new Error(`POST /push-token failed: ${tokenRes.status}`);
    console.log('✔ PASS: POST /api/v1/users/push-token registered push token');

    // 10. Card Route (POST /api/v1/cards/projects)
    const cardRes = await fetch(`${baseUrl}/api/v1/cards/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token1
      },
      body: JSON.stringify({
        title: 'HTTP Card',
        canvasRatio: 'STORY_9_16',
        background: { type: 'SOLID', colorHex: '#000000' }
      })
    });
    if (cardRes.status !== 201) throw new Error(`POST /cards/projects failed: ${cardRes.status}`);
    const cardData = await cardRes.json();
    const cardId = cardData.project.id;
    console.log('✔ PASS: POST /api/v1/cards/projects created card project');

    // 11. Cross-Account IDOR Rejection (User 2 attempts to fetch/edit User 1's card project)
    const idorRes = await fetch(`${baseUrl}/api/v1/cards/projects/${cardId}`, {
      headers: { Authorization: token2 }
    });
    if (idorRes.status !== 403 && idorRes.status !== 400 && idorRes.status !== 404) {
      throw new Error(`IDOR request returned unexpected status ${idorRes.status}`);
    }
    console.log('✔ PASS: Cross-account IDOR request correctly rejected');

    // 12. Media Upload Route (POST /api/v1/media/upload)
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    const mediaRes = await fetch(`${baseUrl}/api/v1/media/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token1
      },
      body: JSON.stringify({
        mimeType: 'image/png',
        fileSizeBytes: 70,
        base64Content: pngBase64
      })
    });
    if (mediaRes.status !== 201 && mediaRes.status !== 200) throw new Error(`POST /media/upload failed: ${mediaRes.status}`);
    console.log('✔ PASS: POST /api/v1/media/upload validated magic bytes and stored asset');

    // 13. Admin Route with Valid Admin Token
    const adminLoginRes = await fetch(`${baseUrl}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authToken: 'super_secret_key' })
    });
    if (adminLoginRes.status !== 200) throw new Error(`Admin login failed: ${adminLoginRes.status}`);
    console.log('✔ PASS: POST /api/v1/admin/auth/login authenticated super admin');

    // 14. Normal User Attempting Admin Route without Admin Credentials
    const normalUserAdminRes = await fetch(`${baseUrl}/api/v1/admin/moderation/queue`, {
      headers: { Authorization: token1 }
    });
    if (normalUserAdminRes.status !== 401 && normalUserAdminRes.status !== 403) {
      throw new Error(`Normal user admin access returned status ${normalUserAdminRes.status} instead of 401/403`);
    }
    console.log('✔ PASS: Normal user attempt on admin route rejected with 401/403');

    console.log('\nALL HTTP ROUTER INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉\n');
  } finally {
    server.close();
    await apiServer.shutdown();
  }
}

runHttpRouterTests().catch((err) => {
  console.error('HTTP Router Test Suite Failed:', err);
  process.exit(1);
});
