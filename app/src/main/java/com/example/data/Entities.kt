package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "confessions")
data class ConfessionEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val recipientHandle: String = "genz_star",
    val promptQuestion: String = "send me honest confessions 🤫",
    val messageText: String,
    val timestamp: Long = System.currentTimeMillis(),
    val cardGradientStart: Long = 0xFFFF2A85, // Color ARGB
    val cardGradientEnd: Long = 0xFF9B5DE5,
    val textColor: Long = 0xFFFFFFFF,
    val stickerTag: String = "🤫 Top Secret",
    val senderHint: String = "Sent via Whispr App • iOS 18",
    val isRead: Boolean = false,
    val isFavorite: Boolean = false,
    val isFlagged: Boolean = false,
    val flagReason: String = "",
    val sentiment: String = "Positive",
    val replyText: String = "",
    val imageUri: String = ""
)

@Entity(tableName = "user_preferences")
data class UserPreferenceEntity(
    @PrimaryKey val key: String,
    val value: String
)

@Entity(tableName = "card_templates")
data class CardTemplateEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val gradientStartHex: String,
    val gradientEndHex: String,
    val textColorHex: String,
    val sticker: String,
    val category: String
)

@Entity(tableName = "admin_logs")
data class AdminLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val action: String,
    val details: String,
    val timestamp: Long = System.currentTimeMillis(),
    val severity: String = "INFO"
)
