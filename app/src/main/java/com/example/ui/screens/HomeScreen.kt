package com.example.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.WhisprUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    uiState: WhisprUiState,
    onUpdateHandle: (String) -> Unit,
    onSendSimulatedConfession: (String, String) -> Unit,
    onOpenStudio: () -> Unit,
    onOpenAdminModal: () -> Unit
) {
    val clipboardManager = LocalClipboardManager.current
    var isEditingHandle by remember { mutableStateOf(false) }
    var tempHandle by remember { mutableStateOf(uiState.userHandle) }
    var selectedPrompt by remember { mutableStateOf(uiState.activeQuestionPrompt) }
    var testMessage by remember { mutableStateOf("") }
    var copyNotice by remember { mutableStateOf(false) }

    val defaultPrompts = listOf(
        "send me honest confessions 🤫",
        "what's my biggest red flag? 🚩",
        "rate my vibe 1-10 ✨",
        "spill the tea ☕",
        "what song reminds you of me? 🎵",
        "be honest, do you miss me? 💭"
    )

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0714))
            .verticalScroll(scrollState)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // App Branding Top Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "WHISPR 🤫",
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = Color(0xFFFF2A85),
                        fontWeight = FontWeight.Black,
                        letterSpacing = 2.sp
                    )
                )
                Text(
                    text = "GenZ Anonymous Confessions",
                    style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFFA093BA))
                )
            }

            Surface(
                color = Color(0xFF261540),
                shape = CircleShape,
                modifier = Modifier.clickable { onOpenAdminModal() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Lock,
                        contentDescription = "Admin Portal",
                        tint = if (uiState.isAdminAuthenticated) Color(0xFF00F5D4) else Color.Gray,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (uiState.isAdminAuthenticated) "ADMIN 🔓" else "Admin",
                        color = Color.White,
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Profile Handle Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1B0E2E))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (isEditingHandle) {
                        OutlinedTextField(
                            value = tempHandle,
                            onValueChange = { tempHandle = it },
                            label = { Text("Handle", color = Color.Gray) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = Color(0xFFFF2A85),
                                unfocusedBorderColor = Color.Gray,
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("edit_handle_input")
                        )
                        IconButton(
                            onClick = {
                                onUpdateHandle(tempHandle)
                                isEditingHandle = false
                            }
                        ) {
                            Text("Save", color = Color(0xFF00F5D4), fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Text(
                            text = "@${uiState.userHandle}",
                            style = MaterialTheme.typography.titleLarge.copy(
                                color = Color.White,
                                fontWeight = FontWeight.Black
                            )
                        )
                        IconButton(
                            onClick = {
                                tempHandle = uiState.userHandle
                                isEditingHandle = true
                            },
                            modifier = Modifier.testTag("edit_handle_btn")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Edit,
                                contentDescription = "Edit Handle",
                                tint = Color(0xFFA093BA),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Link Display Box
                val linkUrl = "whispr.link/@${uiState.userHandle}"
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(Color(0xFFFF2A85), Color(0xFF9B5DE5))
                            ),
                            shape = RoundedCornerShape(16.dp)
                        )
                        .padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Link,
                                contentDescription = "Link",
                                tint = Color.White
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = linkUrl,
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                        }

                        IconButton(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(linkUrl))
                                copyNotice = true
                            },
                            modifier = Modifier.testTag("copy_link_btn")
                        ) {
                            Icon(
                                imageVector = Icons.Default.ContentCopy,
                                contentDescription = "Copy Link",
                                tint = Color.White
                            )
                        }
                    }
                }

                AnimatedVisibility(visible = copyNotice) {
                    Text(
                        text = "✓ Link copied! Paste on Instagram / Snapchat Story",
                        color = Color(0xFF00F5D4),
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Telemetry Badges
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${uiState.linkClickCount}",
                            style = MaterialTheme.typography.titleLarge.copy(
                                color = Color(0xFF00F5D4),
                                fontWeight = FontWeight.Black
                            )
                        )
                        Text(
                            text = "Link Clicks",
                            style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFFA093BA))
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "${uiState.confessions.size}",
                            style = MaterialTheme.typography.titleLarge.copy(
                                color = Color(0xFFFF2A85),
                                fontWeight = FontWeight.Black
                            )
                        )
                        Text(
                            text = "Total Inbox",
                            style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFFA093BA))
                        )
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = uiState.safetyStrictness,
                            style = MaterialTheme.typography.titleLarge.copy(
                                color = Color(0xFFFFB703),
                                fontWeight = FontWeight.Black
                            )
                        )
                        Text(
                            text = "AI Filter",
                            style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFFA093BA))
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Prompt Selector
        Text(
            text = "Select Question Prompt 💬",
            style = MaterialTheme.typography.titleMedium.copy(
                color = Color.White,
                fontWeight = FontWeight.Bold
            ),
            modifier = Modifier.align(Alignment.Start)
        )

        Spacer(modifier = Modifier.height(10.dp))

        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(defaultPrompts) { prompt ->
                val isSelected = prompt == selectedPrompt
                Surface(
                    color = if (isSelected) Color(0xFFFF2A85) else Color(0xFF261540),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.clickable { selectedPrompt = prompt }
                ) {
                    Text(
                        text = prompt,
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Medium),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Friend Sender Preview Section
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1B0E2E))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.FlashOn,
                        contentDescription = "Test Send",
                        tint = Color(0xFFFFB703)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Simulate Confession Inbox 💌",
                        style = MaterialTheme.typography.titleMedium.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Test sending an anonymous message to @${uiState.userHandle} to see card designs in action!",
                    style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFFA093BA))
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = testMessage,
                    onValueChange = { testMessage = it },
                    placeholder = { Text("Type an anonymous confession or Q&A message...", color = Color.Gray) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFFFF2A85),
                        unfocusedBorderColor = Color.Gray,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp)
                        .testTag("test_message_input")
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Button(
                        onClick = onOpenStudio,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF261540)),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Customize Design 🎨", color = Color.White)
                    }

                    Button(
                        onClick = {
                            if (testMessage.isNotBlank()) {
                                onSendSimulatedConfession(testMessage, selectedPrompt)
                                testMessage = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF2A85)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.testTag("send_test_confession_btn")
                    ) {
                        Icon(imageVector = Icons.Default.Send, contentDescription = null, tint = Color.White)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Send Secret", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
