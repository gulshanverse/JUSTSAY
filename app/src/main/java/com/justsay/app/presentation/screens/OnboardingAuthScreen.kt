package com.justsay.app.presentation.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.justsay.app.domain.repository.AuthRepository
import com.justsay.app.domain.repository.ProfileRepository
import com.justsay.app.presentation.components.*
import com.justsay.app.presentation.theme.JustSayColors
import com.justsay.app.presentation.theme.JustSayCornerRadius
import com.justsay.app.presentation.theme.JustSaySpacing
import kotlinx.coroutines.launch

@Composable
fun OnboardingAuthScreen(
    authRepository: AuthRepository,
    profileRepository: ProfileRepository,
    onAuthSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isRegisterMode by remember { mutableStateOf(true) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var handle by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }

    var handleAvailability by remember { mutableStateOf<String?>(null) }
    var handleAvailable by remember { mutableStateOf(false) }

    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(handle) {
        if (isRegisterMode && handle.isNotBlank()) {
            val res = profileRepository.checkHandleAvailability(handle)
            handleAvailable = res.isAvailable
            handleAvailability = if (res.isAvailable) "✓ @${res.handle} is available!" else res.reason ?: "Unavailable"
        } else {
            handleAvailability = null
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(JustSayColors.Background)
            .padding(JustSaySpacing.Large),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 440.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = "🤫", fontSize = 56.sp)
            Spacer(modifier = Modifier.height(JustSaySpacing.Medium))
            Text(
                text = "JUSTSAY",
                style = MaterialTheme.typography.displayLarge.copy(
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
                )
            )
            Text(
                text = "Honest confessions. 100% Anonymous.",
                style = MaterialTheme.typography.bodyMedium.copy(color = JustSayColors.TextSecondary),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(JustSaySpacing.Huge))

            // Mode Toggle Switcher
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(JustSayColors.Surface, shape = MaterialTheme.shapes.medium)
                    .padding(4.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(
                            if (isRegisterMode) JustSayColors.Primary else Color.Transparent,
                            shape = MaterialTheme.shapes.small
                        )
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    TextButton(onClick = { isRegisterMode = true; errorMessage = null }) {
                        Text(
                            "Create Account",
                            color = if (isRegisterMode) Color.White else JustSayColors.TextSecondary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(
                            if (!isRegisterMode) JustSayColors.Primary else Color.Transparent,
                            shape = MaterialTheme.shapes.small
                        )
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    TextButton(onClick = { isRegisterMode = false; errorMessage = null }) {
                        Text(
                            "Sign In",
                            color = if (!isRegisterMode) Color.White else JustSayColors.TextSecondary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(JustSaySpacing.Large))

            JustSayCard {
                JustSayTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = "Email Address",
                    placeholder = "you@example.com",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    testTag = "auth_email_input"
                )

                Spacer(modifier = Modifier.height(JustSaySpacing.Medium))

                JustSayTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = "Password",
                    placeholder = "••••••••",
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    testTag = "auth_password_input"
                )

                if (isRegisterMode) {
                    Spacer(modifier = Modifier.height(JustSaySpacing.Medium))

                    JustSayTextField(
                        value = handle,
                        onValueChange = { handle = it },
                        label = "Unique @handle",
                        placeholder = "star_creator",
                        testTag = "auth_handle_input"
                    )

                    handleAvailability?.let { availMsg ->
                        Text(
                            text = availMsg,
                            style = MaterialTheme.typography.labelMedium.copy(
                                color = if (handleAvailable) JustSayColors.Success else JustSayColors.Error,
                                fontWeight = FontWeight.SemiBold
                            ),
                            modifier = Modifier.padding(top = 4.dp, start = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(JustSaySpacing.Medium))

                    JustSayTextField(
                        value = displayName,
                        onValueChange = { displayName = it },
                        label = "Display Name (Optional)",
                        placeholder = "Alex Smith",
                        testTag = "auth_displayname_input"
                    )
                }

                AnimatedVisibility(visible = errorMessage != null) {
                    Text(
                        text = errorMessage.orEmpty(),
                        style = MaterialTheme.typography.bodyMedium.copy(color = JustSayColors.Error),
                        modifier = Modifier.padding(top = JustSaySpacing.Medium)
                    )
                }

                Spacer(modifier = Modifier.height(JustSaySpacing.ExtraLarge))

                JustSayButton(
                    text = if (isRegisterMode) "Create Account 🚀" else "Sign In 🔒",
                    isLoading = isLoading,
                    onClick = {
                        coroutineScope.launch {
                            isLoading = true
                            errorMessage = null
                            if (isRegisterMode) {
                                val res = authRepository.register(email, password, handle, displayName)
                                isLoading = false
                                if (res.success) {
                                    onAuthSuccess()
                                } else {
                                    errorMessage = res.error ?: "Registration failed"
                                }
                            } else {
                                val res = authRepository.login(email, password)
                                isLoading = false
                                if (res.success) {
                                    onAuthSuccess()
                                } else {
                                    errorMessage = res.error ?: "Login failed"
                                }
                            }
                        }
                    },
                    testTag = "auth_submit_button"
                )
            }
        }
    }
}
