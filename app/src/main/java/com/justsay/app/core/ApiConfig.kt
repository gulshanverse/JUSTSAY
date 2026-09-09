package com.justsay.app.core

import com.example.BuildConfig

object ApiConfig {
    val baseUrl: String
        get() = try {
            if (BuildConfig.API_BASE_URL.isNotBlank()) BuildConfig.API_BASE_URL else "https://justsay-xk66.onrender.com"
        } catch (e: Throwable) {
            "https://justsay-xk66.onrender.com"
        }

    val isStaging: Boolean
        get() = baseUrl.contains("onrender.com") || baseUrl.contains("staging")
}
