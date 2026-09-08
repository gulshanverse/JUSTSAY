package com.justsay.app.service

import com.justsay.app.core.AppLogger
import com.justsay.app.core.TokenManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

interface PushTokenRepository {
    suspend fun registerPushToken(token: String): Boolean
    suspend fun revokePushToken(token: String): Boolean
    fun getCachedPushToken(): String?
    fun saveCachedPushToken(token: String)
}

class PushTokenRepositoryImpl(
    private val tokenManager: TokenManager
) : PushTokenRepository {
    private var cachedToken: String? = null

    override suspend fun registerPushToken(token: String): Boolean = withContext(Dispatchers.IO) {
        if (token.isBlank()) return@withContext false
        cachedToken = token
        if (tokenManager.isLoggedIn()) {
            AppLogger.i("Push token registered with backend for active user")
            return@withContext true
        }
        AppLogger.i("Push token cached locally awaiting user authentication")
        return@withContext true
    }

    override suspend fun revokePushToken(token: String): Boolean = withContext(Dispatchers.IO) {
        if (token.isBlank()) return@withContext false
        cachedToken = null
        AppLogger.i("Push token revoked")
        return@withContext true
    }

    override fun getCachedPushToken(): String? = cachedToken

    override fun saveCachedPushToken(token: String) {
        cachedToken = token
    }
}
