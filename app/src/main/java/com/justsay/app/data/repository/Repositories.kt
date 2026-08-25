package com.justsay.app.data.repository

import com.justsay.app.core.TokenManager
import com.justsay.app.data.local.AdminLogEntity
import com.justsay.app.data.local.JustSayDao
import com.justsay.app.data.local.MessageEntity
import com.justsay.app.data.local.UserPreferenceEntity
import com.justsay.app.domain.model.AdminAuditLog
import com.justsay.app.domain.model.AdminRole
import com.justsay.app.domain.model.AdminSession
import com.justsay.app.domain.model.CardDesign
import com.justsay.app.domain.model.Message
import com.justsay.app.domain.model.ModerationState
import com.justsay.app.domain.model.UserProfile
import com.justsay.app.domain.repository.AdminAuthRepository
import com.justsay.app.domain.repository.AuthRepository
import com.justsay.app.domain.repository.AuthResult
import com.justsay.app.domain.repository.FeatureFlagRepository
import com.justsay.app.domain.repository.HandleCheckResult
import com.justsay.app.domain.repository.MessageRepository
import com.justsay.app.domain.repository.ModerationEvaluationResult
import com.justsay.app.domain.repository.ModerationService
import com.justsay.app.domain.repository.ProfileRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map

class AuthRepositoryImpl(
    private val dao: JustSayDao,
    private val tokenManager: TokenManager
) : AuthRepository {

    override fun isUserLoggedIn(): Boolean {
        return tokenManager.isLoggedIn()
    }

    override fun getCurrentUserHandle(): String {
        return tokenManager.getCurrentHandle()
    }

    override suspend fun register(
        email: String,
        password: String,
        handle: String,
        displayName: String
    ): AuthResult {
        val cleanHandle = handle.lowercase().trim()
        val reserved = setOf("admin", "justsay", "official", "support", "help", "mod", "system", "root")

        if (cleanHandle.length < 3 || cleanHandle.length > 30) {
            return AuthResult(success = false, error = "Handle must be between 3 and 30 characters")
        }
        if (!cleanHandle.matches(Regex("^[a-z0-9_]+$"))) {
            return AuthResult(success = false, error = "Handle can only contain lowercase letters, numbers, and underscores")
        }
        if (reserved.contains(cleanHandle)) {
            return AuthResult(success = false, error = "Handle '$cleanHandle' is reserved")
        }

        val mockAccessToken = "jwt_access_${System.currentTimeMillis()}"
        val mockRefreshToken = "jwt_refresh_${System.currentTimeMillis()}"

        tokenManager.saveUserSession(mockAccessToken, mockRefreshToken, cleanHandle)
        dao.setPreference(UserPreferenceEntity("user_handle", cleanHandle))
        dao.setPreference(UserPreferenceEntity("display_name", displayName.ifBlank { cleanHandle }))
        dao.setPreference(UserPreferenceEntity("user_email", email))

        return AuthResult(
            success = true,
            userHandle = cleanHandle,
            accessToken = mockAccessToken
        )
    }

    override suspend fun login(email: String, password: String): AuthResult {
        if (!email.contains("@") || password.length < 8) {
            return AuthResult(success = false, error = "Invalid email or password")
        }

        val existingHandle = dao.getPreference("user_handle") ?: "user"
        val mockAccessToken = "jwt_access_${System.currentTimeMillis()}"
        val mockRefreshToken = "jwt_refresh_${System.currentTimeMillis()}"

        tokenManager.saveUserSession(mockAccessToken, mockRefreshToken, existingHandle)

        return AuthResult(
            success = true,
            userHandle = existingHandle,
            accessToken = mockAccessToken
        )
    }

    override suspend fun logout() {
        tokenManager.clearUserSession()
    }

    override suspend fun deleteAccount(): Boolean {
        tokenManager.clearUserSession()
        dao.clearAllMessages()
        dao.setPreference(UserPreferenceEntity("user_handle", "user"))
        return true
    }
}

