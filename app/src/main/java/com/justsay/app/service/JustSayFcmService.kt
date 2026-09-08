package com.justsay.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.MainActivity
import com.example.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.justsay.app.core.AppLogger

class JustSayFcmService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        // PRIVACY ENFORCEMENT: Never log or display FCM device tokens in plaintext logs or analytics
        AppLogger.i("FCM token refreshed (token length: ${token.length})")

        getSharedPreferences("fcm_prefs", Context.MODE_PRIVATE)
            .edit()
            .putString("fcm_token", token)
            .apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        // PRIVACY ENFORCEMENT:
        // FCM push notifications MUST NOT contain raw confession text, sender identity, IP,
        // device fingerprint, or moderation metadata. Use generic non-sensitive preview strings.
        val type = remoteMessage.data["type"] ?: "new_message"

        val title = when (type) {
            "message_reply" -> "New Reply to Confession 💬"
            "message_reaction" -> "New Reaction Received ❤️"
            "moderation_update" -> "Safety Status Update 🛡️"
            else -> "New Anonymous Confession 🤫"
        }

        val body = when (type) {
            "message_reply" -> "Someone replied to your JUSTSAY story."
            "message_reaction" -> "Someone reacted to your confession."
            "moderation_update" -> "An update regarding your reported content is available."
            else -> "You received a new JUSTSAY message."
        }

        showNotification(title, body, type)
    }

    private fun showNotification(title: String, body: String, type: String) {
        val channelId = "justsay_push_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "JUSTSAY Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Anonymous messages and social updates"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("nav_destination", "inbox")
            putExtra("notification_type", type)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }
}
