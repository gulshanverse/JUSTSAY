package com.example.ui

import android.app.Application
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AdminLogEntity
import com.example.data.CardTemplateEntity
import com.example.data.ConfessionEntity
import com.example.data.UserPreferenceEntity
import com.example.data.WhisprDatabase
import com.example.data.WhisprRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class WhisprUiState(
    val confessions: List<ConfessionEntity> = emptyList(),
    val flaggedConfessions: List<ConfessionEntity> = emptyList(),
    val preferences: List<UserPreferenceEntity> = emptyList(),
    val cardTemplates: List<CardTemplateEntity> = emptyList(),
    val adminLogs: List<AdminLogEntity> = emptyList(),
    val userHandle: String = "genz_star",
    val linkClickCount: Int = 142,
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

    private val repository: WhisprRepository

    private val _userHandle = MutableStateFlow("genz_star")
    private val _isAdminAuth = MutableStateFlow(false)
    private val _safetyStrictness = MutableStateFlow("Medium")
    private val _activeQuestionPrompt = MutableStateFlow("send me honest confessions 🤫")
    private val _customGradientStart = MutableStateFlow(0xFFFF2A85)
    private val _customGradientEnd = MutableStateFlow(0xFF9B5DE5)
    private val _customTextColor = MutableStateFlow(0xFFFFFFFF)
    private val _customSticker = MutableStateFlow("🤫 Top Secret")
    private val _selectedConfession = MutableStateFlow<ConfessionEntity?>(null)
    private val _showStoryPreview = MutableStateFlow(false)
    private val _toastMessage = MutableStateFlow<String?>(null)

    init {
        val database = WhisprDatabase.getDatabase(application)
        repository = WhisprRepository(database.whispersDao())
        viewModelScope.launch {
            repository.seedSampleDataIfEmpty()
            val savedHandle = repository.getPreference("user_handle", "genz_star")
            _userHandle.value = savedHandle
            val savedStrictness = repository.getPreference("safety_strictness", "Medium")
            _safetyStrictness.value = savedStrictness
        }
    }

    val uiState: StateFlow<WhisprUiState> = combine(
        repository.allConfessions,
        repository.flaggedConfessions,
        repository.allPreferences,
        repository.cardTemplates,
        repository.adminLogs,
        _userHandle,
        _isAdminAuth,
        _safetyStrictness,
        _activeQuestionPrompt,
        _customGradientStart,
        _customGradientEnd,
        _customTextColor,
        _customSticker,
        _selectedConfession,
        _showStoryPreview,
        _toastMessage
    ) { args ->
        val confessions = args[0] as List<ConfessionEntity>
        val flagged = args[1] as List<ConfessionEntity>
        val prefs = args[2] as List<UserPreferenceEntity>
        val templates = args[3] as List<CardTemplateEntity>
        val logs = args[4] as List<AdminLogEntity>
        val handle = args[5] as String
        val isAdmin = args[6] as Boolean
        val strictness = args[7] as String
        val prompt = args[8] as String
        val gStart = args[9] as Long
        val gEnd = args[10] as Long
        val txtColor = args[11] as Long
        val sticker = args[12] as String
        val selected = args[13] as ConfessionEntity?
        val showStory = args[14] as Boolean
        val toast = args[15] as String?

        val clicks = prefs.find { it.key == "link_click_count" }?.value?.toIntOrNull() ?: 142

        WhisprUiState(
            confessions = confessions,
            flaggedConfessions = flagged,
            preferences = prefs,
            cardTemplates = templates,
            adminLogs = logs,
            userHandle = handle,
            linkClickCount = clicks,
            isAdminAuthenticated = isAdmin,
            safetyStrictness = strictness,
            activeQuestionPrompt = prompt,
            customGradientStart = gStart,
            customGradientEnd = gEnd,
            customTextColor = txtColor,
            customSticker = sticker,
            selectedConfession = selected,
            showStoryPreviewDialog = showStory,
            toastMessage = toast
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = WhisprUiState()
    )

    fun sendConfession(
        messageText: String,
        prompt: String = _activeQuestionPrompt.value,
        recipient: String = _userHandle.value
    ) {
        if (messageText.isBlank()) return
        viewModelScope.launch {
            repository.sendConfession(
                recipientHandle = recipient,
                promptQuestion = prompt,
                messageText = messageText,
                gradientStart = _customGradientStart.value,
                gradientEnd = _customGradientEnd.value,
                textColor = _customTextColor.value,
                stickerTag = _customSticker.value,
                strictnessLevel = _safetyStrictness.value
            )
            val clicks = repository.getPreference("link_click_count", "142").toIntOrNull() ?: 142
            repository.setPreference("link_click_count", (clicks + 1).toString())
            _toastMessage.value = "Confession sent anonymously! 🤫"
        }
    }

    fun markAsRead(id: Int) {
        viewModelScope.launch {
            repository.markAsRead(id)
        }
    }

    fun toggleFavorite(id: Int) {
        viewModelScope.launch {
            repository.toggleFavorite(id)
        }
    }

    fun replyToConfession(id: Int, reply: String) {
        viewModelScope.launch {
            repository.replyToConfession(id, reply)
            _toastMessage.value = "Story reply created! Ready to share 📸"
        }
    }

    fun updateFlagStatus(id: Int, isFlagged: Boolean) {
        viewModelScope.launch {
            repository.updateFlagStatus(id, isFlagged, if (isFlagged) "Manual Admin Flag" else "Approved by Admin")
            _toastMessage.value = if (isFlagged) "Message flagged as spam" else "Message approved!"
        }
    }

    fun deleteConfession(id: Int) {
        viewModelScope.launch {
            repository.deleteConfession(id)
            _toastMessage.value = "Confession deleted"
        }
    }

    fun purgeDatabase() {
        viewModelScope.launch {
            repository.purgeAllData()
            _toastMessage.value = "All database entries cleared by Admin"
        }
    }

    fun updateUserHandle(newHandle: String) {
        val clean = newHandle.lowercase().trim().replace(" ", "_")
        if (clean.isNotBlank()) {
            _userHandle.value = clean
            viewModelScope.launch {
                repository.setPreference("user_handle", clean)
                _toastMessage.value = "Handle updated to @$clean"
            }
        }
    }

    fun updateSafetyStrictness(level: String) {
        _safetyStrictness.value = level
        viewModelScope.launch {
            repository.setPreference("safety_strictness", level)
            _toastMessage.value = "AI Safety Level set to $level"
        }
    }

    fun loginAdmin(pin: String): Boolean {
        return if (pin == "admin123" || pin == "admin") {
            _isAdminAuth.value = true
            _toastMessage.value = "Admin Authenticated 🔓"
            true
        } else {
            _toastMessage.value = "Invalid Admin PIN ❌"
            false
        }
    }

    fun logoutAdmin() {
        _isAdminAuth.value = false
        _toastMessage.value = "Logged out of Admin Console"
    }

    fun setCardCustomization(gStart: Color, gEnd: Color, txtColor: Color, sticker: String, prompt: String) {
        _customGradientStart.value = gStart.toArgb().toLong()
        _customGradientEnd.value = gEnd.toArgb().toLong()
        _customTextColor.value = txtColor.toArgb().toLong()
        _customSticker.value = sticker
        _activeQuestionPrompt.value = prompt
    }

    fun openStoryPreview(confession: ConfessionEntity) {
        _selectedConfession.value = confession
        _showStoryPreview.value = true
    }

    fun closeStoryPreview() {
        _showStoryPreview.value = false
        _selectedConfession.value = null
    }

    fun clearToast() {
        _toastMessage.value = null
    }
}
