package com.example.data

import com.example.util.SafetyEngine
import kotlinx.coroutines.flow.Flow

class WhisprRepository(private val dao: WhisprDao) {

    val allConfessions: Flow<List<ConfessionEntity>> = dao.getAllConfessions()
    val flaggedConfessions: Flow<List<ConfessionEntity>> = dao.getFlaggedConfessions()
    val allPreferences: Flow<List<UserPreferenceEntity>> = dao.getAllPreferences()
    val cardTemplates: Flow<List<CardTemplateEntity>> = dao.getAllTemplates()
    val adminLogs: Flow<List<AdminLogEntity>> = dao.getAdminLogs()

    suspend fun sendConfession(
        recipientHandle: String,
        promptQuestion: String,
        messageText: String,
        gradientStart: Long,
        gradientEnd: Long,
        textColor: Long,
        stickerTag: String,
        strictnessLevel: String = "Medium"
    ): Long {
        val check = SafetyEngine.analyzeMessage(messageText, strictnessLevel)
        val hint = SafetyEngine.sampleHints.random()

        val confession = ConfessionEntity(
            recipientHandle = recipientHandle,
            promptQuestion = promptQuestion,
            messageText = messageText,
            timestamp = System.currentTimeMillis(),
            cardGradientStart = gradientStart,
            cardGradientEnd = gradientEnd,
            textColor = textColor,
            stickerTag = stickerTag,
            senderHint = hint,
            isRead = false,
            isFavorite = false,
            isFlagged = !check.isSafe,
            flagReason = check.flagReason,
            sentiment = check.sentiment
        )
        val id = dao.insertConfession(confession)
        if (!check.isSafe) {
            dao.logAdminAction(
                AdminLogEntity(
                    action = "SAFETY_FLAG",
                    details = "Auto-flagged message ID #$id: ${check.flagReason}",
                    severity = "WARNING"
                )
            )
        }
        return id
    }

    suspend fun markAsRead(id: Int) {
        val existing = dao.getConfessionById(id) ?: return
        dao.updateConfession(existing.copy(isRead = true))
    }

    suspend fun toggleFavorite(id: Int) {
        val existing = dao.getConfessionById(id) ?: return
        dao.updateConfession(existing.copy(isFavorite = !existing.isFavorite))
    }

    suspend fun replyToConfession(id: Int, reply: String) {
        val existing = dao.getConfessionById(id) ?: return
        dao.updateConfession(existing.copy(replyText = reply))
    }

    suspend fun updateFlagStatus(id: Int, isFlagged: Boolean, reason: String = "") {
        val existing = dao.getConfessionById(id) ?: return
        dao.updateConfession(existing.copy(isFlagged = isFlagged, flagReason = reason))
        dao.logAdminAction(
            AdminLogEntity(
                action = if (isFlagged) "MODERATION_FLAG" else "MODERATION_APPROVE",
                details = "Admin updated status for confession #$id to ${if (isFlagged) "FLAGGED" else "APPROVED"}",
                severity = if (isFlagged) "WARNING" else "INFO"
            )
        )
    }

    suspend fun deleteConfession(id: Int) {
        dao.deleteConfession(id)
        dao.logAdminAction(
            AdminLogEntity(
                action = "DELETE_CONFESSION",
                details = "Deleted confession #$id",
                severity = "WARNING"
            )
        )
    }

    suspend fun purgeAllData() {
        dao.clearAllConfessions()
        dao.logAdminAction(
            AdminLogEntity(
                action = "PURGE_ALL",
                details = "Admin purged all database confession records",
                severity = "SECURITY"
            )
        )
    }

    suspend fun getPreference(key: String, defaultValue: String): String {
        return dao.getPreference(key) ?: defaultValue
    }

    suspend fun setPreference(key: String, value: String) {
        dao.setPreference(UserPreferenceEntity(key, value))
    }

