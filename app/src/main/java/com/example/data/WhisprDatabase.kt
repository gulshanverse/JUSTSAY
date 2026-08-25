package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        ConfessionEntity::class,
        UserPreferenceEntity::class,
        CardTemplateEntity::class,
        AdminLogEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class WhisprDatabase : RoomDatabase() {
    abstract fun whispersDao(): WhisprDao

    companion object {
        @Volatile
        private var INSTANCE: WhisprDatabase? = null

        fun getDatabase(context: Context): WhisprDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    WhisprDatabase::class.java,
                    "whispr_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
