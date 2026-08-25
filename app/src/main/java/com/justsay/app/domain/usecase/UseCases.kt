package com.justsay.app.domain.usecase

import com.justsay.app.domain.model.CardDesign
import com.justsay.app.domain.model.Message
import com.justsay.app.domain.repository.AdminAuthRepository
import com.justsay.app.domain.repository.MessageRepository
import com.justsay.app.domain.repository.ProfileRepository

class GetInboxMessagesUseCase(private val repository: MessageRepository) {
    operator fun invoke() = repository.getInboxMessages()
}

class SendAnonymousMessageUseCase(
    private val messageRepository: MessageRepository,
    private val profileRepository: ProfileRepository
) {
    suspend operator fun invoke(messageText: String, prompt: String, recipient: String, cardDesign: CardDesign): Message {
        val msg = messageRepository.sendAnonymousMessage(messageText, prompt, recipient, cardDesign)
        profileRepository.incrementLinkClicks()
        return msg
    }
}

class ToggleFavoriteMessageUseCase(private val repository: MessageRepository) {
    suspend operator fun invoke(id: Int) = repository.toggleFavorite(id)
}

class FlagMessageUseCase(private val repository: MessageRepository) {
    suspend operator fun invoke(id: Int, isFlagged: Boolean, reason: String = "") = repository.updateFlagStatus(id, isFlagged, reason)
}

class DeleteMessageUseCase(private val repository: MessageRepository) {
    suspend operator fun invoke(id: Int) = repository.deleteMessage(id)
}

class AuthenticateAdminUseCase(private val adminAuthRepository: AdminAuthRepository) {
    suspend operator fun invoke(token: String): Boolean = adminAuthRepository.authenticateWithToken(token)
}
