package com.justsay.app.presentation.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.justsay.app.presentation.theme.JustSayColors
import com.justsay.app.presentation.theme.JustSayCornerRadius
import com.justsay.app.presentation.theme.JustSaySpacing

@Composable
fun JustSayButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    isSecondary: Boolean = false,
    testTag: String = "justsay_button"
) {
    val shape = RoundedCornerShape(JustSayCornerRadius.Medium)
    val gradient = if (isSecondary) {
        Brush.horizontalGradient(listOf(JustSayColors.SurfaceVariant, JustSayColors.SurfaceHighlight))
    } else {
        Brush.horizontalGradient(listOf(JustSayColors.Primary, JustSayColors.PrimaryGradientEnd))
    }

    Box(
        modifier = modifier
            .testTag(testTag)
            .height(50.dp)
            .clip(shape)
            .background(if (enabled) gradient else Brush.horizontalGradient(listOf(JustSayColors.SurfaceHighlight, JustSayColors.SurfaceHighlight)))
            .clickable(enabled = enabled && !isLoading, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(22.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = if (enabled) Color.White else JustSayColors.TextMuted
                )
            )
        }
    }
}

@Composable
fun JustSayTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    error: String? = null,
    singleLine: Boolean = true,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    testTag: String = "justsay_textfield"
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium.copy(color = JustSayColors.TextSecondary),
            modifier = Modifier.padding(bottom = JustSaySpacing.ExtraSmall)
        )
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = JustSayColors.TextMuted) },
            singleLine = singleLine,
            isError = error != null,
            visualTransformation = visualTransformation,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = JustSayColors.Surface,
                unfocusedContainerColor = JustSayColors.Surface,
                errorContainerColor = JustSayColors.Surface,
                focusedBorderColor = JustSayColors.Primary,
                unfocusedBorderColor = JustSayColors.Border,
                errorBorderColor = JustSayColors.Error,
                focusedTextColor = JustSayColors.TextPrimary,
                unfocusedTextColor = JustSayColors.TextPrimary
            ),
            shape = RoundedCornerShape(JustSayCornerRadius.Medium),
            modifier = Modifier
                .fillMaxWidth()
                .testTag(testTag)
        )
        AnimatedVisibility(visible = error != null) {
            Text(
                text = error.orEmpty(),
                style = MaterialTheme.typography.bodyMedium.copy(color = JustSayColors.Error, fontSize = 12.sp),
                modifier = Modifier.padding(top = JustSaySpacing.ExtraSmall, start = JustSaySpacing.ExtraSmall)
            )
        }
    }
}

@Composable
fun JustSayCard(
    modifier: Modifier = Modifier,
    backgroundColor: Color = JustSayColors.Surface,
    borderColor: Color = JustSayColors.Border,
    cornerRadius: Dp = JustSayCornerRadius.Large,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(cornerRadius))
            .background(backgroundColor)
            .border(1.dp, borderColor, RoundedCornerShape(cornerRadius))
            .padding(JustSaySpacing.Large)
    ) {
        content()
    }
}

@Composable
fun JustSayAvatar(
    name: String,
    modifier: Modifier = Modifier,
    size: Dp = 64.dp,
    badgeText: String? = null
) {
    val initial = name.trim().take(1).uppercase().ifEmpty { "?" }
    Box(contentAlignment = Alignment.BottomEnd, modifier = modifier) {
        Box(
            modifier = Modifier
                .size(size)
                .clip(CircleShape)
                .background(Brush.linearGradient(listOf(JustSayColors.Primary, JustSayColors.Secondary))),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = initial,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontSize = (size.value * 0.4).sp
                )
            )
        }
        if (badgeText != null) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(JustSayColors.Success)
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = badgeText,
                    style = MaterialTheme.typography.labelMedium.copy(color = Color.White, fontSize = 10.sp)
                )
            }
        }
    }
}

@Composable
fun JustSayBadge(
    text: String,
    modifier: Modifier = Modifier,
    backgroundColor: Color = JustSayColors.SurfaceHighlight,
    textColor: Color = JustSayColors.TextSecondary
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(JustSayCornerRadius.Full))
            .background(backgroundColor)
            .padding(horizontal = JustSaySpacing.Medium, vertical = JustSaySpacing.ExtraSmall)
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium.copy(color = textColor, fontWeight = FontWeight.SemiBold)
        )
    }
}

@Composable
fun JustSayLoadingState(
    message: String = "Loading...",
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator(color = JustSayColors.Primary, strokeWidth = 3.dp)
            Spacer(modifier = Modifier.height(JustSaySpacing.Large))
            Text(text = message, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

@Composable
fun JustSayEmptyState(
    title: String,
    description: String,
    modifier: Modifier = Modifier,
    actionText: String? = null,
    onAction: (() -> Unit)? = null
) {
    Box(
        modifier = modifier.fillMaxSize().padding(JustSaySpacing.ExtraLarge),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = "🤫", fontSize = 48.sp)
            Spacer(modifier = Modifier.height(JustSaySpacing.Large))
            Text(
                text = title,
                style = MaterialTheme.typography.titleLarge,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(JustSaySpacing.Small))
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
            if (actionText != null && onAction != null) {
                Spacer(modifier = Modifier.height(JustSaySpacing.ExtraLarge))
                JustSayButton(text = actionText, onClick = onAction)
            }
        }
    }
}

@Composable
fun JustSayErrorState(
    errorMessage: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier.fillMaxSize().padding(JustSaySpacing.ExtraLarge),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = "⚠️", fontSize = 48.sp)
            Spacer(modifier = Modifier.height(JustSaySpacing.Large))
            Text(
                text = "Something went wrong",
                style = MaterialTheme.typography.titleLarge,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(JustSaySpacing.Small))
            Text(
                text = errorMessage,
                style = MaterialTheme.typography.bodyMedium.copy(color = JustSayColors.Error),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(JustSaySpacing.ExtraLarge))
            JustSayButton(text = "Retry", onClick = onRetry)
        }
    }
}

@Composable
fun JustSayQRCodeView(
    url: String,
    modifier: Modifier = Modifier,
    size: Dp = 180.dp
) {
    Box(
        modifier = modifier
            .size(size)
            .clip(RoundedCornerShape(JustSayCornerRadius.Large))
            .background(Color.White)
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val gridCount = 12
            val cellWidth = this.size.width / gridCount
            val cellHeight = this.size.height / gridCount

            // Deterministic QR pattern based on URL hash
            val hash = url.hashCode()
            for (row in 0 until gridCount) {
                for (col in 0 until gridCount) {
                    val isCornerFinder = (row in 0..2 && col in 0..2) ||
                            (row in 0..2 && col in (gridCount - 3) until gridCount) ||
                            (row in (gridCount - 3) until gridCount && col in 0..2)

                    val bit = ((hash xor (row * 31 + col)) and 1) == 1
                    if (isCornerFinder || bit) {
                        drawRect(
                            color = Color.Black,
                            topLeft = androidx.compose.ui.geometry.Offset(col * cellWidth, row * cellHeight),
                            size = androidx.compose.ui.geometry.Size(cellWidth * 0.9f, cellHeight * 0.9f)
                        )
                    }
                }
            }
        }
    }
}