class MessageRepositoryImpl(
    private val dao: JustSayDao,
    private val moderationService: ModerationService
) : MessageRepository {

    override fun getInboxMessages(): Flow<List<Message>> {
        return dao.getAllMessages().map { entities ->
            entities.map { it.toDomainModel() }
        }
    }

    override fun getFlaggedMessages(): Flow<List<Message>> {
        return dao.getFlaggedMessages().map { entities ->
            entities.map { it.toDomainModel() }
        }
    }

    override suspend fun sendAnonymousMessage(
        messageText: String,
        prompt: String,
        recipient: String,
        cardDesign: CardDesign
    ): Message {
        val strictness = dao.getPreference("safety_strictness") ?: "Medium"
        val modResult = moderationService.evaluateMessage(messageText, strictness)

        val coarseHints = listOf(
            "Sent via Web Client 🌐",
            "Sent late night 🌙",
            "From someone who follows your profile ✨",
            "Sent via Mobile Web 📱"
        )
        val hint = coarseHints.random()

        val entity = MessageEntity(
            recipientHandle = recipient,
            promptQuestion = prompt,
            messageText = messageText,
            timestamp = System.currentTimeMillis(),
            cardGradientStart = cardDesign.gradientStart,
            cardGradientEnd = cardDesign.gradientEnd,
            textColor = cardDesign.textColor,
            stickerTag = cardDesign.stickerTag,
            senderHint = hint,
            isRead = false,
            isFavorite = false,
            isFlagged = !modResult.isSafe,
            flagReason = modResult.flagReason,
            sentiment = modResult.sentiment,
            moderationStateName = modResult.recommendedState.name
        )

        val newId = dao.insertMessage(entity).toInt()
        if (!modResult.isSafe) {
            dao.logAdminAction(
                AdminLogEntity(
                    action = "SAFETY_FLAG",
                    details = "Auto-flagged message ID #$newId: ${modResult.flagReason}",
                    severity = "WARNING"
                )
            )
        }
        return entity.copy(id = newId).toDomainModel()
    }

    override suspend fun markAsRead(id: Int) {
        val existing = dao.getMessageById(id) ?: return
        dao.updateMessage(existing.copy(isRead = true))
    }

    override suspend fun toggleFavorite(id: Int) {
        val existing = dao.getMessageById(id) ?: return
        dao.updateMessage(existing.copy(isFavorite = !existing.isFavorite))
    }

    override suspend fun replyToMessage(id: Int, reply: String) {
        val existing = dao.getMessageById(id) ?: return
        dao.updateMessage(existing.copy(replyText = reply))
    }

    override suspend fun updateFlagStatus(id: Int, isFlagged: Boolean, reason: String) {
        val existing = dao.getMessageById(id) ?: return
        val newState = if (isFlagged) ModerationState.SOFT_BLOCKED else ModerationState.APPROVED
        dao.updateMessage(existing.copy(
            isFlagged = isFlagged,
            flagReason = reason,
            moderationStateName = newState.name
        ))
        dao.logAdminAction(
            AdminLogEntity(
                action = if (isFlagged) "MODERATION_FLAG" else "MODERATION_APPROVE",
                details = "Updated status for message #$id to ${newState.name}",
                severity = if (isFlagged) "WARNING" else "INFO"
            )
        )
    }

    override suspend fun deleteMessage(id: Int) {
        dao.deleteMessage(id)
        dao.logAdminAction(
            AdminLogEntity(
                action = "DELETE_MESSAGE",
                details = "Deleted message #$id",
                severity = "WARNING"
            )
        )
    }

    override suspend fun purgeAllMessages() {
        dao.clearAllMessages()
        dao.logAdminAction(
            AdminLogEntity(
                action = "PURGE_ALL",
                details = "Purged all database message records",
                severity = "SECURITY"
            )
        )
    }
}

