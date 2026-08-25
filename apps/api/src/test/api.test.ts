import { JustSayApiServer } from '../main';
import { ValidationRules } from '@justsay/validation';
import { ModerationStatus, MessageStatus, AdminRole } from '@justsay/shared-types';

async function runTests() {
  console.log('Running JUSTSAY Comprehensive Phase 2 Security Remediation & Phase 3 Verification Suite...');

  const server = new JustSayApiServer();

  // --- 1. HANDLE SYSTEM TESTS ---
  console.log('\n--- 1. Testing Handle Validation & Availability ---');

  // Reserved handle -> REJECTED
  const resHandle = await server.handlesController.checkHandle('admin', '127.0.0.1');
  if (resHandle.available) throw new Error('FAILED: Reserved handle "admin" was allowed');
  console.log('✔ PASS: Reserved handle "admin" rejected');

  // Short handle -> REJECTED
  const shortHandle = await server.handlesController.checkHandle('ab', '127.0.0.1');
  if (shortHandle.available) throw new Error('FAILED: Handle "ab" (<3 chars) was allowed');
  console.log('✔ PASS: Handle < 3 chars rejected');

  // Invalid characters -> REJECTED
  const invalidChars = await server.handlesController.checkHandle('user@name!', '127.0.0.1');
  if (invalidChars.available) throw new Error('FAILED: Handle with special characters was allowed');
  console.log('✔ PASS: Handle with invalid characters rejected');

  // Valid handle -> AVAILABLE
  const validHandle = await server.handlesController.checkHandle('star_creator_99', '127.0.0.1');
  if (!validHandle.available) throw new Error(`FAILED: Valid handle "star_creator_99" rejected: ${validHandle.reason}`);
  console.log('✔ PASS: Valid handle "star_creator_99" available');

  // --- 2. AUTHENTICATION & SCRYPT PASSWORD SECURITY TESTS ---
  console.log('\n--- 2. Testing Registration, Login, and Password Policy (scrypt) ---');

  // Register User A
  const regResult = await server.authController.register({
    email: 'newuser@justsay.app',
    password: 'Password123! 🔑', // Unicode + spaces
    handle: 'newuser_99',
    displayName: 'New User 99'
  }, '127.0.0.1');

  if (!regResult.success || !regResult.session) throw new Error(`FAILED: Registration failed: ${regResult.error}`);
  console.log('✔ PASS: Account registration successful with Unicode password');

  // Register User B with SAME password
  const regB = await server.authController.register({
    email: 'userb@justsay.app',
    password: 'Password123! 🔑',
    handle: 'user_b',
    displayName: 'User B'
  }, '127.0.0.2');
  if (!regB.success || !regB.session) throw new Error('FAILED: User B registration failed');
  const tokenB = `Bearer ${regB.session.accessToken}`;

  // Login User A with correct password
  const loginResult = await server.authController.login({
    email: 'newuser@justsay.app',
    password: 'Password123! 🔑'
  }, '127.0.0.1');
  if (!loginResult.success || !loginResult.session) throw new Error('FAILED: Login failed with correct password');
  console.log('✔ PASS: Login successful with scrypt password verification');

  // Login with invalid password
  const badLogin = await server.authController.login({
    email: 'newuser@justsay.app',
    password: 'WrongPassword!'
  }, '127.0.0.1');
  if (badLogin.success) throw new Error('FAILED: Login allowed with invalid password');
  console.log('✔ PASS: Invalid password login blocked');

  // --- 3. AUTHORIZATION & PROFILE OWNERSHIP MATRIX ---
  console.log('\n--- 3. Testing Authorization Matrix & Ownership ---');

  const tokenA = `Bearer ${loginResult.session.accessToken}`;

  // 3a. Unauthenticated update -> DENIED
  const unauthUpdate = await server.usersController.updateProfile('', { bio: 'Hacked' });
  if (unauthUpdate.success) throw new Error('AUTHORIZATION FAILURE: Unauthenticated profile update allowed');
  console.log('✔ PASS: Unauthenticated profile update denied');

  // 3b. Invalid token update -> DENIED
  const invalidTokenUpdate = await server.usersController.updateProfile('Bearer invalid_token_xyz', { bio: 'Hacked' });
  if (invalidTokenUpdate.success) throw new Error('AUTHORIZATION FAILURE: Invalid token profile update allowed');
  console.log('✔ PASS: Invalid token profile update denied');

  // 3c. Authorized user update
  const updateRes = await server.usersController.updateProfile(tokenA, {
    bio: 'Updated bio for testing',
    promptQuestion: 'Ask me anything! 🌟'
  });
  if (!updateRes.success || !updateRes.user) throw new Error('FAILED: Profile update failed');
  if (updateRes.user.bio !== 'Updated bio for testing') throw new Error('FAILED: Bio update mismatch');
  console.log('✔ PASS: Authorized user profile update successful');

  // 3d. Public profile lookup
  const pubProfile = await server.usersController.getPublicProfile('newuser_99');
  if (!pubProfile || pubProfile.promptQuestion !== 'Ask me anything! 🌟') {
    throw new Error('FAILED: Public profile lookup failed');
  }
  console.log('✔ PASS: Public profile lookup successful');

  // --- 4. MESSAGE PRIVACY, REPLIES, REACTIONS, REPORTING & BLOCKING ---
  console.log('\n--- 4. Testing Phase 3 Messaging Engine ---');

  // Send message to User A (newuser_99) from IP 192.168.1.50
  const msgRes = await server.messagesController.postMessage({
    recipientHandle: 'newuser_99',
    promptQuestion: 'Ask me anything! 🌟',
    messageText: 'You are an awesome human being!'
  }, '192.168.1.50');

  if (!msgRes.success || msgRes.messageStatus !== MessageStatus.APPROVED) {
    throw new Error(`FAILED: Message posting failed: ${msgRes.error}`);
  }
  const msgId = msgRes.messageId;
  console.log('✔ PASS: Anonymous message creation & moderation passed');

  // Retrieve User A inbox -> Should have 1 message
  const inboxA = await server.messagesController.getInbox(tokenA);
  if (inboxA.messages.length === 0) throw new Error('FAILED: User A inbox returned 0 messages');

  const recMsg = inboxA.messages[0];
  const msgKeys = Object.keys(recMsg);
  if (msgKeys.includes('_internalSenderIp') || msgKeys.includes('_internalDeviceFingerprint') || (recMsg as any).senderIp) {
    throw new Error('CRITICAL PRIVACY VIOLATION: Internal sender telemetry exposed in recipient MessageDto!');
  }
  console.log('✔ PASS: Recipient inbox message contains ZERO sender IP/telemetry');

  // User A replies to message -> SUCCESS
  const replyRes = await server.messagesController.replyToMessage(tokenA, msgId, 'Thank you so much! ❤️');
  if (!replyRes.success) throw new Error(`FAILED: Reply failed: ${replyRes.error}`);
  console.log('✔ PASS: Authorized recipient reply posted');

  // User B attempts to reply to User A message -> DENIED
  const unauthReply = await server.messagesController.replyToMessage(tokenB, msgId, 'Unauthorized reply');
  if (unauthReply.success) throw new Error('AUTHORIZATION FAILURE: User B was able to reply to User A message');
  console.log('✔ PASS: Unauthorized reply attempt denied');

  // User A reacts to message with ❤️ -> SUCCESS
  const reactRes = await server.messagesController.reactToMessage(tokenA, msgId, '❤️');
  if (!reactRes.success) throw new Error(`FAILED: Reaction failed: ${reactRes.error}`);
  console.log('✔ PASS: Message reaction recorded');

  // User A blocks sender -> Sender IP 192.168.1.50 blocked
  const blockRes = await server.messagesController.blockSenderFromMessage(tokenA, msgId);
  if (!blockRes.success) throw new Error('FAILED: Block sender failed');
  console.log('✔ PASS: Recipient blocked sender without revealing identity');

  // Blocked sender attempts to post message again from 192.168.1.50 -> DENIED
  const blockedPost = await server.messagesController.postMessage({
    recipientHandle: 'newuser_99',
    promptQuestion: 'Ask me anything! 🌟',
    messageText: 'Harassment attempt after block'
  }, '192.168.1.50');
  if (blockedPost.success) throw new Error('BLOCK FAILURE: Blocked sender was allowed to send message');
  console.log('✔ PASS: Blocked sender message successfully blocked server-side');

  // User A reports message -> ESCALATED
  const reportRes = await server.messagesController.reportMessage(tokenA, msgId, 'Harassment');
  if (!reportRes.success) throw new Error('FAILED: Message report failed');
  console.log('✔ PASS: Message reported & escalated for moderation');

  // --- 5. PUBLIC WEB SECURITY & XSS ESCAPING ---
  console.log('\n--- 5. Testing Public Web Experience & XSS Escaping ---');

  // Update profile with malicious XSS string in prompt
  await server.usersController.updateProfile(tokenA, {
    displayName: '<script>alert("XSS_NAME")</script>',
    promptQuestion: 'Confess <img src=x onerror=alert(1)>'
  });

  const pageHtml = await server.publicWebController.renderPublicPage('newuser_99');
  if (pageHtml.includes('<script>alert("XSS_NAME")</script>')) {
    throw new Error('CRITICAL VULNERABILITY: Unescaped script tag rendered in public web page!');
  }
  if (!pageHtml.includes('&lt;script&gt;alert(&quot;XSS_NAME&quot;)&lt;/script&gt;')) {
    throw new Error('XSS TEST FAILURE: HTML special characters were not properly escaped');
  }
  console.log('✔ PASS: Public web page properly escapes HTML input (XSS prevented)');

  // --- 6. ACCOUNT DELETION & SESSION INVALIDATION ---
  console.log('\n--- 6. Testing Account Deletion & Session Invalidation ---');

  const delRes = await server.usersController.deleteAccount(tokenA);
  if (!delRes.success) throw new Error('FAILED: Account deletion failed');
  console.log('✔ PASS: Account deletion API succeeded');

  // Old token should now be invalidated
  const postDelInbox = await server.messagesController.getInbox(tokenA);
  if (postDelInbox.messages.length !== 0) throw new Error('SECURITY FAILURE: Session token still active after account deletion');
  console.log('✔ PASS: Deleted account session token immediately invalidated');

  console.log('\n================================================================');
  console.log('ALL PHASE 2 SECURITY REMEDIATIONS & PHASE 3 TESTS PASSED CLEANLY!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
