package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Storage
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
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
import com.example.ui.WhisprUiState
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AdminDashboardScreen(
    uiState: WhisprUiState,
    onUpdateStrictness: (String) -> Unit,
    onApproveMessage: (Int) -> Unit,
    onDeleteMessage: (Int) -> Unit,
    onPurgeDatabase: () -> Unit,
    onLogoutAdmin: () -> Unit,
    onOpenPinModal: () -> Unit
) {
    if (!uiState.isAdminAuthenticated) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF0D0714))
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.AdminPanelSettings,
                contentDescription = "Admin Lock",
                tint = Color(0xFF00F5D4),
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "Admin Access Required 🔒",
                style = MaterialTheme.typography.headlineSmall.copy(
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Authenticate with your admin pin to view user logs, moderation queue, database telemetry & system settings.",
                color = Color(0xFFA093BA),
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(horizontal = 16.dp)
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onOpenPinModal,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00F5D4)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth(0.8f)
                    .height(48.dp)
                    .testTag("open_admin_pin_btn")
            ) {
                Icon(imageVector = Icons.Default.LockOpen, contentDescription = null, tint = Color.Black)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Enter Master PIN", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
        return
    }

    val dateFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0714))
            .verticalScroll(scrollState)
            .padding(20.dp)
    ) {
        // Top Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.AdminPanelSettings,
                    contentDescription = "Admin",
                    tint = Color(0xFF00F5D4),
                    modifier = Modifier.size(32.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "Admin Control Suite 🛡️",
                        style = MaterialTheme.typography.titleLarge.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Black
                        )
                    )
                    Text(
                        text = "Database Telemetry & Moderation Engine",
                        style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFF00F5D4))
                    )
                }
            }

            IconButton(
                onClick = onLogoutAdmin,
                modifier = Modifier.testTag("admin_logout_btn")
            ) {
                Text("Exit 🚪", color = Color.Gray, style = MaterialTheme.typography.labelMedium)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // System Telemetry Metrics Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1B0E2E))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Storage, contentDescription = "Storage", tint = Color(0xFFFF2A85))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("SYSTEM METRICS TELEMETRY", color = Color.White, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                }

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${uiState.confessions.size}", color = Color(0xFF00F5D4), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black))
                        Text("Total Messages", color = Color(0xFFA093BA), style = MaterialTheme.typography.labelSmall)
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${uiState.flaggedConfessions.size}", color = Color(0xFFFF0054), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black))
                        Text("Flagged Abuse", color = Color(0xFFA093BA), style = MaterialTheme.typography.labelSmall)
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("${uiState.adminLogs.size}", color = Color(0xFFFFB703), style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black))
                        Text("Audit Logs", color = Color(0xFFA093BA), style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Safety Filter Strictness Controls
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1B0E2E))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.Security, contentDescription = "Safety", tint = Color(0xFF00F5D4))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("AI SAFETY FILTER STRICTNESS", color = Color.White, style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                }

                Spacer(modifier = Modifier.height(10.dp))

                val levels = listOf("Low", "Medium", "Strict")
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    levels.forEach { lvl ->
                        val isSelected = lvl == uiState.safetyStrictness
                        Surface(
                            color = if (isSelected) Color(0xFF00F5D4) else Color(0xFF261540),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { onUpdateStrictness(lvl) }
                        ) {
                            Text(
                                text = lvl,
                                color = if (isSelected) Color.Black else Color.White,
                                style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                modifier = Modifier.padding(vertical = 10.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Flagged Moderation Queue
        Text(
            text = "Flagged Moderation Queue (${uiState.flaggedConfessions.size})",
            style = MaterialTheme.typography.titleMedium.copy(color = Color.White, fontWeight = FontWeight.Bold)
        )

        Spacer(modifier = Modifier.height(8.dp))

        if (uiState.flaggedConfessions.isEmpty()) {
            Surface(
                color = Color(0xFF1B0E2E),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "✓ Moderation queue is clean. No pending flagged messages.",
                    color = Color(0xFF38B000),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(16.dp)
                )
            }
        } else {
            uiState.flaggedConfessions.forEach { flagged ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF2B123A))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Reason: ${flagged.flagReason}",
                                color = Color(0xFFFF0054),
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = "ID #${flagged.id}",
                                color = Color.Gray,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = flagged.messageText,
                            color = Color.White,
                            style = MaterialTheme.typography.bodyMedium
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            OutlinedButton(
                                onClick = { onApproveMessage(flagged.id) },
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF38B000), modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Approve", color = Color(0xFF38B000))
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            Button(
                                onClick = { onDeleteMessage(flagged.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF0054)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Delete", color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // System Audit Logs
        Text(
            text = "Audit Logs Telemetry",
            style = MaterialTheme.typography.titleMedium.copy(color = Color.White, fontWeight = FontWeight.Bold)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF150924))
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                uiState.adminLogs.take(8).forEach { log ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                color = when (log.severity) {
                                    "WARNING" -> Color(0xFFFFB703)
                                    "SECURITY" -> Color(0xFFFF0054)
                                    else -> Color(0xFF00F5D4)
                                },
                                shape = CircleShape
                            ) {
                                Box(modifier = Modifier.size(8.dp))
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "[${log.action}] ${log.details}",
                                    color = Color.White,
                                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp)
                                )
                            }
                        }
                        Text(
                            text = dateFormat.format(Date(log.timestamp)),
                            color = Color.Gray,
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp)
                        )
                    }
                    HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Database Maintenance Purge Button
        Button(
            onClick = onPurgeDatabase,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF0054)),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .testTag("purge_db_btn")
        ) {
            Icon(imageVector = Icons.Default.DeleteForever, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Purge All Confession Records (Admin Only)", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}
