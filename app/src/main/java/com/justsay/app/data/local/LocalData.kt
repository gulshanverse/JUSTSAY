package com.justsay.app.data.local

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "messages")
data class MessageEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val recipientHandle: String = "user",
    val promptQuestion: String = "send me honest confessions 🤫",
    val messageText: String,
    val timestamp: Long = System.currentTimeMillis(),
    val cardGradientStart: Long = 0xFFFF2A85,
    val cardGradientEnd: Long = 0xFF9B5DE5,
    val textColor: Long = 0xFFFFFFFF,
    val stickerTag: String = "🤫 Top Secret",
    val senderHint: String = "Sent via JUSTSAY Web Client",
    val isRead: Boolean = false,
    val isFavorite: Boolean = false,
    val isFlagged: Boolean = false,
    val flagReason: String = "",
    val sentiment: String = "Neutral",
    val replyText: String = "",
    val moderationStateName: String = "APPROVED"
)

@Entity(tableName = "user_preferences")
data class UserPreferenceEntity(
    @PrimaryKey val key: String,
    val value: String
)

@Entity(tableName = "admin_logs")
data class AdminLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val action: String,
    val details: String,
    val timestamp: Long = System.currentTimeMillis(),
    val severity: String = "INFO"
)

@Entity(tableName = "card_templates")
data class CardTemplateEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val gradientStartHex: String,
    val gradientEndHex: String,
    val textColorHex: String,
    val sticker: String,
    val category: String
)

@Dao
interface JustSayDao {
    @Query("SELECT * FROM messages ORDER BY timestamp DESC")
    fun getAllMessages(): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE isFlagged = 1 ORDER BY timestamp DESC")
    fun getFlaggedMessages(): Flow<List<MessageEntity>>

    @Query("SELECT * FROM messages WHERE id = :id")
    suspend fun getMessageById(id: Int): MessageEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(message: MessageEntity): Long

    @Update
    suspend fun updateMessage(message: MessageEntity)

    @Query("DELETE FROM messages WHERE id = :id")
    suspend fun deleteMessage(id: Int)

    @Query("DELETE FROM messages")
    suspend fun clearAllMessages()

    @Query("SELECT * FROM user_preferences")
    fun getAllPreferences(): Flow<List<UserPreferenceEntity>>

    @Query("SELECT value FROM user_preferences WHERE key = :key")
    suspend fun getPreference(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setPreference(pref: UserPreferenceEntity)

    @Query("SELECT * FROM admin_logs ORDER BY timestamp DESC")
    fun getAdminLogs(): Flow<List<AdminLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun logAdminAction(log: AdminLogEntity)
}

@Database(
    entities = [
        MessageEntity::class,
        UserPreferenceEntity::class,
        AdminLogEntity::class,
        CardTemplateEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class JustSayDatabase : RoomDatabase() {
    abstract fun dao(): JustSayDao

    companion object {
        @Volatile
        private var INSTANCE: JustSayDatabase? = null

        fun getDatabase(context: Context): JustSayDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    JustSayDatabase::class.java,
                    "justsay_local_cache.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
