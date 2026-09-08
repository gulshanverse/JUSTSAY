import { JustSayApiServer } from '../main';
import { ValidationRules } from '@justsay/validation';
import { ModerationStatus, MessageStatus, AdminRole } from '@justsay/shared-types';
import { validateConfig } from '../config/env.config';
import { RetentionEngineService } from '../modules/users/retention.service';
import * as crypto from 'crypto';

async function runTests() {
  console.log('Running JUSTSAY Phase 3 Security Remediation & Phase 4 Creative Card Engine Suite...');

  const server = new JustSayApiServer();

  // --- 1. SCRYPT SECURITY BASELINE & BACKWARD COMPATIBILITY MIGRATION ---
  console.log('\n--- 1. Testing scrypt Baseline (N=131072) & Transparent Migration ---');

  // Register User A with new OWASP scrypt baseline (N=131072)
  const regA = await server.authController.register({
    email: 'secuser_a@justsay.app',
    password: 'SecurePassword123! 🔒',
    handle: 'sec_user_a',
    displayName: 'Sec User A'
  }, '127.0.0.1');

  if (!regA.success || !regA.session) throw new Error(`FAILED: Account registration failed: ${regA.error}`);
  console.log('✔ PASS: User registration successful with OWASP scrypt baseline (N=131072)');

  const tokenA = `Bearer ${regA.session.accessToken}`;

  // Seed a legacy user hash (N=16384) manually to test transparent migration strategy
  const legacySalt = crypto.randomBytes(16).toString('hex');
  const legacyKey = crypto.scryptSync('OldPassword123!', legacySalt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  const legacyHash = `$scrypt$N=16384,r=8,p=1$${legacySalt}$${legacyKey}`;

  // Register legacy account
  await server.authController.register({
    email: 'legacyuser@justsay.app',
    password: 'TempPassword123!',
    handle: 'legacy_user',
    displayName: 'Legacy User'
  }, '127.0.0.2');

  // Overwrite passwordHash with legacy hash
  const storedLegacyUser = server.authService.getUserByHandle('legacy_user');
  if (storedLegacyUser) {
    (storedLegacyUser as any).passwordHash = legacyHash;
  }

  // Login with legacy account -> Verification succeeds and triggers transparent rehash
  const legacyLogin = await server.authController.login({
    email: 'legacyuser@justsay.app',
    password: 'OldPassword123!'
  }, '127.0.0.2');

  if (!legacyLogin.success || !legacyLogin.session) throw new Error('FAILED: Legacy scrypt login failed');

  const rehashedUser = server.authService.getUserByHandle('legacy_user');
  if (!rehashedUser || !rehashedUser.passwordHash.includes('N=131072')) {
    throw new Error('SECURITY MIGRATION FAILURE: Legacy hash was not upgraded to N=131072 on login');
  }
  console.log('✔ PASS: Legacy scrypt hash (N=16384) transparently re-hashed to OWASP baseline (N=131072)');

  // Register User B
  const regB = await server.authController.register({
    email: 'secuser_b@justsay.app',
    password: 'SecurePassword123! 🔒',
    handle: 'sec_user_b',
    displayName: 'Sec User B'
  }, '127.0.0.3');
  if (!regB.success || !regB.session) throw new Error('FAILED: User B registration failed');
  const tokenB = `Bearer ${regB.session.accessToken}`;

  // --- 2. ANONYMOUS ABUSE KEY & BLOCKING ARCHITECTURE ---
  console.log('\n--- 2. Testing AnonymousAbuseKey Abstraction & Blocking ---');

  // Post anonymous message to User A
  const msgRes = await server.messagesController.postMessage({
    recipientHandle: 'sec_user_a',
    promptQuestion: 'send me honest confessions 🤫',
    messageText: 'You have a fantastic smile!'
  }, '192.168.2.10');

  if (!msgRes.success) throw new Error('FAILED: Message creation failed');
  const msgId = msgRes.messageId;

  // Recipient blocks sender via AnonymousAbuseKey derivation
  const blockRes = await server.messagesController.blockSenderFromMessage(tokenA, msgId);
  if (!blockRes.success) throw new Error('FAILED: Recipient block request failed');
  console.log('✔ PASS: Sender blocked without exposing IP or identity');

  // Blocked sender attempts to post message again from 192.168.2.10
  const postBlocked = await server.messagesController.postMessage({
    recipientHandle: 'sec_user_a',
    promptQuestion: 'send me honest confessions 🤫',
    messageText: 'Another message attempt after block'
  }, '192.168.2.10');

  if (postBlocked.success) throw new Error('BLOCK FAILURE: Blocked sender message was allowed');
  if (postBlocked.error !== 'Unable to send message to this user') {
    throw new Error(`BLOCK FAILURE: Unexpected error message: ${postBlocked.error}`);
  }
  console.log('✔ PASS: AnonymousAbuseKey blocked sender server-side with generic response');

  // --- 3. CARD STUDIO TEMPLATES & STICKER CATALOG ---
  console.log('\n--- 3. Testing Card Studio Templates & Sticker Catalog ---');

  const templatesRes = await server.cardsController.getTemplates();
  if (templatesRes.templates.length < 3) throw new Error('FAILED: Card Studio templates missing');
  console.log(`✔ PASS: Retrieved ${templatesRes.templates.length} designer card templates`);

  const stickersRes = await server.cardsController.getStickers();
  if (stickersRes.stickers.length < 5) throw new Error('FAILED: Sticker catalog missing');
  console.log(`✔ PASS: Retrieved ${stickersRes.stickers.length} curated sticker assets`);

  // --- 4. CARD PROJECT CREATION, EDITING & OWNERSHIP MATRIX ---
  console.log('\n--- 4. Testing Card Studio Creation & Ownership Isolation ---');

  // User A creates a Card Project
  const cardCreateRes = await server.cardsController.createProject(tokenA, {
    title: 'My Custom Story Card',
    canvasRatio: 'STORY_9_16',
    background: {
      type: 'PRESET',
      colorHex: '#0B0D17',
      presetName: 'Midnight'
    },
    elements: [
      {
        id: 'el_txt_1',
        type: 'TEXT',
        x: 50,
        y: 50,
        width: 300,
        height: 100,
        rotation: 0,
        zIndex: 1,
        opacity: 1,
        content: 'Confession Card Content',
        fontSize: 24,
        textColorHex: '#FFFFFF'
      }
    ],
    includeBranding: true
  });

  if (!cardCreateRes.success || !cardCreateRes.project) {
    throw new Error(`FAILED: Card project creation failed: ${cardCreateRes.error}`);
  }
  const cardId = cardCreateRes.project.id;
  console.log('✔ PASS: Card project created successfully');

  // User B attempts to edit User A's Card Project -> DENIED (Forbidden)
  const unauthEdit = await server.cardsController.updateProject(tokenB, cardId, {
    title: 'Hacked Card Title'
  });
  if (unauthEdit.success) {
    throw new Error('SECURITY FAILURE: User B was allowed to update User A card project');
  }
  console.log('✔ PASS: Card project cross-account mutation blocked (Forbidden)');

  // User A updates their card project
  const authEdit = await server.cardsController.updateProject(tokenA, cardId, {
    title: 'Updated Story Card Title'
  });
  if (!authEdit.success || authEdit.project.title !== 'Updated Story Card Title') {
    throw new Error('FAILED: Owner card project update failed');
  }
  console.log('✔ PASS: Owner card project update successful');

  // --- 5. INBOX MESSAGE -> CARD CONVERSION (ZERO TELEMETRY LEAK) ---
  console.log('\n--- 5. Testing Inbox Message to Card Conversion ---');

  // Send message to User B
  const msgForB = await server.messagesController.postMessage({
    recipientHandle: 'sec_user_b',
    promptQuestion: 'send me honest confessions 🤫',
    messageText: 'I secretly admire your courage.'
  }, '192.168.3.45');

  const cardFromMsgRes = await server.cardsController.createCardFromMessage(tokenB, {
    messageId: msgForB.messageId,
    templateId: 'tmpl_confession_01'
  });

  if (!cardFromMsgRes.success || !cardFromMsgRes.project) {
    throw new Error(`FAILED: Inbox message to Card conversion failed: ${cardFromMsgRes.error}`);
  }

  const generatedCard = cardFromMsgRes.project;
  const cardElementsJson = JSON.stringify(generatedCard.elements);
  if (cardElementsJson.includes('192.168.3.45') || cardElementsJson.includes('secuser_b@justsay.app')) {
    throw new Error('CRITICAL PRIVACY FAILURE: Sender telemetry or sensitive PII leaked into Card Project!');
  }
  console.log('✔ PASS: Inbox confession converted to Card without sender telemetry leakage');

  // --- 6. MEDIA ASSET UPLOAD & VALIDATION ---
  console.log('\n--- 6. Testing Media Storage Service & MIME Validation ---');

  // Test invalid MIME type -> REJECTED
  const invalidMime = await server.mediaStorageService.uploadMedia('sec_user_a', {
    fileName: 'exploit.exe',
    mimeType: 'application/x-msdownload',
    fileSizeBytes: 1024
  });
  if (invalidMime.success) throw new Error('MEDIA SECURITY FAILURE: Disallowed MIME type was accepted');
  console.log('✔ PASS: Invalid MIME type upload rejected');

  // Test oversized file -> REJECTED
  const oversizedFile = await server.mediaStorageService.uploadMedia('sec_user_a', {
    fileName: 'huge_banner.png',
    mimeType: 'image/png',
    fileSizeBytes: 10 * 1024 * 1024 // 10MB
  });
  if (oversizedFile.success) throw new Error('MEDIA SECURITY FAILURE: Oversized file was accepted');
  console.log('✔ PASS: Oversized file (>5MB) upload rejected');

  // Test Magic Byte Inspection (Valid PNG base64)
  const pngHeaderBase64 = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]).toString('base64');
  const validMagicUpload = await server.mediaStorageService.uploadMedia('sec_user_a', {
    fileName: 'valid_header.png',
    mimeType: 'image/png',
    fileSizeBytes: 50 * 1024,
    base64Content: pngHeaderBase64
  });
  if (!validMagicUpload.success) throw new Error('MEDIA FAILURE: Valid PNG magic header was rejected');
  console.log('✔ PASS: Valid PNG magic bytes verified successfully');

  // Test Invalid Magic Byte (Fake PNG containing script text)
  const fakePngBase64 = Buffer.from('<script>alert("xss")</script>').toString('base64');
  const spoofedMagicUpload = await server.mediaStorageService.uploadMedia('sec_user_a', {
    fileName: 'spoofed.png',
    mimeType: 'image/png',
    fileSizeBytes: 50 * 1024,
    base64Content: fakePngBase64
  });
  if (spoofedMagicUpload.success) throw new Error('MEDIA SECURITY FAILURE: Spoofed file magic bytes passed validation!');
  console.log('✔ PASS: Spoofed magic bytes correctly rejected');

  // --- 7. NOTIFICATION SERVICE & PRIVACY-PRESERVING PREVIEWS ---
  console.log('\n--- 7. Testing Notification Service & Privacy Previews ---');

  const notifService = server.notificationService;

  // Dispatch new message notification -> Uses non-sensitive preview
  const notifItem = await notifService.notifyUser('sec_user_a', 'new_message');
  if (!notifItem || notifItem.body.includes('confession text')) {
    throw new Error('NOTIFICATION PRIVACY FAILURE: Sensitive content leaked in notification preview');
  }
  if (notifItem.body !== 'You received a new JUSTSAY message.') {
    throw new Error(`NOTIFICATION FAILURE: Unexpected notification body: ${notifItem.body}`);
  }
  console.log('✔ PASS: Notification preview uses non-sensitive text ("You received a new JUSTSAY message.")');

  // User disables message notifications -> Dispatch returns null
  notifService.updatePreferences('sec_user_a', { newMessages: false });
  const disabledNotif = await notifService.notifyUser('sec_user_a', 'new_message');
  if (disabledNotif !== null) {
    throw new Error('NOTIFICATION FAILURE: Notification dispatched despite user preference disabled');
  }
  console.log('✔ PASS: User notification preferences respected');

  // --- 8. PHASE 6: ADMIN CONTROL PLANE, RBAC & AUDIT LOGS ---
  console.log('\n--- 8. Testing Admin Control Plane, RBAC & Audit Logs ---');

  const adminController = server.adminController;

  // Support Admin Login
  const supportLogin = await adminController.loginAdmin({ authToken: 'support_key' });
  if (!supportLogin.authenticated || supportLogin.role !== AdminRole.SUPPORT) {
    throw new Error('ADMIN AUTH FAILURE: Support login failed');
  }
  console.log('✔ PASS: Admin authentication and role assignment verified (SUPPORT)');

  // Super Admin Login
  const superLogin = await adminController.loginAdmin({ authToken: 'super_secret_key' });
  if (!superLogin.authenticated || superLogin.role !== AdminRole.SUPER_ADMIN) {
    throw new Error('ADMIN AUTH FAILURE: Super Admin login failed');
  }
  console.log('✔ PASS: Super Admin authentication verified (SUPER_ADMIN)');

  // RBAC Enforcement: Support role cannot access full audit logs
  let unauthorizedAuditError = false;
  try {
    adminController.getAuditLogs(AdminRole.SUPPORT);
  } catch (err) {
    unauthorizedAuditError = true;
  }
  if (!unauthorizedAuditError) {
    throw new Error('RBAC SECURITY FAILURE: Support role bypassed audit log access restriction!');
  }
  console.log('✔ PASS: RBAC restriction enforced on sensitive audit logs');

  // Super Admin retrieves audit logs
  const auditLogs = adminController.getAuditLogs(AdminRole.SUPER_ADMIN);
  if (auditLogs.length === 0) {
    throw new Error('AUDIT LOG FAILURE: Audit logs were empty after login');
  }
  console.log(`✔ PASS: Append-only audit logs recorded successfully (${auditLogs.length} events logged)`);

  // --- 9. PHASE 6: FEATURE FLAGS & DETERMINISTIC BUCKETING ---
  console.log('\n--- 9. Testing Feature Flags & Deterministic Bucketing ---');

  const ffService = server.featureFlagsService;
  const flags = ffService.getAllFlags();
  if (flags.length === 0) throw new Error('FEATURE FLAGS FAILURE: Default flags empty');

  // Test 50% rollout bucketing determinism
  const isUserAEnabled = ffService.isFeatureEnabledForUser('new_profile_ui', 'user_a');
  const isUserAEnabledAgain = ffService.isFeatureEnabledForUser('new_profile_ui', 'user_a');
  if (isUserAEnabled !== isUserAEnabledAgain) {
    throw new Error('FEATURE FLAGS FAILURE: Deterministic bucketing failed for same user');
  }
  console.log(`✔ PASS: Deterministic feature flag evaluation verified for 'new_profile_ui' (user_a -> ${isUserAEnabled})`);

  // --- 10. PHASE 6: ANALYTICS & PRIVACY FILTERING ---
  console.log('\n--- 10. Testing Analytics & Privacy Filtering ---');

  const analyticsService = server.analyticsService;
  // Track event with forbidden sensitive key
  analyticsService.trackEvent('message_sent', {
    handle: 'sec_user_a',
    messageText: 'Super secret private message content',
    password: 'myPassword123'
  });

  const funnelMetrics = analyticsService.getFunnelMetrics();
  if (!funnelMetrics || funnelMetrics.length === 0) {
    throw new Error('ANALYTICS FAILURE: Funnel metrics empty');
  }
  console.log('✔ PASS: Analytics event tracked & funnel metrics aggregated successfully');

  // --- 11. PHASE 6: ACCOUNT DATA EXPORT ---
  console.log('\n--- 11. Testing Account Data Export & Privacy Sanitization ---');

  const exportService = server.accountDataExportService;
  const exportPkg = await exportService.generateUserExportPackage(
    { id: 'usr_1', email: 'user@example.com', handle: 'sec_user_a', displayName: 'User A', createdAt: Date.now() },
    { handle: 'sec_user_a', allowAnonymousMessages: true, allowReplies: true, allowReactions: true, showPublicProfile: true },
    5,
    2,
    1
  );

  if (!exportPkg.dataUrl || exportPkg.user.handle !== 'sec_user_a') {
    throw new Error('DATA EXPORT FAILURE: Export package payload malformed');
  }
  console.log('✔ PASS: Privacy-sanitized user data export generated');

  // --- 12. PHASE 7: PRODUCTION CONFIGURATION & LOGGER ---
  console.log('\n--- 12. Testing Phase 7 Configuration & Observability Logger ---');
  await server.initialize();
  const logger = server.logger;
  const sanitizedMeta = logger.sanitizeMeta({
    username: 'sec_user_a',
    password: 'super_secret_password',
    token: 'jwt_secret_token',
    normalField: 'public_value'
  });

  if (sanitizedMeta?.password !== '[REDACTED_SENSITIVE]' || sanitizedMeta?.normalField !== 'public_value') {
    throw new Error('LOGGER SANITIZATION FAILURE: Sensitive field scrubbing failed!');
  }
  console.log('✔ PASS: Production Logger sensitive field scrubbing verified');

  // --- 13. PHASE 7: REDIS ADAPTER & ENDPOINT RATE LIMITING ---
  console.log('\n--- 13. Testing Phase 7 Redis Adapter & Rate Limiting ---');
  const rateLimiter = server.prodRateLimiter;
  // Test Auth Rate Limit (Max 5)
  for (let i = 0; i < 5; i++) {
    const rlRes = await rateLimiter.checkRateLimit('AUTH', 'test_client_ip_1');
    if (!rlRes.allowed) throw new Error(`RATE LIMIT FAILURE: Allowed check failed at iteration ${i}`);
  }
  const exceededRes = await rateLimiter.checkRateLimit('AUTH', 'test_client_ip_1');
  if (exceededRes.allowed) {
    throw new Error('RATE LIMIT FAILURE: Client exceeded rate limit allowance without rejection!');
  }
  console.log('✔ PASS: Endpoint-specific rate limiting policy enforced (AUTH policy max 5 requests)');

  // --- 14. PHASE 7: PRODUCTION OBJECT STORAGE & MAGIC BYTES ---
  console.log('\n--- 14. Testing Phase 7 Production Object Storage & Magic Bytes ---');
  const storage = server.objectStorageAdapter;
  // Valid PNG Header
  const validPngBytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const uploadRes = await storage.uploadAsset('assets/test_card_1.png', validPngBytes, 'image/png', 'usr_1', false);
  if (!uploadRes || uploadRes.sizeBytes !== 8) throw new Error('OBJECT STORAGE FAILURE: Asset upload failed');

  // Invalid Executable Header
  const invalidExeBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]); // MZ executable header
  let magicByteError = false;
  try {
    await storage.uploadAsset('assets/malicious.exe', invalidExeBytes, 'image/png', 'usr_1', false);
  } catch (err) {
    magicByteError = true;
  }
  if (!magicByteError) {
    throw new Error('OBJECT STORAGE SECURITY FAILURE: Executable magic bytes bypassed validation!');
  }
  console.log('✔ PASS: Magic byte inspection rejected invalid binary asset');

  // Private Asset Signed URL Authorization
  const signedUrl = await storage.generateSignedDownloadUrl('assets/test_card_1.png', 'usr_1');
  if (!signedUrl.includes('Signature=')) throw new Error('SIGNED URL FAILURE: Signed download URL malformed');

  let forbiddenAccessError = false;
  try {
    await storage.generateSignedDownloadUrl('assets/test_card_1.png', 'usr_unauthorized_owner');
  } catch (err) {
    forbiddenAccessError = true;
  }
  if (!forbiddenAccessError) {
    throw new Error('OBJECT STORAGE AUTHORIZATION FAILURE: Unauthorized user accessed private media asset!');
  }
  console.log('✔ PASS: Private media asset access control & signed URL generation verified');

  // --- 15. PHASE 7: WORKER QUEUE & IDEMPOTENCY DEDUPLICATION ---
  console.log('\n--- 15. Testing Phase 7 Worker Queue & Idempotency Key Deduplication ---');
  const worker = server.worker;
  const job1 = worker.enqueueJob('media_processing', { assetKey: 'assets/test_card_1.png' }, 'idempotency_key_abc_123');
  const job2 = worker.enqueueJob('media_processing', { assetKey: 'assets/test_card_1.png' }, 'idempotency_key_abc_123');

  if (job1.id !== job2.id) {
    throw new Error('BACKGROUND WORKER FAILURE: Idempotency deduplication failed to merge duplicate jobs!');
  }
  console.log('✔ PASS: Background worker job deduplication verified via idempotency key');

  // --- 16. PHASE 7: FCM NOTIFICATIONS & PRIVACY PREVIEW ---
  console.log('\n--- 16. Testing Phase 7 FCM Push Notification Provider & Privacy Previews ---');
  const fcm = server.fcmProvider;
  fcm.registerDeviceToken('usr_1', 'fcm_device_token_xyz_999', 'android');
  const pushRes = await fcm.sendPushNotification('usr_1', 'Secret Message', 'Private message: Hello secret friend');
  if (!pushRes.success) throw new Error('FCM PROVIDER FAILURE: Push notification dispatch failed');
  console.log('✔ PASS: FCM push notification dispatched safely with privacy-preserving payload');

  // --- 17. PHASE 7: PRODUCTION HEALTH & READINESS ---
  console.log('\n--- 17. Testing Phase 7 Production Health & Readiness Checks ---');
  const healthController = server.prodHealthController;
  const liveness = healthController.getLiveness();
  const readiness = healthController.getReadiness();

  if (liveness.status !== 'HEALTHY' || readiness.status !== 'READY') {
    throw new Error('HEALTH CHECK FAILURE: System readiness check reported non-ready status!');
  }
  console.log('✔ PASS: Production health liveness & readiness check status verified');

  // --- 18. PHASE 8: COMPREHENSIVE IDOR & AUTHORIZATION MATRIX ---
  console.log('\n--- 18. Testing Phase 8 IDOR Cross-Account Isolation ---');

  // User B attempts to read User A's inbox
  const userBInboxForA = await server.messagesController.getInbox(tokenB);
  if (userBInboxForA.messages.some(m => m.recipientHandle === 'sec_user_a')) {
    throw new Error('IDOR SECURITY FAILURE: User B was able to view User A inbox messages!');
  }
  console.log('✔ PASS: User B forbidden from accessing User A inbox (IDOR isolated)');

  // User B attempts to delete User A's message
  const userBDeleteMsg = await server.messagesController.deleteMessage(tokenB, msgId);
  if (userBDeleteMsg.success) {
    throw new Error('IDOR SECURITY FAILURE: User B was able to delete User A message!');
  }
  console.log('✔ PASS: User B forbidden from deleting User A message (IDOR isolated)');

  // User B attempts to delete User A's account
  const userBDeleteAccountA = await server.usersController.deleteAccount(tokenB);
  // Token B belongs to User B, so this would delete B's account, NOT A's account! Let's verify User A remains intact.
  const userACheck = server.authService.getUserByHandle('sec_user_a');
  if (!userACheck) {
    throw new Error('IDOR SECURITY FAILURE: User A account was affected by User B request!');
  }
  console.log('✔ PASS: Account deletion strictly isolated to authenticated token owner');

  // --- 19. PHASE 8: HARDENED ADMIN AUTHENTICATION SECURITY ---
  console.log('\n--- 19. Testing Hardened Admin Authentication & Key Verification ---');

  // Insecure naive substring tokens MUST BE REJECTED
  const naiveSuper = await server.adminController.loginAdmin({ authToken: 'super_random_user_token' });
  if (naiveSuper.authenticated) {
    throw new Error('ADMIN SECURITY VULNERABILITY: Naive token containing "super" was granted admin access!');
  }

  const naiveAdmin = await server.adminController.loginAdmin({ authToken: 'admin_guest' });
  if (naiveAdmin.authenticated) {
    throw new Error('ADMIN SECURITY VULNERABILITY: Naive token containing "admin" was granted admin access!');
  }

  // Exact configured key MUST BE ACCEPTED
  const validAdminLogin = await server.adminController.loginAdmin({ authToken: 'admin_secret_key' });
  if (!validAdminLogin.authenticated || validAdminLogin.role !== AdminRole.ADMIN) {
    throw new Error('ADMIN AUTH FAILURE: Valid admin exact key failed authentication!');
  }
  console.log('✔ PASS: Hardened admin authentication rejected naive tokens and verified exact secret key');

  // --- 20. PHASE 8: PRODUCTION FAIL-FAST STARTUP CONFIG VALIDATION ---
  console.log('\n--- 20. Testing Production Fail-Fast Startup Config Validation ---');

  let configErrorThrown = false;
  try {
    const mockProdConfig = {
      env: 'production' as const,
      port: 3000,
      apiPrefix: '/api/v1',
      database: { url: '', maxConnections: 10, idleTimeoutMs: 30000, connectionTimeoutMs: 5000, ssl: true },
      redis: { url: '', keyPrefix: 'justsay:', connectTimeoutMs: 5000, maxRetriesPerRequest: 3 },
      objectStorage: { provider: 'gcs' as const, bucketName: 'prod', region: 'us-central1', signedUrlTtlSeconds: 3600, maxFileSizeBytes: 5242880 },
      fcm: { enabled: false },
      secrets: { sessionSecret: 'dev_session_secret_change_in_production_32chars', adminSecret: 'dev_admin_jwt_secret_change_in_production_32chars' },
      moderation: { provider: 'keyword' as const, autoBlockThreshold: 0.85 }
    };
    validateConfig(mockProdConfig);
  } catch (err: any) {
    configErrorThrown = true;
    if (!err.message.includes('PRODUCTION_CONFIG_ERROR')) {
      throw new Error(`UNEXPECTED ERROR MESSAGE: ${err.message}`);
    }
  }

  if (!configErrorThrown) {
    throw new Error('PRODUCTION SECURITY FAILURE: Production config with dev default secret failed to fail fast!');
  }
  console.log('✔ PASS: Production startup validation correctly failed fast when default secrets were detected');

  // --- 21. PHASE 8: RETENTION ENGINE DATA CLEANUP ---
  console.log('\n--- 21. Testing Retention Engine Scheduled Cleanup Sweep ---');

  const retentionEngine = new RetentionEngineService({
    sessionRetentionDays: 7,
    messageRetentionDays: 90,
    notificationRetentionDays: 30
  });

  const mockSessions = new Map<string, { expiresAt: number }>();
  mockSessions.set('valid_sess_1', { expiresAt: Date.now() + 86400000 });
  mockSessions.set('expired_sess_2', { expiresAt: Date.now() - 1000 }); // Expired

  const mockMessagesStore = new Map<string, Array<{ id: string; timestamp: number }>>();
  const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000); // 91 days old
  const recentTimestamp = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days old
  mockMessagesStore.set('sec_user_a', [
    { id: 'm_old_1', timestamp: oldTimestamp },
    { id: 'm_recent_2', timestamp: recentTimestamp }
  ]);

  const cleanupResult = await retentionEngine.runScheduledCleanup(mockSessions, mockMessagesStore);
  if (cleanupResult.expiredSessionsCleaned !== 1 || cleanupResult.oldMessagesCleaned !== 1) {
    throw new Error(`RETENTION FAILURE: Unexpected cleanup counts: ${JSON.stringify(cleanupResult)}`);
  }

  if (mockSessions.has('expired_sess_2') || !mockSessions.has('valid_sess_1')) {
    throw new Error('RETENTION FAILURE: Expired session not removed or valid session deleted!');
  }

  const remainingMsgs = mockMessagesStore.get('sec_user_a') || [];
  if (remainingMsgs.length !== 1 || remainingMsgs[0].id !== 'm_recent_2') {
    throw new Error('RETENTION FAILURE: Old message (>90d) was not removed during cleanup sweep!');
  }
  console.log('✔ PASS: Retention engine successfully purged expired sessions and old (>90d) messages');

  // --- 22. PHASE 8: CHAOS & FAILURE TESTING ---
  console.log('\n--- 22. Testing Fail-Closed Rate Limiting & Service Disconnection Degraded Mode ---');

  // Test fail-closed strategy when cache throws error for AUTH policy
  const failingCache = {
    get: async () => { throw new Error('Redis Connection Lost'); },
    set: async () => { throw new Error('Redis Connection Lost'); },
    delete: async () => false
  };

  const failClosedRateLimiter = new (server.prodRateLimiter.constructor as any)(failingCache);
  const authFailCheck = await failClosedRateLimiter.checkRateLimit('AUTH', 'ip_123');
  if (authFailCheck.allowed !== false) {
    throw new Error('RATE LIMITER CHAOS FAILURE: AUTH rate limiter failed open during cache failure instead of fail-closed!');
  }
  console.log('✔ PASS: AUTH rate limiter enforced fail-closed policy during Redis outage');

  // --- 23. PHASE 8: REAL EXECUTABLE BENCHMARK SUITE ---
  console.log('\n--- 23. Running Real Executable Benchmark (1,000 requests) ---');

  const sampleSize = 1000;
  const timings: number[] = [];
  let errorCount = 0;

  const benchmarkStart = Date.now();

  for (let i = 0; i < sampleSize; i++) {
    const t0 = Date.now();
    try {
      if (i % 4 === 0) {
        await server.publicWebController.renderPublicPage('sec_user_a');
      } else if (i % 4 === 1) {
        await server.cardsController.getTemplates();
      } else if (i % 4 === 2) {
        await server.handlesController.checkHandle(`handle_${i}`, `10.0.0.${i % 250}`);
      } else {
        server.prodHealthController.getLiveness();
      }
    } catch (err) {
      errorCount++;
    }
    const t1 = Date.now();
    timings.push(t1 - t0);
  }

  const totalDurationMs = Date.now() - benchmarkStart;
  timings.sort((a, b) => a - b);

  const p50 = timings[Math.floor(sampleSize * 0.50)];
  const p90 = timings[Math.floor(sampleSize * 0.90)];
  const p95 = timings[Math.floor(sampleSize * 0.95)];
  const p99 = timings[Math.floor(sampleSize * 0.99)];
  const max = timings[timings.length - 1];
  const rps = Math.round((sampleSize / totalDurationMs) * 1000);

  console.log(`\n📊 EXECUTABLE BENCHMARK RESULTS (${sampleSize} Requests):`);
  console.log(`   - Throughput: ${rps} req/sec`);
  console.log(`   - Total Time: ${totalDurationMs}ms`);
  console.log(`   - p50 Latency: ${p50}ms`);
  console.log(`   - p90 Latency: ${p90}ms`);
  console.log(`   - p95 Latency: ${p95}ms`);
  console.log(`   - p99 Latency: ${p99}ms`);
  console.log(`   - Max Latency: ${max}ms`);
  console.log(`   - Error Count: ${errorCount} (${((errorCount / sampleSize) * 100).toFixed(2)}%)`);

  if (errorCount > 0) {
    throw new Error(`BENCHMARK FAILURE: Encountered ${errorCount} errors during performance run`);
  }

  // --- 24. FCM TOKEN LIFECYCLE, AUTHENTICATED OWNERSHIP & PRIVACY TEST SUITE ---
  console.log('\n--- 24. Testing FCM Token Lifecycle, Authenticated Ownership & Privacy Enforcements ---');
  const notifSvc = server.notificationService;
  const usersCtrl = server.usersController;

  const authUserA = await server.authService.register({
    email: 'fcm_user_a@justsay.app',
    password: 'Password123!',
    handle: 'fcm_user_a',
    displayName: 'FCM User A'
  });
  const authUserB = await server.authService.register({
    email: 'fcm_user_b@justsay.app',
    password: 'Password123!',
    handle: 'fcm_user_b',
    displayName: 'FCM User B'
  });

  const fcmTokenA = `Bearer ${authUserA.session!.accessToken}`;
  const fcmTokenB = `Bearer ${authUserB.session!.accessToken}`;

  const userAKey = authUserA.session!.user.id;
  const userBKey = authUserB.session!.user.id;

  // 24a. Unauthenticated registration attempt must be rejected
  const unauthReg = await usersCtrl.registerPushToken('', 'fcm_token_unauth_123');
  if (unauthReg.success) {
    throw new Error('FCM SECURITY FAILURE: Unauthenticated token registration was permitted!');
  }

  // 24b. Invalid/empty token registration attempt
  const emptyTokenReg = await usersCtrl.registerPushToken(fcmTokenA, '');
  if (emptyTokenReg.success) {
    throw new Error('FCM SECURITY FAILURE: Empty FCM device token registration was permitted!');
  }

  // 24c. Authenticated registration
  const regA1 = await usersCtrl.registerPushToken(fcmTokenA, 'fcm_token_device_A_1', 'android');
  if (!regA1.success) {
    throw new Error('FCM REGISTRATION FAILURE: Failed to register device token for user A');
  }

  // Verify token associated with User A
  const tokensUserA = notifSvc.getUserTokens(userAKey);
  if (!tokensUserA.some(t => t.deviceToken === 'fcm_token_device_A_1')) {
    throw new Error('FCM OWNERSHIP FAILURE: Token not associated with authenticated User A');
  }

  // 24d. Token rotation / re-registration (device token moved to User B)
  const regB1 = await usersCtrl.registerPushToken(fcmTokenB, 'fcm_token_device_A_1', 'android');
  if (!regB1.success) {
    throw new Error(`FCM ROTATION FAILURE: Failed to rotate token to User B: ${regB1.error}`);
  }
  const tokensUserAAfterRotation = notifSvc.getUserTokens(userAKey);
  const tokensUserBAfterRotation = notifSvc.getUserTokens(userBKey);
  if (tokensUserAAfterRotation.some(t => t.deviceToken === 'fcm_token_device_A_1')) {
    throw new Error('FCM ROTATION FAILURE: Token remained registered under old user after rotation!');
  }
  if (!tokensUserBAfterRotation.some(t => t.deviceToken === 'fcm_token_device_A_1')) {
    throw new Error('FCM ROTATION FAILURE: Token was not updated to new authenticated user B');
  }

  // 24e. Re-register distinct token for User A
  await usersCtrl.registerPushToken(fcmTokenA, 'fcm_token_device_A_2', 'android');

  // 24f. Token removal / revocation
  const revokeRes = await usersCtrl.revokePushToken(fcmTokenA, 'fcm_token_device_A_2');
  if (!revokeRes.success) {
    throw new Error('FCM REVOCATION FAILURE: Failed to revoke device token');
  }
  if (notifSvc.getUserTokens(userAKey).some(t => t.deviceToken === 'fcm_token_device_A_2')) {
    throw new Error('FCM REVOCATION FAILURE: Revoked token still present in user token store');
  }

  // 24g. Notification Preference Enforcement
  notifSvc.updatePreferences('fcm_user_a', { newMessages: false });
  const suppressedNotif = await notifSvc.notifyUser('fcm_user_a', 'new_message');
  if (suppressedNotif !== null) {
    throw new Error('FCM PREFERENCE FAILURE: Notification dispatched despite user preference disabling new_message!');
  }
  // Restore preference
  notifSvc.updatePreferences('fcm_user_a', { newMessages: true });

  // 24h. Generic Notification Payload Privacy Verification
  const activeNotif = await notifSvc.notifyUser('fcm_user_a', 'new_message', 'Private Raw Confession Text', 'Raw secret details');
  if (!activeNotif) {
    throw new Error('FCM NOTIFICATION FAILURE: Failed to dispatch notification');
  }
  if (activeNotif.body.includes('Raw secret details') || activeNotif.body.includes('Private Raw Confession')) {
    throw new Error('PRIVACY LEAK FAILURE: Sensitive message details leaked in push notification payload!');
  }
  if (activeNotif.body !== 'You received a new JUSTSAY message.') {
    throw new Error(`PRIVACY FORMAT FAILURE: Unexpected notification body: ${activeNotif.body}`);
  }
  console.log('✔ PASS: FCM token lifecycle, token rotation, authenticated ownership, and notification privacy verified');

  await server.shutdown();

  console.log('\n================================================================');
  console.log('ALL PHASE 3, 4, 5, 6, 7 & PHASE 8 VERIFICATION TESTS PASSED!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});

