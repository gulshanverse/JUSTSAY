package com.justsay.app.presentation.screens

import android.content.Context
import android.content.Intent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.justsay.app.core.AnalyticsLogger
import com.justsay.app.domain.model.UserProfile
import com.justsay.app.domain.repository.AuthRepository
import com.justsay.app.domain.repository.ProfileRepository
import com.justsay.app.presentation.components.*
import com.justsay.app.presentation.theme.JustSayColors
import com.justsay.app.presentation.theme.JustSayCornerRadius
import com.justsay.app.presentation.theme.JustSaySpacing
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    profileRepository: ProfileRepository,
    authRepository: AuthRepository,
    onLogout: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()

    val profileState by profileRepository.getUserProfile().collectAsState(initial = UserProfile())

    var showEditSheet by remember { mutableStateOf(false) }
    var showQrDialog by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var toastMessage by remember { mutableStateOf<String?>(null) }

    // Configurable public base URL (Default: https://justsay.app)
    val baseUrl = "https://justsay.app"
    val anonymousLink = "$baseUrl/@${profileState.handle}"

    // Edit profile state fields
    var editDisplayName by remember { mutableStateOf(profileState.displayName) }
    var editBio by remember { mutableStateOf(profileState.bio) }
    var editPrompt by remember { mutableStateOf(profileState.activePrompt) }
    var anonymousEnabled by remember { mutableStateOf(true) }
    var allowImages by remember { mutableStateOf(false) }
    var allowReplies by remember { mutableStateOf(true) }
    var allowReactions by remember { mutableStateOf(true) }
    var isPublicProfile by remember { mutableStateOf(true) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(JustSayColors.Background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(JustSaySpacing.Large),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header Profile Card
            JustSayCard {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    JustSayAvatar(name = profileState.handle, size = 80.dp)
                    Spacer(modifier = Modifier.height(JustSaySpacing.Medium))
                    Text(
                        text = editDisplayName,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "@${profileState.handle}",
                        style = MaterialTheme.typography.bodyMedium.copy(color = JustSayColors.TextSecondary)
                    )
                    Spacer(modifier = Modifier.height(JustSaySpacing.Small))
                    Text(
                        text = editBio,
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(JustSaySpacing.Medium))
                    Row(horizontalArrangement = Arrangement.spacedBy(JustSaySpacing.Small)) {
                        JustSayBadge(
                            text = if (anonymousEnabled) "🔒 Accepting Anonymous" else "🚫 Messages Paused",
                            backgroundColor = if (anonymousEnabled) JustSayColors.SurfaceHighlight else JustSayColors.Error.copy(alpha = 0.2f),
                            textColor = if (anonymousEnabled) JustSayColors.Success else JustSayColors.Error
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(JustSaySpacing.Large))

            // Anonymous Link & Prompt Card
            JustSayCard {
                Text(
                    text = "YOUR ANONYMOUS LINK",
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = JustSayColors.Primary,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Small))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(JustSayColors.SurfaceVariant, shape = RoundedCornerShape(JustSayCornerRadius.Medium))
                        .padding(JustSaySpacing.Medium)
                ) {
                    Text(
                        text = anonymousLink,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold, color = JustSayColors.TextPrimary),
                        modifier = Modifier.testTag("anonymous_link_text")
                    )
                }

                Spacer(modifier = Modifier.height(JustSaySpacing.Medium))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(JustSaySpacing.Small),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    JustSayButton(
                        text = "Copy Link 📋",
                        onClick = {
                            clipboardManager.setText(AnnotatedString(anonymousLink))
                            toastMessage = "Link copied to clipboard!"
                            AnalyticsLogger.logEvent("link_copied", mapOf("handle" to profileState.handle))
                        },
                        modifier = Modifier.weight(1f),
                        testTag = "copy_link_button"
                    )
                    JustSayButton(
                        text = "Share 📤",
                        onClick = {
                            val sendIntent = Intent().apply {
                                action = Intent.ACTION_SEND
                                putExtra(Intent.EXTRA_TEXT, "Send me an anonymous confession! 🤫\n$anonymousLink")
                                type = "text/plain"
                            }
                            context.startActivity(Intent.createChooser(sendIntent, "Share JUSTSAY Link"))
                            AnalyticsLogger.logEvent("link_shared", mapOf("handle" to profileState.handle))
                        },
                        modifier = Modifier.weight(1f),
                        isSecondary = true,
                        testTag = "share_link_button"
                    )
                }

                Spacer(modifier = Modifier.height(JustSaySpacing.Small))

                Row(
                    horizontalArrangement = Arrangement.spacedBy(JustSaySpacing.Small),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    JustSayButton(
                        text = "Show QR Code 📱",
                        onClick = { showQrDialog = true },
                        modifier = Modifier.weight(1f),
                        isSecondary = true
                    )
                }
            }

            Spacer(modifier = Modifier.height(JustSaySpacing.Large))

            // Active Prompt Card
            JustSayCard {
                Text(
                    text = "CURRENT ANONYMOUS PROMPT",
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = JustSayColors.TextSecondary,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Small))
                Text(
                    text = profileState.promptQuestion,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Medium))
                JustSayButton(
                    text = "Edit Profile & Prompt ✏️",
                    onClick = { showEditSheet = true },
                    isSecondary = true,
                    testTag = "edit_profile_button"
                )
            }

            Spacer(modifier = Modifier.height(JustSaySpacing.Large))

            // Danger & Account Operations Card
            JustSayCard {
                Text(
                    text = "ACCOUNT & PRIVACY",
                    style = MaterialTheme.typography.labelMedium.copy(
                        color = JustSayColors.TextMuted,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Medium))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(JustSaySpacing.Small),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    JustSayButton(
                        text = "Log Out 🚪",
                        onClick = {
                            coroutineScope.launch {
                                authRepository.logout()
                                onLogout()
                            }
                        },
                        modifier = Modifier.weight(1f),
                        isSecondary = true,
                        testTag = "logout_button"
                    )
                    JustSayButton(
                        text = "Delete Account 🗑️",
                        onClick = { showDeleteDialog = true },
                        modifier = Modifier.weight(1f),
                        isSecondary = true
                    )
                }
            }
        }

        // Toast feedback popup
        toastMessage?.let { msg ->
            LaunchedEffect(msg) {
                kotlinx.coroutines.delay(2500)
                toastMessage = null
            }
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 80.dp)
                    .clip(RoundedCornerShape(JustSayCornerRadius.Full))
                    .background(JustSayColors.SurfaceHighlight)
                    .padding(horizontal = 20.dp, vertical = 10.dp)
            ) {
                Text(text = msg, style = MaterialTheme.typography.labelLarge.copy(color = Color.White))
            }
        }
    }

    // QR Code Dialog
    if (showQrDialog) {
        AlertDialog(
            onDismissRequest = { showQrDialog = false },
            confirmButton = {
                TextButton(onClick = { showQrDialog = false }) { Text("Close", color = JustSayColors.Primary) }
            },
            title = { Text("Your QR Code", style = MaterialTheme.typography.titleLarge) },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    JustSayQRCodeView(url = anonymousLink, size = 200.dp)
                    Spacer(modifier = Modifier.height(JustSaySpacing.Medium))
                    Text(
                        text = "@${profileState.handle}",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }
            },
            containerColor = JustSayColors.Surface
        )
    }

    // Edit Profile Modal Bottom Sheet
    if (showEditSheet) {
        ModalBottomSheet(
            onDismissRequest = { showEditSheet = false },
            containerColor = JustSayColors.Surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(JustSaySpacing.Large)
                    .verticalScroll(rememberScrollState())
            ) {
                Text("Edit Profile & Privacy Settings", style = MaterialTheme.typography.titleLarge)
                Spacer(modifier = Modifier.height(JustSaySpacing.Large))

                JustSayTextField(
                    value = editDisplayName,
                    onValueChange = { editDisplayName = it },
                    label = "Display Name",
                    placeholder = "Display Name"
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Medium))

                JustSayTextField(
                    value = editBio,
                    onValueChange = { editBio = it },
                    label = "Bio",
                    placeholder = "Bio"
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Medium))

                JustSayTextField(
                    value = editPrompt,
                    onValueChange = { editPrompt = it },
                    label = "Anonymous Message Prompt",
                    placeholder = "send me honest confessions 🤫"
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Large))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Allow Anonymous Messages", style = MaterialTheme.typography.bodyLarge)
                    Switch(
                        checked = anonymousEnabled,
                        onCheckedChange = { anonymousEnabled = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = JustSayColors.Primary)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Allow Anonymous Replies", style = MaterialTheme.typography.bodyLarge)
                    Switch(
                        checked = allowReplies,
                        onCheckedChange = { allowReplies = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = JustSayColors.Primary)
                    )
                }

                Spacer(modifier = Modifier.height(JustSaySpacing.ExtraLarge))

                JustSayButton(
                    text = "Save Changes ✨",
                    onClick = {
                        coroutineScope.launch {
                            profileRepository.updateProfileDetails(
                                editDisplayName,
                                editBio,
                                editPrompt,
                                anonymousEnabled,
                                allowImages,
                                allowReplies,
                                allowReactions,
                                isPublicProfile
                            )
                            showEditSheet = false
                            toastMessage = "Profile updated successfully!"
                        }
                    }
                )
                Spacer(modifier = Modifier.height(JustSaySpacing.Huge))
            }
        }
    }

    // Delete Account Confirmation Dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        coroutineScope.launch {
                            authRepository.deleteAccount()
                            showDeleteDialog = false
                            onLogout()
                        }
                    }
                ) { Text("Permanently Delete", color = JustSayColors.Error, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) { Text("Cancel", color = JustSayColors.TextSecondary) }
            },
            title = { Text("Delete Account?", style = MaterialTheme.typography.titleLarge.copy(color = JustSayColors.Error)) },
            text = { Text("This action will permanently purge all your messages, profile settings, and @handle reservation. This cannot be undone.", style = MaterialTheme.typography.bodyMedium) },
            containerColor = JustSayColors.Surface
        )
    }
}
