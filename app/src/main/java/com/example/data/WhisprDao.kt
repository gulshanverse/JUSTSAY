package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface WhisprDao {
    // Confessions
    @Query("SELECT * FROM confessions ORDER BY timestamp DESC")
    fun getAllConfessions(): Flow<List<ConfessionEntity>>

    @Query("SELECT * FROM confessions WHERE isFlagged = 1 ORDER BY timestamp DESC")
    fun getFlaggedConfessions(): Flow<List<ConfessionEntity>>

    @Query("SELECT * FROM confessions WHERE id = :id")
    suspend fun getConfessionById(id: Int): ConfessionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConfession(confession: ConfessionEntity): Long

    @Update
    suspend fun updateConfession(confession: ConfessionEntity)

    @Query("DELETE FROM confessions WHERE id = :id")
    suspend fun deleteConfession(id: Int)

    @Query("DELETE FROM confessions")
    suspend fun clearAllConfessions()

    // Preferences
    @Query("SELECT * FROM user_preferences")
    fun getAllPreferences(): Flow<List<UserPreferenceEntity>>

    @Query("SELECT value FROM user_preferences WHERE key = :key")
    suspend fun getPreference(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setPreference(pref: UserPreferenceEntity)

    // Templates
    @Query("SELECT * FROM card_templates")
    fun getAllTemplates(): Flow<List<CardTemplateEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTemplate(template: CardTemplateEntity)

    // Admin Logs
    @Query("SELECT * FROM admin_logs ORDER BY timestamp DESC")
    fun getAdminLogs(): Flow<List<AdminLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun logAdminAction(log: AdminLogEntity)
}
