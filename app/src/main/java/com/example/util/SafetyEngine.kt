package com.example.util

data class SafetyCheckResult(
    val isSafe: Boolean,
    val flagReason: String,
    val sentiment: String
)

object SafetyEngine {
    private val toxicKeywords = listOf(
        "hate you", "stupid", "idiot", "die", "loser", "ugly", "threat",
        "kill", "attack", "abuse", "creep", "stalk", "scam", "trash"
    )

    private val positiveKeywords = listOf(
        "love", "cute", "crush", "amazing", "best", "sweet", "pretty",
        "awesome", "fun", "cool", "kind", "legend", "vibes", "slay", "beautiful"
    )

    fun analyzeMessage(text: String, strictnessLevel: String = "Medium"): SafetyCheckResult {
        val lowerText = text.lowercase()
        val foundToxic = toxicKeywords.filter { lowerText.contains(it) }

        val threshold = when (strictnessLevel) {
            "Strict" -> 1
            "Low" -> 3
            else -> 1 // Medium
        }

        if (foundToxic.size >= threshold) {
            return SafetyCheckResult(
                isSafe = false,
                flagReason = "Harmful pattern detected: [${foundToxic.joinToString(", ")}]",
                sentiment = "Toxic/Spam"
            )
        }

        val foundPositive = positiveKeywords.filter { lowerText.contains(it) }
        val sentiment = when {
            foundPositive.isNotEmpty() -> "Positive"
            text.length > 50 -> "Deep Confession"
            else -> "Neutral"
        }

        return SafetyCheckResult(
            isSafe = true,
            flagReason = "",
            sentiment = sentiment
        )
    }

    val sampleHints = listOf(
        "Sent from iPhone 15 Pro • iOS 18 in New York 🏙️",
        "From a close friend who sits near you 🤫",
        "Sent late night at 2:45 AM 🌙",
        "From someone in your Instagram close friends 💖",
        "Sent via Web Browser • Android 14 📱",
        "From a secret admirer in college 🎓"
    )
}