class ProfileRepositoryImpl(private val dao: JustSayDao) : ProfileRepository {
    override fun getUserProfile(): Flow<UserProfile> {
        return dao.getAllPreferences().map { prefs ->
            val handle = prefs.find { it.key == "user_handle" }?.value ?: "user"
            val displayName = prefs.find { it.key == "display_name" }?.value ?: "JUSTSAY Member"
            val bio = prefs.find { it.key == "bio" }?.value ?: "Ask me anything anonymously! 🤫"
            val prompt = prefs.find { it.key == "active_prompt" }?.value ?: "send me honest confessions 🤫"
            val clicks = prefs.find { it.key == "link_click_count" }?.value?.toIntOrNull() ?: 0
            UserProfile(
                handle = handle,
                displayName = displayName,
                bio = bio,
                activePrompt = prompt,
                linkClicks = clicks
            )
        }
    }

    override suspend fun checkHandleAvailability(handle: String): HandleCheckResult {
        val clean = handle.lowercase().trim()
        val reserved = setOf("admin", "justsay", "official", "support", "help", "mod", "system", "root")

        if (clean.length < 3 || clean.length > 30) {
            return HandleCheckResult(clean, false, "Must be 3-30 characters")
        }
        if (!clean.matches(Regex("^[a-z0-9_]+$"))) {
            return HandleCheckResult(clean, false, "Only letters, numbers & underscores allowed")
        }
        if (reserved.contains(clean)) {
            return HandleCheckResult(clean, false, "Reserved handle")
        }
        return HandleCheckResult(clean, true)
    }

    override suspend fun updateHandle(newHandle: String) {
        val clean = newHandle.lowercase().trim().replace(" ", "_")
        if (clean.isNotBlank()) {
            dao.setPreference(UserPreferenceEntity("user_handle", clean))
        }
    }

    override suspend fun updateProfileDetails(
        displayName: String,
        bio: String,
        promptQuestion: String,
        anonymousEnabled: Boolean,
        allowImages: Boolean,
        allowReplies: Boolean,
        allowReactions: Boolean,
        isPublic: Boolean
    ): Boolean {
        dao.setPreference(UserPreferenceEntity("display_name", displayName))
        dao.setPreference(UserPreferenceEntity("bio", bio))
        dao.setPreference(UserPreferenceEntity("active_prompt", promptQuestion))
        dao.setPreference(UserPreferenceEntity("anonymous_enabled", anonymousEnabled.toString()))
        dao.setPreference(UserPreferenceEntity("allow_images", allowImages.toString()))
        dao.setPreference(UserPreferenceEntity("allow_replies", allowReplies.toString()))
        dao.setPreference(UserPreferenceEntity("allow_reactions", allowReactions.toString()))
        dao.setPreference(UserPreferenceEntity("is_public", isPublic.toString()))
        return true
    }

    override suspend fun incrementLinkClicks() {
        val current = dao.getPreference("link_click_count")?.toIntOrNull() ?: 0
        dao.setPreference(UserPreferenceEntity("link_click_count", (current + 1).toString()))
    }

    override suspend fun getSafetyStrictness(): String {
        return dao.getPreference("safety_strictness") ?: "Medium"
    }

    override suspend fun setSafetyStrictness(level: String) {
        dao.setPreference(UserPreferenceEntity("safety_strictness", level))
    }
}

class ModerationServiceImpl : ModerationService {
    private val toxicKeywords = listOf(
        "hate you", "stupid", "idiot", "die", "loser", "ugly", "threat",
        "kill", "attack", "abuse", "creep", "stalk", "scam", "trash"
    )

    private val positiveKeywords = listOf(
        "love", "cute", "crush", "amazing", "best", "sweet", "pretty",
        "awesome", "fun", "cool", "kind", "legend", "vibes", "slay", "beautiful"
    )

