package com.unified.ytaudio

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.*

@Composable
fun WizardPage(
    title: String,
    desc: String,
    btn: String,
    enabled: Boolean,
    onBtn: () -> Unit,
    onNext: () -> Unit
) {
    ElevatedCard(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Column(Modifier.padding(20.dp)) {
            Text(title, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text(desc, modifier = Modifier.padding(vertical = 12.dp))
            Button(onClick = onBtn, modifier = Modifier.fillMaxWidth()) { Text(btn) }
            Spacer(Modifier.height(16.dp))
            Button(onClick = onNext, enabled = enabled, modifier = Modifier.align(Alignment.End)) { Text("Next Step") }
        }
    }
}
