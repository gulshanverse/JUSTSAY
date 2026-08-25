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

    fun saveAdminToken(token: String) {
        adminToken = token
    }

    fun getAdminToken(): String? = adminToken

    fun clearAdminToken() {
        adminToken = null
    }

    fun hasValidAdminSession(): Boolean = !adminToken.isNullOrBlank()
}
