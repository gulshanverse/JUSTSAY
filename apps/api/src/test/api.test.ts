import { AdminController } from '../modules/admin/admin.controller';
import { MessagesController } from '../modules/messages/messages.controller';
import { ServerModerationService } from '../modules/moderation/moderation.service';
import { ValidationRules } from '@justsay/validation';
import { ModerationStatus, AdminRole } from '@justsay/shared-types';

async function runTests() {
  console.log('Running JUSTSAY Backend Authorization & Validation Tests...');

  // 1. Unauthenticated Admin Login -> DENIED
  const adminController = new AdminController();
  const unauthResult = await adminController.loginAdmin({ authToken: '' });
  if (unauthResult.authenticated || unauthResult.role !== 'UNAUTHORIZED') {
    throw new Error('FAILED: Unauthenticated admin access was not DENIED');
  }
  console.log('✔ Test 1 PASS: Unauthenticated admin request DENIED');

  // 2. Normal User Invalid Token -> DENIED
  const invalidTokenResult = await adminController.loginAdmin({ authToken: 'user_token_123' });
  if (invalidTokenResult.authenticated) {
    throw new Error('FAILED: Normal user granted admin access');
  }
  console.log('✔ Test 2 PASS: Normal user token admin request DENIED');

  // 3. Valid Bearer Token -> SUPER_ADMIN
  const validAdminResult = await adminController.loginAdmin({ authToken: 'Bearer valid_jwt_secret_token' });
  if (!validAdminResult.authenticated || validAdminResult.role !== AdminRole.SUPER_ADMIN) {
    throw new Error('FAILED: Valid bearer token failed to grant SUPER_ADMIN');
  }
  console.log('✔ Test 3 PASS: Valid Bearer token granted SUPER_ADMIN session');

  // 4. Validation Rules
  const emptyVal = ValidationRules.validateMessageText('');
  if (emptyVal.isValid) throw new Error('FAILED: Empty message passed validation');

  const longVal = ValidationRules.validateMessageText('a'.repeat(501));
  if (longVal.isValid) throw new Error('FAILED: Overly long message passed validation');
  console.log('✔ Test 4 PASS: Validation rules correctly enforce message bounds');

  // 5. Server Moderation Engine
  const modService = new ServerModerationService();
  const cleanMod = await modService.evaluateMessage('Hello, this is a nice anonymous confession!');
  if (cleanMod.status !== ModerationStatus.APPROVED) {
    throw new Error('FAILED: Clean message was not APPROVED');
  }

  const toxicMod = await modService.evaluateMessage('I hate you and want to kill you');
  if (toxicMod.status !== ModerationStatus.SOFT_BLOCKED) {
    throw new Error('FAILED: Toxic message was not SOFT_BLOCKED');
  }
  console.log('✔ Test 5 PASS: Server moderation service correctly flags toxic content');

  console.log('\nALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
