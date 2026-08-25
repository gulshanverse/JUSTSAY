package com.justsay.app.domain.model

enum class ModerationState {
    PENDING,
    APPROVED,
    SOFT_BLOCKED,
    REJECTED,
    ESCALATED
}

enum class AdminRole {
    SUPER_ADMIN,
    MODERATOR,
    UNAUTHORIZED
}

data class Message(
    val id: Int = 0,
    val recipientHandle: String = "user",
    val promptQuestion: String = "send me honest confessions 🤫",
    val messageText: String,
    val timestamp: Long = System.currentTimeMillis(),
    val cardGradientStart: Long = 0xFFFF2A85,
    val cardGradientEnd: Long = 0xFF9B5DE5,
    val textColor: Long = 0xFFFFFFFF,
    val stickerTag: String = "🤫 Top Secret",
    val senderHint: String = "Sent via JUSTSAY Web Client",
    val isRead: Boolean = false,
    val isFavorite: Boolean = false,
    val isFlagged: Boolean = false,
    val flagReason: String = "",
    val sentiment: String = "Neutral",
    val replyText: String = "",
    val moderationState: ModerationState = ModerationState.APPROVED
)

data class UserProfile(
    val handle: String = "user",
    val displayName: String = "JUSTSAY Member",
    val bio: String = "Ask me anything anonymously! 🤫",
    val activePrompt: String = "send me honest confessions 🤫",
    val linkClicks: Int = 0
) {
    val promptQuestion: String get() = activePrompt
}

data class CardDesign(
    val gradientStart: Long = 0xFFFF2A85,
    val gradientEnd: Long = 0xFF9B5DE5,
    val textColor: Long = 0xFFFFFFFF,
    val stickerTag: String = "🤫 Top Secret",
    val promptQuestion: String = "send me honest confessions 🤫"
)

data class AdminAuditLog(
    val id: Int = 0,
    val action: String,
    val details: String,
    val timestamp: Long = System.currentTimeMillis(),
    val severity: String = "INFO"
)

data class AdminSession(
    val isAuthenticated: Boolean = false,
    val role: AdminRole = AdminRole.UNAUTHORIZED,
    val token: String = ""
)

data class FeatureFlag(
    val key: String,
    val isEnabled: Boolean
)