    suspend fun seedSampleDataIfEmpty() {
        val existingPref = dao.getPreference("user_handle")
        if (existingPref == null) {
            dao.setPreference(UserPreferenceEntity("user_handle", "user"))
            dao.setPreference(UserPreferenceEntity("safety_strictness", "Medium"))
            dao.setPreference(UserPreferenceEntity("link_click_count", "0"))
            dao.setPreference(UserPreferenceEntity("active_theme", "Neon Cyber"))

            // Sample confessions
            val samples = listOf(
                ConfessionEntity(
                    recipientHandle = "user",
                    promptQuestion = "send me honest confessions 🤫",
                    messageText = "I've had a crush on you since high school chemistry class! 💖",
                    cardGradientStart = 0xFFFF2A85,
                    cardGradientEnd = 0xFF9B5DE5,
                    stickerTag = "💖 Crush Alert",
                    senderHint = "Sent via Web Client 🌐",
                    sentiment = "Positive"
                ),
                ConfessionEntity(
                    recipientHandle = "user",
                    promptQuestion = "what's my biggest red flag? 🚩",
                    messageText = "Honestly? You take 4 hours to reply to texts even when you're active online 💀",
                    cardGradientStart = 0xFFFF7B00,
                    cardGradientEnd = 0xFFFF0266,
                    stickerTag = "💀 Crying",
                    senderHint = "From someone who follows your profile ✨",
                    sentiment = "Neutral"
                ),
                ConfessionEntity(
                    recipientHandle = "user",
                    promptQuestion = "rate my vibe 1-10 ✨",
                    messageText = "Absolute 11/10 main character energy! Keep slaying! 💅✨",
                    cardGradientStart = 0xFF00F5D4,
                    cardGradientEnd = 0xFF7B2CBF,
                    stickerTag = "💅 Slay",
                    senderHint = "Sent late night 🌙",
                    sentiment = "Positive",
                    isFavorite = true
                ),
                ConfessionEntity(
                    recipientHandle = "user",
                    promptQuestion = "spill the tea ☕",
                    messageText = "Your ex was seen at the music festival with someone who looks just like you...",
                    cardGradientStart = 0xFF9B5DE5,
                    cardGradientEnd = 0xFF240046,
                    stickerTag = "👀 Spill The Tea",
                    senderHint = "Sent via Mobile Web 📱",
                    sentiment = "Neutral"
                ),
                ConfessionEntity(
                    recipientHandle = "user",
                    promptQuestion = "send me honest confessions 🤫",
                    messageText = "You are a total loser and no one likes you!",
                    cardGradientStart = 0xFF3A0CA3,
                    cardGradientEnd = 0xFF4361EE,
                    stickerTag = "⚠️ Flagged",
                    senderHint = "Auto-flagged toxic content",
                    isFlagged = true,
                    flagReason = "Harmful pattern detected: [loser]",
                    sentiment = "Toxic/Spam"
                )
            )

            for (sample in samples) {
                dao.insertConfession(sample)
            }

            // Sample templates
            val templates = listOf(
                CardTemplateEntity(name = "Neon Cyber", gradientStartHex = "#FF2A85", gradientEndHex = "#9B5DE5", textColorHex = "#FFFFFF", sticker = "🤫 Top Secret", category = "Neon"),
                CardTemplateEntity(name = "Sunset Glow", gradientStartHex = "#FF7B00", gradientEndHex = "#FF0266", textColorHex = "#FFFFFF", sticker = "💖 Crush Alert", category = "Warm"),
                CardTemplateEntity(name = "Acid Cyan", gradientStartHex = "#00F5D4", gradientEndHex = "#7B2CBF", textColorHex = "#FFFFFF", sticker = "💅 Slay", category = "Cyber"),
                CardTemplateEntity(name = "Midnight Velvet", gradientStartHex = "#3A0CA3", gradientEndHex = "#10002B", textColorHex = "#FFFFFF", sticker = "👀 Spill The Tea", category = "Dark"),
                CardTemplateEntity(name = "Pastel Mint", gradientStartHex = "#70E400", gradientEndHex = "#38B000", textColorHex = "#10002B", sticker = "🔥 No Cap", category = "Pastel")
            )
            for (t in templates) {
                dao.insertTemplate(t)
            }

            // Initial log
            dao.logAdminAction(
                AdminLogEntity(
                    action = "SYSTEM_INIT",
                    details = "Whispr GenZ Anonymous Database initialized with seed dataset",
                    severity = "INFO"
                )
            )
        }
    }
}
