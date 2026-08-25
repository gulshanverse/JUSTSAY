package com.justsay.app.presentation

import android.app.Application
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.justsay.app.core.TokenManager
import com.justsay.app.data.local.JustSayDatabase
import com.justsay.app.data.repository.AdminAuthRepositoryImpl
import com.justsay.app.data.repository.MessageRepositoryImpl
import com.justsay.app.data.repository.ModerationServiceImpl
import com.justsay.app.data.repository.ProfileRepositoryImpl
import com.justsay.app.domain.model.AdminAuditLog
import com.justsay.app.domain.model.AdminSession
import com.justsay.app.domain.model.CardDesign
import com.justsay.app.domain.model.Message
import com.justsay.app.domain.model.UserProfile
import com.justsay.app.domain.usecase.AuthenticateAdminUseCase
import com.justsay.app.domain.usecase.DeleteMessageUseCase
import com.justsay.app.domain.usecase.FlagMessageUseCase
import com.justsay.app.domain.usecase.GetInboxMessagesUseCase
import com.justsay.app.domain.usecase.SendAnonymousMessageUseCase
import com.justsay.app.domain.usecase.ToggleFavoriteMessageUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class JustSayUiState(
    val messages: List<Message> = emptyList(),
    val flaggedMessages: List<Message> = emptyList(),
    val userProfile: UserProfile = UserProfile(),
    val adminSession: AdminSession = AdminSession(),
    val adminLogs: List<AdminAuditLog> = emptyList(),
    val safetyStrictness: String = "Medium",
    val activePrompt: String = "send me honest confessions 🤫",
    val customGradientStart: Long = 0xFFFF2A85,
    val customGradientEnd: Long = 0xFF9B5DE5,
    val customTextColor: Long = 0xFFFFFFFF,
    val customSticker: String = "🤫 Top Secret",
    val selectedMessage: Message? = null,
    val showStoryPreviewDialog: Boolean = false,
    val toastMessage: String? = null
)

class JustSayViewModel(application: Application) : AndroidViewModel(application) {

    private val db = JustSayDatabase.getDatabase(application)
    private val dao = db.dao()
    private val tokenManager = TokenManager()

    private val moderationService = ModerationServiceImpl()
    private val messageRepository = MessageRepositoryImpl(dao, moderationService)
    private val profileRepository = ProfileRepositoryImpl(dao)
    private val adminAuthRepository = AdminAuthRepositoryImpl(dao, tokenManager)

    private val getInboxMessagesUseCase = GetInboxMessagesUseCase(messageRepository)
    private val sendAnonymousMessageUseCase = SendAnonymousMessageUseCase(messageRepository, profileRepository)
    private val toggleFavoriteMessageUseCase = ToggleFavoriteMessageUseCase(messageRepository)
    private val flagMessageUseCase = FlagMessageUseCase(messageRepository)
    private val deleteMessageUseCase = DeleteMessageUseCase(messageRepository)
    private val authenticateAdminUseCase = AuthenticateAdminUseCase(adminAuthRepository)

    private val _safetyStrictness = MutableStateFlow("Medium")
    private val _activePrompt = MutableStateFlow("send me honest confessions 🤫")
    private val _customGradientStart = MutableStateFlow(0xFFFF2A85)
    private val _customGradientEnd = MutableStateFlow(0xFF9B5DE5)
    private val _customTextColor = MutableStateFlow(0xFFFFFFFF)
    private val _customSticker = MutableStateFlow("🤫 Top Secret")
    private val _selectedMessage = MutableStateFlow<Message?>(null)
    private val _showStoryPreview = MutableStateFlow(false)
    private val _toastMessage = MutableStateFlow<String?>(null)

