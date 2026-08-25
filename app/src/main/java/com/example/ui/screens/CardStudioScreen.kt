package com.example.ui.screens

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
import androidx.compose.material.icons.filled.ColorLens
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Style
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ConfessionEntity
import com.example.ui.WhisprUiState
import com.example.ui.components.ConfessionCard

data class ColorPreset(
    val name: String,
    val start: Color,
    val end: Color
)

@Composable
fun CardStudioScreen(
    uiState: WhisprUiState,
    onApplyCustomization: (Color, Color, Color, String, String) -> Unit
) {
    val presets = listOf(
        ColorPreset("Neon Cyber", Color(0xFFFF2A85), Color(0xFF9B5DE5)),
        ColorPreset("Sunset Glow", Color(0xFFFF7B00), Color(0xFFFF0266)),
        ColorPreset("Acid Cyan", Color(0xFF00F5D4), Color(0xFF7B2CBF)),
        ColorPreset("Midnight", Color(0xFF3A0CA3), Color(0xFF10002B)),
        ColorPreset("Pastel Mint", Color(0xFF70E400), Color(0xFF38B000)),
        ColorPreset("Y2K Violet", Color(0xFFF72585), Color(0xFF7209B7))
    )

    val stickers = listOf(
        "🤫 Top Secret", "🔥 No Cap", "💀 Crying",
        "👀 Spill The Tea", "💖 Crush Alert", "💅 Slay", "🤡 Clown Energy"
    )

    var selectedPreset by remember { mutableStateOf(presets[0]) }
    var selectedSticker by remember { mutableStateOf(uiState.customSticker) }
    var customPrompt by remember { mutableStateOf(uiState.activeQuestionPrompt) }

    val previewConfession = remember(selectedPreset, selectedSticker, customPrompt) {
        ConfessionEntity(
            id = 999,
            recipientHandle = uiState.userHandle,
            promptQuestion = customPrompt,
            messageText = "This is a real-time preview of your custom confession card! Friends will see this colorful background when sending secrets.",
            cardGradientStart = selectedPreset.start.value.toLong(),
            cardGradientEnd = selectedPreset.end.value.toLong(),
            textColor = 0xFFFFFFFF,
            stickerTag = selectedSticker,
            senderHint = "Sent from Whispr Card Studio • Preview"
        )
    }

    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0714))
            .verticalScroll(scrollState)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Palette,
                contentDescription = "Studio",
                tint = Color(0xFFFF2A85),
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = "Card Design Studio 🎨",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Black
                    )
                )
                Text(
                    text = "Customize gradient colors, sticker overlays & prompts",
                    style = MaterialTheme.typography.bodySmall.copy(color = Color(0xFFA093BA))
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Live Preview Section
        Text(
            text = "LIVE CARD PREVIEW 👁️",
            style = MaterialTheme.typography.labelMedium.copy(
                color = Color(0xFF00F5D4),
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            ),
            modifier = Modifier.align(Alignment.Start)
        )

        Spacer(modifier = Modifier.height(8.dp))

        ConfessionCard(
            confession = previewConfession,
            showAdminActions = false
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Color Presets Selection
        Text(
            text = "Color Palette Presets",
            style = MaterialTheme.typography.titleMedium.copy(
                color = Color.White,
                fontWeight = FontWeight.Bold
            ),
            modifier = Modifier.align(Alignment.Start)
        )

        Spacer(modifier = Modifier.height(10.dp))

        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(presets) { preset ->
                val isSelected = preset == selectedPreset
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(
                            brush = Brush.linearGradient(listOf(preset.start, preset.end)),
                            shape = CircleShape
                        )
                        .border(
                            width = if (isSelected) 3.dp else 0.dp,
                            color = if (isSelected) Color.White else Color.Transparent,
                            shape = CircleShape
                        )
                        .clickable { selectedPreset = preset },
                    contentAlignment = Alignment.Center
                ) {
                    if (isSelected) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Selected",
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Sticker Overlays
        Text(
            text = "Sticker Overlay Badges 🏷️",
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
            items(stickers) { sticker ->
                val isSelected = sticker == selectedSticker
                Surface(
                    color = if (isSelected) Color(0xFFFF2A85) else Color(0xFF261540),
                    shape = RoundedCornerShape(50),
                    modifier = Modifier.clickable { selectedSticker = sticker }
                ) {
                    Text(
                        text = sticker,
                        color = Color.White,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Custom Prompt Text
        OutlinedTextField(
            value = customPrompt,
            onValueChange = { customPrompt = it },
            label = { Text("Custom Question Prompt text", color = Color.Gray) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFFFF2A85),
                unfocusedBorderColor = Color.Gray,
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            ),
            modifier = Modifier
                .fillMaxWidth()
                .testTag("custom_prompt_input")
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                onApplyCustomization(
                    selectedPreset.start,
                    selectedPreset.end,
                    Color.White,
                    selectedSticker,
                    customPrompt
                )
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF2A85)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .testTag("apply_card_theme_btn")
        ) {
            Icon(imageVector = Icons.Default.Style, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Apply & Save Theme Settings",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }
    }
}
