package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.MarkEmailUnread
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ConfessionEntity
import com.example.ui.WhisprUiState
import com.example.ui.components.ConfessionCard

@Composable
fun InboxScreen(
    uiState: WhisprUiState,
    onFavoriteClick: (Int) -> Unit,
    onOpenStoryPreview: (ConfessionEntity) -> Unit,
    onFlagClick: (Int, Boolean) -> Unit,
    onDeleteClick: (Int) -> Unit
) {
    var selectedTab by remember { mutableStateOf("All") }

    val filteredList = remember(uiState.confessions, selectedTab) {
        when (selectedTab) {
            "Favorites" -> uiState.confessions.filter { it.isFavorite }
            "Unread" -> uiState.confessions.filter { !it.isRead }
            "Flagged" -> uiState.confessions.filter { it.isFlagged }
            else -> uiState.confessions
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0714))
            .padding(20.dp)
    ) {
        // Top Inbox Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Secret Inbox 📬",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Black
                    )
                )
                Text(
                    text = "${uiState.confessions.size} confessions received",
                    style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFFA093BA))
                )
            }

            Surface(
                color = Color(0xFFFF2A85).copy(alpha = 0.2f),
                shape = RoundedCornerShape(50)
            ) {
                Text(
                    text = "${uiState.confessions.count { !it.isRead }} New",
                    color = Color(0xFFFF2A85),
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Tabs
        val tabs = listOf("All", "Favorites 💖", "Unread 🔔", "Flagged ⚠️")
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(tabs) { tab ->
                val tabKey = when {
                    tab.startsWith("Favorites") -> "Favorites"
                    tab.startsWith("Unread") -> "Unread"
                    tab.startsWith("Flagged") -> "Flagged"
                    else -> "All"
                }
                val isSelected = tabKey == selectedTab

                Surface(
                    color = if (isSelected) Color(0xFFFF2A85) else Color(0xFF261540),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.clickable { selectedTab = tabKey }
                ) {
                    Text(
                        text = tab,
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (filteredList.isEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 40.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1B0E2E)),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Inbox,
                        contentDescription = "Empty",
                        tint = Color(0xFFA093BA),
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "No messages found in this view",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Share your link whispr.link/@${uiState.userHandle} on your social stories to get new confessions!",
                        color = Color(0xFFA093BA),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filteredList, key = { it.id }) { confession ->
                    ConfessionCard(
                        confession = confession,
                        onFavoriteClick = { onFavoriteClick(confession.id) },
                        onReplyClick = { onOpenStoryPreview(confession) },
                        onFlagClick = { onFlagClick(confession.id, !confession.isFlagged) },
                        onDeleteClick = { onDeleteClick(confession.id) },
                        showAdminActions = uiState.isAdminAuthenticated
                    )
                }
            }
        }
    }
}
