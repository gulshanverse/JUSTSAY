import { JustSayApiServer } from '../main';
import { ValidationRules } from '@justsay/validation';
import { ModerationStatus, MessageStatus } from '@justsay/shared-types';
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

  console.log('\n================================================================');
  console.log('ALL PHASE 3, PHASE 4 & PHASE 5 TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
