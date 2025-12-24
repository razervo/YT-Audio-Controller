package com.unified.ytaudio

import android.content.*
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    UnifiedAppContainer { path, args -> executeTermux(path, args) }
                }
            }
        }
    }

    private fun executeTermux(path: String, args: Array<String>) {
        val intent = Intent().apply {
            action = "com.termux.RUN_COMMAND"
            component = ComponentName("com.termux", "com.termux.app.RunCommandService")
            putExtra("com.termux.RUN_COMMAND_PATH", path)
            putExtra("com.termux.RUN_COMMAND_ARGUMENTS", args)
            putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
            startService(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Bridge Error: Check Permissions", Toast.LENGTH_LONG).show()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UnifiedAppContainer(onRun: (String, Array<String>) -> Unit) {
    var ytUrl by remember { mutableStateOf("") }
    var showHelp by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val clipboard = LocalClipboardManager.current
    val scroll = rememberScrollState()

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("YT Audio Pro 2025", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { showHelp = true }) {
                        Icon(Icons.Default.Info, contentDescription = "Help")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(20.dp).verticalScroll(scroll)) {
            
            // SECTION 1: INSTALLATION
            Text("1. Installation", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Button(onClick = {
                val i = Intent(Intent.ACTION_VIEW, Uri.parse("https://f-droid.org/en/packages/com.termux/"))
                context.startActivity(i)
            }, modifier = Modifier.fillMaxWidth()) { Text("Download Termux (F-Droid)") }
            
            Spacer(Modifier.height(16.dp))

            // SECTION 2: PERMISSIONS
            Text("2. System Permissions", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Text("These are mandatory for the bridge to work:", fontSize = 12.sp)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                TextButton(onClick = { 
                    context.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:com.termux"))) 
                }) { Text("1. Appear on Top") }
                TextButton(onClick = { 
                    context.startActivity(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)) 
                }) { Text("2. Battery Fix") }
            }

            Spacer(Modifier.height(16.dp))

            // SECTION 3: ENGINE SETUP
            Text("3. Engine Setup", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            Button(onClick = {
                val master = """
                    pkg update && pkg upgrade -y && pkg install python ffmpeg -y && pip install yt-dlp && mkdir -p ~/bin && mkdir -p ~/.termux && echo "allow-external-apps=true" > ~/.termux/termux.properties && termux-reload-settings && termux-setup-storage && cat << 'EOF' > ~/bin/yt-audio
                    #!/bin/bash
                    yt-dlp -x --audio-format mp3 --restrict-filenames -o "/sdcard/Download/YT-Audio/%(title)s.%(ext)s" "${'$'}1"
                    EOF
                    chmod +x ~/bin/yt-audio
                """.trimIndent()
                clipboard.setText(AnnotatedString(master))
                Toast.makeText(context, "Master Command Copied!", Toast.LENGTH_SHORT).show()
            }, modifier = Modifier.fillMaxWidth()) { Text("Copy Master Setup Command") }
            
            Spacer(Modifier.height(24.dp))

            // SECTION 4: DOWNLOADER
            Text("4. Downloader", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 20.sp)
            OutlinedTextField(
                value = ytUrl,
                onValueChange = { ytUrl = it },
                label = { Text("Paste YouTube Link") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(12.dp))
            Button(
                onClick = { onRun("/data/data/com.termux/files/home/bin/yt-audio", arrayOf(ytUrl)) },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                enabled = ytUrl.isNotBlank()
            ) {
                Text("DOWNLOAD MP3", fontWeight = FontWeight.Bold)
            }
        }

        if (showHelp) {
            AlertDialog(
                onDismissRequest = { showHelp = false },
                title = { Text("How to fix Bridge Failed") },
                text = {
                    Text("1. Click 'Appear on Top' and enable it for Termux.\n\n2. Click 'Copy Master Command' and paste it into Termux.\n\n3. Type 'exit' in Termux to close it, then swipe it away from your Recent Apps to restart it.")
                },
                confirmButton = { TextButton(onClick = { showHelp = false }) { Text("Close") } }
            )
        }
    }
}
