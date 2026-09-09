package com.justsay.app.data.remote

import com.justsay.app.core.ApiConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.GET
import java.util.concurrent.TimeUnit

interface JustSayApiService {
    @GET("api/v1/health")
    suspend fun getHealth(): Map<String, Any>

    @GET("api/v1/health/readiness")
    suspend fun getReadiness(): Map<String, Any>

    companion object {
        fun create(baseUrl: String = ApiConfig.baseUrl): JustSayApiService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .build()

            val normalizedBaseUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

            return Retrofit.Builder()
                .baseUrl(normalizedBaseUrl)
                .client(client)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()
                .create(JustSayApiService::class.java)
        }
    }
}
