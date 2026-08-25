package com.justsay.app.domain.repository

import com.justsay.app.domain.model.AdminAuditLog
import com.justsay.app.domain.model.AdminSession
import com.justsay.app.domain.model.CardDesign
import com.justsay.app.domain.model.Message
import com.justsay.app.domain.model.ModerationState
import com.justsay.app.domain.model.UserProfile
import kotlinx.coroutines.flow.Flow

interface MessageRepository {
    fun getInboxMessages(): Flow<List<Message>>
    fun getFlaggedMessages(): Flow<List<Message>>
    suspend fun sendAnonymousMessage(messageText: String, prompt: String, recipient: String, cardDesign: CardDesign): Message
    suspend fun markAsRead(id: Int)
    suspend fun toggleFavorite(id: Int)
    suspend fun replyToMessage(id: Int, reply: String)
    suspend fun updateFlagStatus(id: Int, isFlagged: Boolean, reason: String)
    suspend fun deleteMessage(id: Int)
    suspend fun purgeAllMessages()
}

interface ProfileRepository {
    fun getUserProfile(): Flow<UserProfile>
    suspend fun updateHandle(newHandle: String)
    suspend fun incrementLinkClicks()
    suspend fun getSafetyStrictness(): String
    suspend fun setSafetyStrictness(level: String)
}

interface ModerationService {
    suspend fun evaluateMessage(messageText: String, strictnessLevel: String): ModerationEvaluationResult
}

data class ModerationEvaluationResult(
    val isSafe: Boolean,
    val flagReason: String,
    val sentiment: String,
    val recommendedState: ModerationState
)

interface AdminAuthRepository {
    fun getAdminSession(): Flow<AdminSession>
    suspend fun authenticateWithToken(token: String): Boolean
    suspend fun logoutAdmin()
    fun getAdminLogs(): Flow<List<AdminAuditLog>>
    suspend fun logAdminAction(action: String, details: String, severity: String)
}

interface FeatureFlagRepository {
    fun isFeatureEnabled(flagKey: String): Boolean
}
