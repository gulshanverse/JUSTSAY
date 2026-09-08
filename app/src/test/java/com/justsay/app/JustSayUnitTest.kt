package com.justsay.app

import com.justsay.app.core.TokenManager
import com.justsay.app.data.repository.AdminAuthRepositoryImpl
import com.justsay.app.data.repository.ModerationServiceImpl
import com.justsay.app.domain.model.AdminRole
import com.justsay.app.domain.model.ModerationState
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class JustSayUnitTest {

    @Test
    fun testModerationService_CleanMessage_ReturnsApproved() = runBlocking {
        val moderationService = ModerationServiceImpl()
        val result = moderationService.evaluateMessage("You look amazing today!", "Medium")
        assertTrue(result.isSafe)
        assertEquals(ModerationState.APPROVED, result.recommendedState)
        assertEquals("Positive", result.sentiment)
    }

    @Test
    fun testModerationService_ToxicMessage_ReturnsSoftBlocked() = runBlocking {
        val moderationService = ModerationServiceImpl()
        val result = moderationService.evaluateMessage("I hate you so much, die!", "Medium")
        assertFalse(result.isSafe)
        assertEquals(ModerationState.SOFT_BLOCKED, result.recommendedState)
        assertEquals("Toxic/Spam", result.sentiment)
    }

    @Test
    fun testAdminAuth_InvalidToken_ReturnsUnauthorized() = runBlocking {
        val tokenManager = TokenManager()
        val dao = FakeJustSayDao()
        val authRepo = AdminAuthRepositoryImpl(dao, tokenManager)

        val success = authRepo.authenticateWithToken("invalid_token_123")
        assertFalse(success)
        val session = authRepo.getAdminSession().first()
        assertFalse(session.isAuthenticated)
        assertEquals(AdminRole.UNAUTHORIZED, session.role)
    }

    @Test
    fun testAdminAuth_ManufacturedTokens_Rejected() = runBlocking {
        val tokenManager = TokenManager()
        val dao = FakeJustSayDao()
        val authRepo = AdminAuthRepositoryImpl(dao, tokenManager)

        val manufacturedTokens = listOf(
            "admin_token_aaaaaaaaaaaaaaaa",
            "admin_token_1234567890123456",
            "Bearer aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "Bearer admin",
            "random_long_token_24_characters_long",
            "admin_guest_123456789012345678"
        )

        for (token in manufacturedTokens) {
            val success = authRepo.authenticateWithToken(token)
            assertFalse("Token $token should have been rejected", success)
            val session = authRepo.getAdminSession().first()
            assertFalse("Session for $token should not be authenticated", session.isAuthenticated)
            assertEquals(AdminRole.UNAUTHORIZED, session.role)
        }
    }

    @Test
    fun testAdminAuth_ValidKeys_AuthenticatedWithCorrectRole() = runBlocking {
        val tokenManager = TokenManager()
        val dao = FakeJustSayDao()
        val authRepo = AdminAuthRepositoryImpl(dao, tokenManager)

        // Super Admin Key
        val superSuccess = authRepo.authenticateWithToken("super_secret_key")
        assertTrue(superSuccess)
        assertEquals(AdminRole.SUPER_ADMIN, authRepo.getAdminSession().first().role)

        // Admin Key
        val adminSuccess = authRepo.authenticateWithToken("admin_secret_key")
        assertTrue(adminSuccess)
        assertEquals(AdminRole.ADMIN, authRepo.getAdminSession().first().role)

        // Moderator Key
        val modSuccess = authRepo.authenticateWithToken("moderator_key")
        assertTrue(modSuccess)
        assertEquals(AdminRole.MODERATOR, authRepo.getAdminSession().first().role)

        // Support Key
        val supportSuccess = authRepo.authenticateWithToken("support_key")
        assertTrue(supportSuccess)
        assertEquals(AdminRole.SUPPORT, authRepo.getAdminSession().first().role)
    }
}

class FakeJustSayDao : com.justsay.app.data.local.JustSayDao {
    private val messages = mutableListOf<com.justsay.app.data.local.MessageEntity>()
    private val prefs = mutableMapOf<String, String>()
    private val logs = mutableListOf<com.justsay.app.data.local.AdminLogEntity>()

    override fun getAllMessages() = kotlinx.coroutines.flow.flowOf(messages)
    override fun getFlaggedMessages() = kotlinx.coroutines.flow.flowOf(messages.filter { it.isFlagged })
    override suspend fun getMessageById(id: Int) = messages.find { it.id == id }
    override suspend fun insertMessage(message: com.justsay.app.data.local.MessageEntity): Long {
        messages.add(message)
        return messages.size.toLong()
    }
    override suspend fun updateMessage(message: com.justsay.app.data.local.MessageEntity) {
        val idx = messages.indexOfFirst { it.id == message.id }
        if (idx >= 0) messages[idx] = message
    }
    override suspend fun deleteMessage(id: Int) { messages.removeIf { it.id == id } }
    override suspend fun clearAllMessages() { messages.clear() }
    override fun getAllPreferences() = kotlinx.coroutines.flow.flowOf(prefs.map { com.justsay.app.data.local.UserPreferenceEntity(it.key, it.value) })
    override suspend fun getPreference(key: String) = prefs[key]
    override suspend fun setPreference(pref: com.justsay.app.data.local.UserPreferenceEntity) { prefs[pref.key] = pref.value }
    override fun getAdminLogs() = kotlinx.coroutines.flow.flowOf(logs)
    override suspend fun logAdminAction(log: com.justsay.app.data.local.AdminLogEntity) { logs.add(log) }
}