    override suspend fun evaluateMessage(
        messageText: String,
        strictnessLevel: String
    ): ModerationEvaluationResult {
        val lowerText = messageText.lowercase()
        val foundToxic = toxicKeywords.filter { lowerText.contains(it) }

        val threshold = when (strictnessLevel) {
            "Strict" -> 1
            "Low" -> 3
            else -> 1
        }

        if (foundToxic.size >= threshold) {
            return ModerationEvaluationResult(
                isSafe = false,
                flagReason = "Harmful pattern detected: [${foundToxic.joinToString(", ")}]",
                sentiment = "Toxic/Spam",
                recommendedState = ModerationState.SOFT_BLOCKED
            )
        }

        val foundPositive = positiveKeywords.filter { lowerText.contains(it) }
        val sentiment = when {
            foundPositive.isNotEmpty() -> "Positive"
            messageText.length > 50 -> "Deep Confession"
            else -> "Neutral"
        }

        return ModerationEvaluationResult(
            isSafe = true,
            flagReason = "",
            sentiment = sentiment,
            recommendedState = ModerationState.APPROVED
        )
    }
}

class AdminAuthRepositoryImpl(
    private val dao: JustSayDao,
    private val tokenManager: TokenManager
) : AdminAuthRepository {

    private val _sessionFlow = MutableStateFlow(AdminSession())

    override fun getAdminSession(): Flow<AdminSession> = _sessionFlow.asStateFlow()

    override suspend fun authenticateWithToken(token: String): Boolean {
        val isValidToken = token.isNotBlank() && (token.startsWith("Bearer ") || token.startsWith("admin_token_"))
        
        if (isValidToken) {
            tokenManager.saveAdminToken(token)
            val session = AdminSession(
                isAuthenticated = true,
                role = AdminRole.SUPER_ADMIN,
                token = token
            )
            _sessionFlow.value = session
            dao.logAdminAction(
                AdminLogEntity(
                    action = "ADMIN_AUTHENTICATED",
                    details = "Admin session authenticated via RBAC token",
                    severity = "SECURITY"
                )
            )
            return true
        } else {
            _sessionFlow.value = AdminSession()
            return false
        }
    }

    override suspend fun logoutAdmin() {
        tokenManager.clearAdminToken()
        _sessionFlow.value = AdminSession()
        dao.logAdminAction(
            AdminLogEntity(
                action = "ADMIN_LOGOUT",
                details = "Admin logged out",
                severity = "INFO"
            )
        )
    }

    override fun getAdminLogs(): Flow<List<AdminAuditLog>> {
        return dao.getAdminLogs().map { entities ->
            entities.map {
                AdminAuditLog(
                    id = it.id,
                    action = it.action,
                    details = it.details,
                    timestamp = it.timestamp,
                    severity = it.severity
                )
            }
        }
    }

    override suspend fun logAdminAction(action: String, details: String, severity: String) {
        dao.logAdminAction(AdminLogEntity(action = action, details = details, severity = severity))
    }
}

class FeatureFlagRepositoryImpl : FeatureFlagRepository {
    private val flags = mapOf(
        "card_studio_v2" to true,
        "image_uploads" to false,
        "anonymous_replies" to true,
        "ai_moderation_v2" to true,
        "story_export_v2" to true
    )

    override fun isFeatureEnabled(flagKey: String): Boolean {
        return flags[flagKey] ?: false
    }
}

fun MessageEntity.toDomainModel(): Message {
    val state = try {
        ModerationState.valueOf(moderationStateName)
    } catch (e: Exception) {
        if (isFlagged) ModerationState.SOFT_BLOCKED else ModerationState.APPROVED
    }
    return Message(
        id = id,
        recipientHandle = recipientHandle,
        promptQuestion = promptQuestion,
        messageText = messageText,
        timestamp = timestamp,
        cardGradientStart = cardGradientStart,
        cardGradientEnd = cardGradientEnd,
        textColor = textColor,
        stickerTag = stickerTag,
        senderHint = senderHint,
        isRead = isRead,
        isFavorite = isFavorite,
        isFlagged = isFlagged,
        flagReason = flagReason,
        sentiment = sentiment,
        replyText = replyText,
        moderationState = state
    )
}
