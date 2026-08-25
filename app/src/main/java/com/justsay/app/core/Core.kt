package com.justsay.app.core

import android.util.Log

sealed class Resource<out T> {
    data class Success<out T>(val data: T) : Resource<T>()
    data class Error(val message: String, val cause: Throwable? = null) : Resource<Nothing>()
    object Loading : Resource<Nothing>()
}

object AppLogger {
    private const val TAG = "JUSTSAY"

    fun d(message: String) {
        Log.d(TAG, message)
    }

    fun e(message: String, throwable: Throwable? = null) {
        Log.e(TAG, message, throwable)
    }

    fun i(message: String) {
        Log.i(TAG, message)
    }
}

class TokenManager {
    private var adminToken: String? = null
    private var userAccessToken: String? = null
    private var userRefreshToken: String? = null
    private var currentHandle: String = "user"

    fun saveAdminToken(token: String) {
        adminToken = token
    }

    fun getAdminToken(): String? = adminToken

    fun clearAdminToken() {
        adminToken = null
    }

    fun hasValidAdminSession(): Boolean = !adminToken.isNullOrBlank()

    fun saveUserSession(accessToken: String, refreshToken: String, handle: String) {
        this.userAccessToken = accessToken
        this.userRefreshToken = refreshToken
        this.currentHandle = handle
    }

    fun getUserAccessToken(): String? = userAccessToken

    fun getUserRefreshToken(): String? = userRefreshToken

    fun getCurrentHandle(): String = currentHandle

    fun clearUserSession() {
        this.userAccessToken = null
        this.userRefreshToken = null
        this.currentHandle = "user"
    }

    fun isLoggedIn(): Boolean = !userAccessToken.isNullOrBlank()
}

object AnalyticsLogger {
    private val eventHistory = mutableListOf<String>()
    private val sensitiveKeys = setOf("password", "token", "accesstoken", "refreshtoken", "secret", "authorization", "messagetext", "ip", "devicefingerprint")

    fun logEvent(eventName: String, properties: Map<String, String> = emptyMap()) {
        val sanitized = properties.mapValues { (key, value) ->
            if (sensitiveKeys.contains(key.lowercase())) "[REDACTED]" else value
        }
        val entry = "[$eventName] ${sanitized.entries.joinToString { "${it.key}=${it.value}" }}"
        eventHistory.add(entry)
        AppLogger.i("ANALYTICS: $entry")
    }

    fun getHistory(): List<String> = eventHistory.toList()
}
