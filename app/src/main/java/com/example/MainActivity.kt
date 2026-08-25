package com.example

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AdminPanelSettings
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.Badge
import androidx.compose.material3.BadgedBox
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.WhisprViewModel
import com.example.ui.components.AdminPinModal
import com.example.ui.components.StoryExportDialog
import com.example.ui.screens.AdminDashboardScreen
import com.example.ui.screens.CardStudioScreen
import com.example.ui.screens.HomeScreen
import com.example.ui.screens.InboxScreen
import com.example.ui.theme.WhisprTheme

class MainActivity : ComponentActivity() {

    private val viewModel: WhisprViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            WhisprTheme {
                WhisprApp(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun WhisprApp(viewModel: WhisprViewModel) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var currentScreen by remember { mutableStateOf("Home") }
    var showAdminPinModal by remember { mutableStateOf(false) }

    val context = LocalContext.current

    LaunchedEffect(uiState.toastMessage) {
        uiState.toastMessage?.let { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            viewModel.clearToast()
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0714)),
        bottomBar = {
            NavigationBar(
                containerColor = Color(0xFF1B0E2E),
                contentColor = Color.White,
                modifier = Modifier
                    .navigationBarsPadding()
                    .testTag("bottom_nav_bar")
            ) {
                // Home Tab
                NavigationBarItem(
                    selected = currentScreen == "Home",
                    onClick = { currentScreen = "Home" },
                    icon = { Icon(imageVector = Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home", fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFFF2A85),
                        selectedTextColor = Color(0xFFFF2A85),
                        indicatorColor = Color(0xFF261540),
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    ),
                    modifier = Modifier.testTag("nav_item_home")
                )

                // Inbox Tab with Unread Badge
                NavigationBarItem(
                    selected = currentScreen == "Inbox",
                    onClick = { currentScreen = "Inbox" },
                    icon = {
                        val unreadCount = uiState.confessions.count { !it.isRead }
                        if (unreadCount > 0) {
                            BadgedBox(
                                badge = {
                                    Badge(containerColor = Color(0xFFFF2A85), contentColor = Color.White) {
                                        Text("$unreadCount")
                                    }
                                }
                            ) {
                                Icon(imageVector = Icons.Default.Inbox, contentDescription = "Inbox")
                            }
                        } else {
                            Icon(imageVector = Icons.Default.Inbox, contentDescription = "Inbox")
                        }
                    },
                    label = { Text("Inbox", fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFFF2A85),
                        selectedTextColor = Color(0xFFFF2A85),
                        indicatorColor = Color(0xFF261540),
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    ),
                    modifier = Modifier.testTag("nav_item_inbox")
                )

                // Card Studio Tab
                NavigationBarItem(
                    selected = currentScreen == "Studio",
                    onClick = { currentScreen = "Studio" },
                    icon = { Icon(imageVector = Icons.Default.Palette, contentDescription = "Studio") },
                    label = { Text("Studio", fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFFFF2A85),
                        selectedTextColor = Color(0xFFFF2A85),
                        indicatorColor = Color(0xFF261540),
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    ),
                    modifier = Modifier.testTag("nav_item_studio")
                )

                // Admin Tab
                NavigationBarItem(
                    selected = currentScreen == "Admin",
                    onClick = { currentScreen = "Admin" },
                    icon = {
                        Icon(
                            imageVector = Icons.Default.AdminPanelSettings,
                            contentDescription = "Admin",
                            tint = if (uiState.isAdminAuthenticated) Color(0xFF00F5D4) else Color.Gray
                        )
                    },
                    label = { Text("Admin", fontWeight = FontWeight.Bold) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = Color(0xFF00F5D4),
                        selectedTextColor = Color(0xFF00F5D4),
                        indicatorColor = Color(0xFF261540),
                        unselectedIconColor = Color.Gray,
                        unselectedTextColor = Color.Gray
                    ),
                    modifier = Modifier.testTag("nav_item_admin")
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (currentScreen) {
                "Home" -> HomeScreen(
                    uiState = uiState,
                    onUpdateHandle = { viewModel.updateUserHandle(it) },
                    onSendSimulatedConfession = { text, prompt -> viewModel.sendConfession(text, prompt) },
                    onOpenStudio = { currentScreen = "Studio" },
                    onOpenAdminModal = { showAdminPinModal = true }
                )
                "Inbox" -> InboxScreen(
                    uiState = uiState,
                    onFavoriteClick = { id -> viewModel.toggleFavorite(id) },
                    onOpenStoryPreview = { confession -> viewModel.openStoryPreview(confession) },
                    onFlagClick = { id, flag -> viewModel.updateFlagStatus(id, flag) },
                    onDeleteClick = { id -> viewModel.deleteConfession(id) }
                )
                "Studio" -> CardStudioScreen(
                    uiState = uiState,
                    onApplyCustomization = { gStart, gEnd, txtColor, sticker, prompt ->
                        viewModel.setCardCustomization(gStart, gEnd, txtColor, sticker, prompt)
                        currentScreen = "Home"
                    }
                )
                "Admin" -> AdminDashboardScreen(
                    uiState = uiState,
                    onUpdateStrictness = { viewModel.updateSafetyStrictness(it) },
                    onApproveMessage = { id -> viewModel.updateFlagStatus(id, false) },
                    onDeleteMessage = { id -> viewModel.deleteConfession(id) },
                    onPurgeDatabase = { viewModel.purgeDatabase() },
                    onLogoutAdmin = { viewModel.logoutAdmin() },
                    onOpenPinModal = { showAdminPinModal = true }
                )
            }

            // Dialog Modals
            if (uiState.showStoryPreviewDialog) {
                StoryExportDialog(
                    confession = uiState.selectedConfession,
                    onDismiss = { viewModel.closeStoryPreview() },
                    onSendReply = { id, reply -> viewModel.replyToConfession(id, reply) }
                )
            }

            if (showAdminPinModal) {
                AdminPinModal(
                    onDismiss = { showAdminPinModal = false },
                    onAuthenticate = { pin ->
                        val success = viewModel.loginAdmin(pin)
                        if (success) {
                            currentScreen = "Admin"
                        }
                        success
                    }
                )
            }
        }
    }
}
