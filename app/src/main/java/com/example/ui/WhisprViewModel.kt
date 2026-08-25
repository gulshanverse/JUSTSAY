package com.example.ui

import android.app.Application
import androidx.compose.ui.graphics.Color
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AdminLogEntity
import com.example.data.CardTemplateEntity
import com.example.data.ConfessionEntity
import com.example.data.UserPreferenceEntity
import com.justsay.app.presentation.JustSayViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn

data class WhisprUiState(
    val confessions: List<ConfessionEntity> = emptyList(),
    val flaggedConfessions: List<ConfessionEntity> = emptyList(),
    val preferences: List<UserPreferenceEntity> = emptyList(),
    val cardTemplates: List<CardTemplateEntity> = emptyList(),
    val adminLogs: List<AdminLogEntity> = emptyList(),
    val userHandle: String = "user",
    val linkClickCount: Int = 0,
    val isAdminAuthenticated: Boolean = false,
    val safetyStrictness: String = "Medium",
    val activeQuestionPrompt: String = "send me honest confessions 🤫",
    val customGradientStart: Long = 0xFFFF2A85,
    val customGradientEnd: Long = 0xFF9B5DE5,
    val customTextColor: Long = 0xFFFFFFFF,
    val customSticker: String = "🤫 Top Secret",
    val selectedConfession: ConfessionEntity? = null,
    val showStoryPreviewDialog: Boolean = false,
    val toastMessage: String? = null
)

class WhisprViewModel(application: Application) : AndroidViewModel(application) {

    private val justSayViewModel = JustSayViewModel(application)

    val uiState: StateFlow<WhisprUiState> = justSayViewModel.uiState.map { state ->
        val confessions = state.messages.map { msg ->
            ConfessionEntity(
                id = msg.id,
                recipientHandle = msg.recipientHandle,
                promptQuestion = msg.promptQuestion,
                messageText = msg.messageText,
                timestamp = msg.timestamp,
                cardGradientStart = msg.cardGradientStart,
                cardGradientEnd = msg.cardGradientEnd,
                textColor = msg.textColor,
                stickerTag = msg.stickerTag,
                senderHint = msg.senderHint,
                isRead = msg.isRead,
                isFavorite = msg.isFavorite,
                isFlagged = msg.isFlagged,
                flagReason = msg.flagReason,
                sentiment = msg.sentiment,
                replyText = msg.replyText
            )
        }
        val flagged = confessions.filter { it.isFlagged }
        val logs = state.adminLogs.map { log ->
            AdminLogEntity(
                id = log.id,
                action = log.action,
                details = log.details,
                timestamp = log.timestamp,
                severity = log.severity
            )
        }
        val sel = state.selectedMessage?.let { msg ->
            ConfessionEntity(
                id = msg.id,
                recipientHandle = msg.recipientHandle,
                promptQuestion = msg.promptQuestion,
                messageText = msg.messageText,
                timestamp = msg.timestamp,
                cardGradientStart = msg.cardGradientStart,
                cardGradientEnd = msg.cardGradientEnd,
                textColor = msg.textColor,
                stickerTag = msg.stickerTag,
                senderHint = msg.senderHint,
                isRead = msg.isRead,
                isFavorite = msg.isFavorite,
                isFlagged = msg.isFlagged,
                flagReason = msg.flagReason,
                sentiment = msg.sentiment,
                replyText = msg.replyText
            )
        }

        WhisprUiState(
            confessions = confessions,
            flaggedConfessions = flagged,
            adminLogs = logs,
            userHandle = state.userProfile.handle,
            linkClickCount = state.userProfile.linkClicks,
            isAdminAuthenticated = state.adminSession.isAuthenticated,
            safetyStrictness = state.safetyStrictness,
            activeQuestionPrompt = state.activePrompt,
            customGradientStart = state.customGradientStart,
            customGradientEnd = state.customGradientEnd,
            customTextColor = state.customTextColor,
            customSticker = state.customSticker,
            selectedConfession = sel,
            showStoryPreviewDialog = state.showStoryPreviewDialog,
            toastMessage = state.toastMessage
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = WhisprUiState()
    )

    fun sendConfession(text: String, prompt: String = "", recipient: String = "") {
        justSayViewModel.sendAnonymousMessage(text)
    }

    fun markAsRead(id: Int) {
        justSayViewModel.markAsRead(id)
    }

    fun toggleFavorite(id: Int) {
        justSayViewModel.toggleFavorite(id)
    }

    fun replyToConfession(id: Int, reply: String) {
        justSayViewModel.replyToMessage(id, reply)
    }

    fun updateFlagStatus(id: Int, isFlagged: Boolean) {
        justSayViewModel.updateFlagStatus(id, isFlagged)
    }

    fun deleteConfession(id: Int) {
        justSayViewModel.deleteMessage(id)
    }

    fun purgeDatabase() {
        justSayViewModel.purgeDatabase()
    }

    fun updateUserHandle(newHandle: String) {
        justSayViewModel.updateUserHandle(newHandle)
    }

    fun updateSafetyStrictness(level: String) {
        justSayViewModel.updateSafetyStrictness(level)
    }

    fun loginAdmin(token: String): Boolean {
        return justSayViewModel.loginAdminToken(token)
    }

    fun logoutAdmin() {
        justSayViewModel.logoutAdmin()
    }

    fun setCardCustomization(gStart: Color, gEnd: Color, txtColor: Color, sticker: String, prompt: String) {
        justSayViewModel.setCardCustomization(gStart, gEnd, txtColor, sticker, prompt)
    }

    fun openStoryPreview(confession: ConfessionEntity) {
        val msg = stateMessageFromEntity(confession)
        justSayViewModel.openStoryPreview(msg)
    }

    fun closeStoryPreview() {
        justSayViewModel.closeStoryPreview()
    }

    fun clearToast() {
        justSayViewModel.clearToast()
    }

    private fun stateMessageFromEntity(entity: ConfessionEntity) = com.justsay.app.domain.model.Message(
        id = entity.id,
        recipientHandle = entity.recipientHandle,
        promptQuestion = entity.promptQuestion,
        messageText = entity.messageText,
        timestamp = entity.timestamp,
        cardGradientStart = entity.cardGradientStart,
        cardGradientEnd = entity.cardGradientEnd,
        textColor = entity.textColor,
        stickerTag = entity.stickerTag,
        senderHint = entity.senderHint,
        isRead = entity.isRead,
        isFavorite = entity.isFavorite,
        isFlagged = entity.isFlagged,
        flagReason = entity.flagReason,
        sentiment = entity.sentiment,
        replyText = entity.replyText
    )
}
