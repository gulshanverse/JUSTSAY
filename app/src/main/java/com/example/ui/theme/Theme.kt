package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val WhisprColorScheme = darkColorScheme(
    primary = NeonPink,
    onPrimary = Color.White,
    secondary = AcidCyan,
    onSecondary = Color.Black,
    tertiary = ElectricPurple,
    onTertiary = Color.White,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = CardSurface,
    onSurfaceVariant = TextMuted,
    error = DangerRed
)

@Composable
fun WhisprTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = WhisprColorScheme,
        typography = Typography,
        content = content
    )
}

