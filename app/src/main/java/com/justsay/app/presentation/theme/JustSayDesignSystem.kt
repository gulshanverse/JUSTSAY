package com.justsay.app.presentation.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object JustSayColors {
    val Background = Color(0xFF0B0F17)
    val Surface = Color(0xFF161E2E)
    val SurfaceVariant = Color(0xFF1E293B)
    val SurfaceHighlight = Color(0xFF243047)
    val Border = Color(0xFF2A364F)

    val Primary = Color(0xFF6366F1)       // Indigo
    val PrimaryGradientEnd = Color(0xFF8B5CF6) // Violet
    val Secondary = Color(0xFFEC4899)     // Pink
    val Accent = Color(0xFF06B6D4)        // Cyan

    val TextPrimary = Color(0xFFF8FAFC)
    val TextSecondary = Color(0xFF94A3B8)
    val TextMuted = Color(0xFF64748B)

    val Success = Color(0xFF10B981)
    val Error = Color(0xFFEF4444)
    val Warning = Color(0xFBF59E0B)
}

object JustSaySpacing {
    val ExtraSmall: Dp = 4.dp
    val Small: Dp = 8.dp
    val Medium: Dp = 12.dp
    val Large: Dp = 16.dp
    val ExtraLarge: Dp = 24.dp
    val Huge: Dp = 32.dp
    val Massive: Dp = 48.dp
}

object JustSayCornerRadius {
    val Small: Dp = 8.dp
    val Medium: Dp = 12.dp
    val Large: Dp = 16.dp
    val ExtraLarge: Dp = 24.dp
    val Full: Dp = 999.dp
}

val JustSayTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 38.sp,
        color = JustSayColors.TextPrimary
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 30.sp,
        color = JustSayColors.TextPrimary
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 26.sp,
        color = JustSayColors.TextPrimary
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 22.sp,
        color = JustSayColors.TextPrimary
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        color = JustSayColors.TextPrimary
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = JustSayColors.TextSecondary
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = JustSayColors.TextPrimary
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        color = JustSayColors.TextSecondary
    )
)

private val JustSayColorScheme = darkColorScheme(
    primary = JustSayColors.Primary,
    onPrimary = Color.White,
    primaryContainer = JustSayColors.SurfaceHighlight,
    onPrimaryContainer = JustSayColors.TextPrimary,
    secondary = JustSayColors.Secondary,
    onSecondary = Color.White,
    background = JustSayColors.Background,
    onBackground = JustSayColors.TextPrimary,
    surface = JustSayColors.Surface,
    onSurface = JustSayColors.TextPrimary,
    surfaceVariant = JustSayColors.SurfaceVariant,
    onSurfaceVariant = JustSayColors.TextSecondary,
    outline = JustSayColors.Border,
    error = JustSayColors.Error,
    onError = Color.White
)

@Composable
fun JustSayTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = JustSayColorScheme,
        typography = JustSayTypography,
        content = content
    )
}
