package com.example.ui.components

import androidx.compose.runtime.Composable
import com.justsay.app.presentation.components.AdminAuthModal

@Composable
fun AdminPinModal(
    onDismiss: () -> Unit,
    onAuthenticate: (String) -> Boolean
) {
    AdminAuthModal(
        onDismiss = onDismiss,
        onAuthenticate = onAuthenticate
    )
}