    val uiState: StateFlow<JustSayUiState> = combine(
        getInboxMessagesUseCase(),
        messageRepository.getFlaggedMessages(),
        profileRepository.getUserProfile(),
        adminAuthRepository.getAdminSession(),
        adminAuthRepository.getAdminLogs(),
        _safetyStrictness,
        _activePrompt,
        _customGradientStart,
        _customGradientEnd,
        _customTextColor,
        _customSticker,
        _selectedMessage,
        _showStoryPreview,
        _toastMessage
    ) { args ->
        val messages = args[0] as List<Message>
        val flagged = args[1] as List<Message>
        val profile = args[2] as UserProfile
        val session = args[3] as AdminSession
        val logs = args[4] as List<AdminAuditLog>
        val strictness = args[5] as String
        val prompt = args[6] as String
        val gStart = args[7] as Long
        val gEnd = args[8] as Long
        val txtColor = args[9] as Long
        val sticker = args[10] as String
        val selected = args[11] as Message?
        val showStory = args[12] as Boolean
        val toast = args[13] as String?

        JustSayUiState(
            messages = messages,
            flaggedMessages = flagged,
            userProfile = profile,
            adminSession = session,
            adminLogs = logs,
            safetyStrictness = strictness,
            activePrompt = prompt,
            customGradientStart = gStart,
            customGradientEnd = gEnd,
            customTextColor = txtColor,
            customSticker = sticker,
            selectedMessage = selected,
            showStoryPreviewDialog = showStory,
            toastMessage = toast
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = JustSayUiState()
    )

    fun sendAnonymousMessage(text: String) {
        if (text.isBlank()) return
        viewModelScope.launch {
            val design = CardDesign(
                gradientStart = _customGradientStart.value,
                gradientEnd = _customGradientEnd.value,
                textColor = _customTextColor.value,
                stickerTag = _customSticker.value,
                promptQuestion = _activePrompt.value
            )
            sendAnonymousMessageUseCase(text, _activePrompt.value, uiState.value.userProfile.handle, design)
            _toastMessage.value = "Anonymous message sent via JUSTSAY! 🤫"
        }
    }

    fun toggleFavorite(id: Int) {
        viewModelScope.launch {
            toggleFavoriteMessageUseCase(id)
        }
    }

    fun markAsRead(id: Int) {
        viewModelScope.launch {
            messageRepository.markAsRead(id)
        }
    }

    fun replyToMessage(id: Int, reply: String) {
        viewModelScope.launch {
            messageRepository.replyToMessage(id, reply)
            _toastMessage.value = "Story reply ready for sharing 📸"
        }
    }

    fun updateFlagStatus(id: Int, isFlagged: Boolean) {
        viewModelScope.launch {
            flagMessageUseCase(id, isFlagged, if (isFlagged) "Manual Admin Flag" else "Approved by Admin")
            _toastMessage.value = if (isFlagged) "Message flagged as spam" else "Message approved!"
        }
    }

    fun deleteMessage(id: Int) {
        viewModelScope.launch {
            deleteMessageUseCase(id)
            _toastMessage.value = "Message deleted"
        }
    }

    fun purgeDatabase() {
        viewModelScope.launch {
            messageRepository.purgeAllMessages()
            _toastMessage.value = "Message records cleared"
        }
    }

    fun updateUserHandle(newHandle: String) {
        viewModelScope.launch {
            profileRepository.updateHandle(newHandle)
            _toastMessage.value = "Handle updated"
        }
    }

    fun updateSafetyStrictness(level: String) {
        _safetyStrictness.value = level
        viewModelScope.launch {
            profileRepository.setSafetyStrictness(level)
            _toastMessage.value = "AI Safety Level set to $level"
        }
    }

    fun loginAdminToken(token: String): Boolean {
        var result = false
        viewModelScope.launch {
            result = authenticateAdminUseCase(token)
            if (result) {
                _toastMessage.value = "Admin Bearer Token Authenticated 🔓"
            } else {
                _toastMessage.value = "Authentication Failed ❌"
            }
        }
        return token.isNotBlank() && (token.startsWith("Bearer ") || token.startsWith("admin_token_"))
    }

    fun logoutAdmin() {
        viewModelScope.launch {
            adminAuthRepository.logoutAdmin()
            _toastMessage.value = "Logged out of Admin Portal"
        }
    }

    fun setCardCustomization(gStart: Color, gEnd: Color, txtColor: Color, sticker: String, prompt: String) {
        _customGradientStart.value = gStart.toArgb().toLong()
        _customGradientEnd.value = gEnd.toArgb().toLong()
        _customTextColor.value = txtColor.toArgb().toLong()
        _customSticker.value = sticker
        _activePrompt.value = prompt
    }

    fun openStoryPreview(message: Message) {
        _selectedMessage.value = message
        _showStoryPreview.value = true
    }

    fun closeStoryPreview() {
        _showStoryPreview.value = false
        _selectedMessage.value = null
    }

    fun clearToast() {
        _toastMessage.value = null
    }
}
