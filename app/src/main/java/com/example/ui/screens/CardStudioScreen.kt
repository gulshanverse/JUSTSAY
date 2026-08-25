package com.example.ui.screens

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.ColorLens
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Redo
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.TextFields
import androidx.compose.material.icons.filled.Undo
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.ConfessionEntity
import com.example.ui.WhisprUiState
import java.util.Date
import kotlin.math.roundToInt

data class ColorPreset(
    val name: String,
    val start: Color,
    val end: Color
)

data class EditorElement(
    val id: String,
    var type: String, // "TEXT", "STICKER", "PROMPT"
    var content: String,
    var offsetX: Float = 0f,
    var offsetY: Float = 0f,
    var scale: Float = 1f,
    var rotation: Float = 0f,
    var zIndex: Int = 1,
    var colorHex: Long = 0xFFFFFFFF
)

@Composable
fun CardStudioScreen(
    uiState: WhisprUiState,
    onApplyCustomization: (Color, Color, Color, String, String) -> Unit
) {
    val context = LocalContext.current

    val presets = remember {
        listOf(
            ColorPreset("Midnight", Color(0xFF0B0D17), Color(0xFF1A1C2E)),
            ColorPreset("Sunset", Color(0xFFFF2A85), Color(0xFFFF7B00)),
            ColorPreset("Bubblegum", Color(0xFFF72585), Color(0xFF7209B7)),
            ColorPreset("Electric", Color(0xFF00F5D4), Color(0xFF7B2CBF)),
            ColorPreset("Lavender", Color(0xFFB5179E), Color(0xFF7209B7)),
            ColorPreset("Ocean", Color(0xFF48CAE4), Color(0xFF03045E)),
            ColorPreset("Cream", Color(0xFFF72585), Color(0xFFFF4893)),
            ColorPreset("Monochrome", Color(0xFF2B2D42), Color(0xFF8D99AE)),
            ColorPreset("Y2K", Color(0xFF00F5D4), Color(0xFFF72585)),
            ColorPreset("Soft Pastel", Color(0xFFFFB703), Color(0xFFFB8500))
        )
    }

    val stickerCategories = remember {
        mapOf(
            "Reactions" to listOf("👀", "😭", "😮", "🤯", "😳"),
            "Love" to listOf("❤️", "💖", "💕", "💌", "💘"),
            "Funny" to listOf("💀", "🤡", "💩", "🥳", "🤪"),
            "Drama" to listOf("🤫", "☕", "🌶️", "💣", "⚡"),
            "Crush" to listOf("✨", "🌙", "🔮", "🎀", "👑")
        )
    }

    // Ratio Formats
    var selectedRatio by remember { mutableStateOf("9:16") } // "9:16", "1:1", "4:5"
    val aspectRatioValue = when (selectedRatio) {
        "1:1" -> 1f
        "4:5" -> 4f / 5f
        else -> 9f / 16f
    }

    var selectedPreset by remember { mutableStateOf(presets[0]) }
    var includeBranding by remember { mutableStateOf(true) }

    // Elements & History
    val elements = remember {
        mutableStateListOf(
            EditorElement("elem_prompt", "PROMPT", uiState.activeQuestionPrompt, offsetY = -80f, zIndex = 1),
            EditorElement("elem_body", "TEXT", "Tap to edit confession card text...", offsetY = 20f, zIndex = 2),
            EditorElement("elem_sticker", "STICKER", uiState.customSticker, offsetY = 120f, zIndex = 3)
        )
    }

    var selectedElementId by remember { mutableStateOf<String?>(elements[1].id) }
    var selectedCategoryTab by remember { mutableStateOf("Reactions") }
    var currentSubToolTab by remember { mutableStateOf(0) } // 0: Templates, 1: Text, 2: Stickers, 3: Backgrounds

    // Undo / Redo Stacks
    val undoStack = remember { mutableStateListOf<List<EditorElement>>() }
    val redoStack = remember { mutableStateListOf<List<EditorElement>>() }

    fun saveHistorySnapshot() {
        val snapshot = elements.map { it.copy() }
        undoStack.add(snapshot)
        if (undoStack.size > 20) undoStack.removeAt(0)
        redoStack.clear()
    }

    fun performUndo() {
        if (undoStack.isNotEmpty()) {
            val last = undoStack.removeAt(undoStack.size - 1)
            redoStack.add(elements.map { it.copy() })
            elements.clear()
            elements.addAll(last)
        }
    }

    fun performRedo() {
        if (redoStack.isNotEmpty()) {
            val next = redoStack.removeAt(redoStack.size - 1)
            undoStack.add(elements.map { it.copy() })
            elements.clear()
            elements.addAll(next)
        }
    }

    val selectedElement = elements.find { it.id == selectedElementId }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0D0714))
    ) {
        // TOP BAR: Undo / Redo / Ratio / Export
        Surface(
            color = Color(0xFF1B0E2E),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // History Controls
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = { performUndo() },
                        enabled = undoStack.isNotEmpty(),
                        modifier = Modifier.testTag("undo_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Undo,
                            contentDescription = "Undo",
                            tint = if (undoStack.isNotEmpty()) Color.White else Color.Gray
                        )
                    }

                    IconButton(
                        onClick = { performRedo() },
                        enabled = redoStack.isNotEmpty(),
                        modifier = Modifier.testTag("redo_btn")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Redo,
                            contentDescription = "Redo",
                            tint = if (redoStack.isNotEmpty()) Color.White else Color.Gray
                        )
                    }
                }

                // Ratio Selector Chips
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("9:16", "1:1", "4:5").forEach { ratio ->
                        FilterChip(
                            selected = selectedRatio == ratio,
                            onClick = { selectedRatio = ratio },
                            label = { Text(ratio, fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFFFF2A85),
                                selectedLabelColor = Color.White,
                                containerColor = Color(0xFF261540),
                                labelColor = Color.LightGray
                            ),
                            modifier = Modifier.testTag("ratio_chip_$ratio")
                        )
                    }
                }

                // Native Share / Export Action
                IconButton(
                    onClick = {
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "JUSTSAY Creative Card")
                            putExtra(Intent.EXTRA_TEXT, "Check out my JUSTSAY story card: https://justsay.app/@${uiState.userHandle}")
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Share JUSTSAY Card"))
                    },
                    modifier = Modifier.testTag("export_card_btn")
                ) {
                    Icon(
                        imageVector = Icons.Default.Share,
                        contentDescription = "Export Card",
                        tint = Color(0xFFFF2A85)
                    )
                }
            }
        }

        // CENTER WORKSPACE: Interactive Canvas Area
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(if (selectedRatio == "1:1") 0.85f else 0.78f)
                    .aspectRatio(aspectRatioValue)
                    .shadow(16.dp, RoundedCornerShape(24.dp))
                    .background(
                        brush = Brush.verticalGradient(listOf(selectedPreset.start, selectedPreset.end)),
                        shape = RoundedCornerShape(24.dp)
                    )
                    .border(2.dp, Color.White.copy(alpha = 0.3f), RoundedCornerShape(24.dp))
                    .clip(RoundedCornerShape(24.dp))
                    .testTag("card_canvas_area"),
                contentAlignment = Alignment.Center
            ) {
                // Render Canvas Elements by zIndex
                elements.sortedBy { it.zIndex }.forEach { elem ->
                    val isSelected = elem.id == selectedElementId

                    Box(
                        modifier = Modifier
                            .offset { IntOffset(elem.offsetX.roundToInt(), elem.offsetY.roundToInt()) }
                            .pointerInput(elem.id) {
                                detectTransformGestures { _, pan, zoom, rotation ->
                                    saveHistorySnapshot()
                                    elem.offsetX += pan.x
                                    elem.offsetY += pan.y
                                    elem.scale = (elem.scale * zoom).coerceIn(0.5f, 3.5f)
                                    elem.rotation += rotation
                                }
                            }
                            .clickable { selectedElementId = elem.id }
                            .border(
                                width = if (isSelected) 2.dp else 0.dp,
                                color = if (isSelected) Color(0xFFFF2A85) else Color.Transparent,
                                shape = RoundedCornerShape(12.dp)
                            )
                            .padding(8.dp)
                    ) {
                        when (elem.type) {
                            "PROMPT" -> {
                                Surface(
                                    color = Color.White.copy(alpha = 0.25f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(
                                        text = elem.content,
                                        color = Color.White,
                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                    )
                                }
                            }
                            "STICKER" -> {
                                Text(
                                    text = elem.content,
                                    fontSize = (32 * elem.scale).sp,
                                    modifier = Modifier.padding(4.dp)
                                )
                            }
                            else -> {
                                Text(
                                    text = elem.content,
                                    color = Color(elem.colorHex),
                                    fontSize = (18 * elem.scale).sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(6.dp)
                                )
                            }
                        }
                    }
                }

                // Optional JUSTSAY Watermark Branding
                if (includeBranding) {
                    Surface(
                        color = Color.Black.copy(alpha = 0.4f),
                        shape = RoundedCornerShape(50),
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 12.dp)
                    ) {
                        Text(
                            text = "justsay.app/@${uiState.userHandle}",
                            color = Color.White.copy(alpha = 0.9f),
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Black),
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }

        // TOOLBAR CONTROLS: Selection Actions (Layers / Delete)
        if (selectedElement != null) {
            Surface(
                color = Color(0xFF1B0E2E),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Element: ${selectedElement.type}",
                        color = Color.LightGray,
                        style = MaterialTheme.typography.labelSmall
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        // Bring Forward
                        IconButton(
                            onClick = {
                                saveHistorySnapshot()
                                selectedElement.zIndex += 1
                            }
                        ) {
                            Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Bring Forward", tint = Color.White)
                        }

                        // Send Backward
                        IconButton(
                            onClick = {
                                saveHistorySnapshot()
                                selectedElement.zIndex = (selectedElement.zIndex - 1).coerceAtLeast(1)
                            }
                        ) {
                            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = "Send Backward", tint = Color.White)
                        }

                        // Delete Element
                        IconButton(
                            onClick = {
                                saveHistorySnapshot()
                                elements.remove(selectedElement)
                                selectedElementId = null
                            },
                            modifier = Modifier.testTag("delete_element_btn")
                        ) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFFF2A85))
                        }
                    }
                }
            }
        }

        // BOTTOM TOOL PANELS (Tabs: 0: Templates, 1: Text, 2: Stickers, 3: Backgrounds)
        Surface(
            color = Color(0xFF150B24),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                TabRow(
                    selectedTabIndex = currentSubToolTab,
                    containerColor = Color(0xFF1B0E2E),
                    contentColor = Color(0xFFFF2A85)
                ) {
                    Tab(
                        selected = currentSubToolTab == 0,
                        onClick = { currentSubToolTab = 0 },
                        text = { Text("Templates", fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = currentSubToolTab == 1,
                        onClick = { currentSubToolTab = 1 },
                        text = { Text("Text", fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = currentSubToolTab == 2,
                        onClick = { currentSubToolTab = 2 },
                        text = { Text("Stickers", fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = currentSubToolTab == 3,
                        onClick = { currentSubToolTab = 3 },
                        text = { Text("Backgrounds", fontWeight = FontWeight.Bold) }
                    )
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .padding(12.dp)
                ) {
                    when (currentSubToolTab) {
                        0 -> { // Templates Tab
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                items(presets) { preset ->
                                    Surface(
                                        color = Color(0xFF261540),
                                        shape = RoundedCornerShape(14.dp),
                                        modifier = Modifier
                                            .width(110.dp)
                                            .clickable {
                                                saveHistorySnapshot()
                                                selectedPreset = preset
                                            }
                                    ) {
                                        Column(
                                            modifier = Modifier.padding(10.dp),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(40.dp)
                                                    .background(
                                                        brush = Brush.linearGradient(listOf(preset.start, preset.end)),
                                                        shape = CircleShape
                                                    )
                                            )
                                            Spacer(modifier = Modifier.height(6.dp))
                                            Text(
                                                text = preset.name,
                                                color = Color.White,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                        1 -> { // Text Editor Tab
                            Column(modifier = Modifier.fillMaxWidth()) {
                                var textInput by remember { mutableStateOf(selectedElement?.content ?: "") }
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    OutlinedTextField(
                                        value = textInput,
                                        onValueChange = {
                                            textInput = it
                                            selectedElement?.content = it
                                        },
                                        placeholder = { Text("Type custom text...", color = Color.Gray) },
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor = Color.White,
                                            unfocusedTextColor = Color.White,
                                            focusedBorderColor = Color(0xFFFF2A85),
                                            unfocusedBorderColor = Color.Gray
                                        ),
                                        modifier = Modifier
                                            .weight(1f)
                                            .testTag("card_text_input")
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Button(
                                        onClick = {
                                            if (textInput.isNotBlank()) {
                                                saveHistorySnapshot()
                                                val newElem = EditorElement(
                                                    id = "txt_${Date().time}",
                                                    type = "TEXT",
                                                    content = textInput,
                                                    offsetY = 0f,
                                                    zIndex = elements.size + 1
                                                )
                                                elements.add(newElem)
                                                selectedElementId = newElem.id
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF2A85)),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Icon(imageVector = Icons.Default.Add, contentDescription = "Add Text")
                                    }
                                }
                            }
                        }
                        2 -> { // Sticker Catalog Tab
                            Column(modifier = Modifier.fillMaxWidth()) {
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    items(stickerCategories.keys.toList()) { cat ->
                                        FilterChip(
                                            selected = selectedCategoryTab == cat,
                                            onClick = { selectedCategoryTab = cat },
                                            label = { Text(cat, fontSize = 11.sp) },
                                            colors = FilterChipDefaults.filterChipColors(
                                                selectedContainerColor = Color(0xFFFF2A85),
                                                selectedLabelColor = Color.White
                                            )
                                        )
                                    }
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                                    items(stickerCategories[selectedCategoryTab] ?: emptyList()) { stk ->
                                        Surface(
                                            color = Color(0xFF261540),
                                            shape = CircleShape,
                                            modifier = Modifier
                                                .size(44.dp)
                                                .clickable {
                                                    saveHistorySnapshot()
                                                    val newStk = EditorElement(
                                                        id = "stk_${Date().time}",
                                                        type = "STICKER",
                                                        content = stk,
                                                        offsetY = -20f,
                                                        zIndex = elements.size + 1
                                                    )
                                                    elements.add(newStk)
                                                    selectedElementId = newStk.id
                                                }
                                        ) {
                                            Box(contentAlignment = Alignment.Center) {
                                                Text(stk, fontSize = 20.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        3 -> { // Backgrounds Tab
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                    items(presets) { preset ->
                                        val isSel = preset == selectedPreset
                                        Box(
                                            modifier = Modifier
                                                .size(48.dp)
                                                .background(
                                                    brush = Brush.linearGradient(listOf(preset.start, preset.end)),
                                                    shape = CircleShape
                                                )
                                                .border(
                                                    width = if (isSel) 3.dp else 0.dp,
                                                    color = if (isSel) Color.White else Color.Transparent,
                                                    shape = CircleShape
                                                )
                                                .clickable { selectedPreset = preset }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
