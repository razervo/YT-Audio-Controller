package com.unified.ytaudio

import android.content.*
import android.net.Uri
import android.os.*
import android.provider.Settings
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import kotlinx.coroutines.delay
import java.io.File

class MainActivity : ComponentActivity() {
    private var sharedUrl = mutableStateOf("")
    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        if (intent?.action == Intent.ACTION_SEND) sharedUrl.value = intent.getStringExtra(Intent.EXTRA_TEXT) ?: ""
        val p = getSharedPreferences("yt_elite_v1.6", MODE_PRIVATE)
        setContent { MaterialTheme(colorScheme = darkColorScheme()) { Surface { EliteUI(p, sharedUrl.value) } } }
    }
    fun callTermux(p: String, a: Array<String>, isBg: Boolean, sid: String) {
        val i = Intent("com.termux.RUN_COMMAND").apply {
            component = ComponentName("com.termux", "com.termux.app.RunCommandService")
            putExtra("com.termux.RUN_COMMAND_PATH", p); putExtra("com.termux.RUN_COMMAND_ARGUMENTS", a)
            putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0"); putExtra("com.termux.RUN_COMMAND_BACKGROUND", isBg)
            putExtra("com.termux.RUN_COMMAND_SESSION_ID", sid); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val pi = android.app.PendingIntent.getService(this, System.currentTimeMillis().toInt(), i, android.app.PendingIntent.FLAG_IMMUTABLE)
        try { pi.send() } catch (e: Exception) { }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EliteUI(prefs: SharedPreferences, sUrl: String) {
    val ctx = LocalContext.current as MainActivity
    var step by remember { mutableStateOf(prefs.getInt("step", 1)) }
    var done by remember { mutableStateOf(prefs.getBoolean("done", false)) }
    var url by remember { mutableStateOf(sUrl) }
    var progress by remember { mutableStateOf(0f) }
    var showLogin by remember { mutableStateOf(false) }
    val d = '$'

    LaunchedEffect(done) {
        while (done) {
            try {
                val f = File("/sdcard/Download/YT-Audio/.progress")
                if (f.exists()) {
                    progress = (f.readText().replace(Regex("[^0-9.]"), "").toFloatOrNull() ?: 0f) / 100f
                } else if (progress > 0.9f) progress = 0f
            } catch (e: Exception) { }
            delay(500)
        }
    }

    if (showLogin) {
        Box(Modifier.fillMaxSize()) {
            AndroidView(factory = { c ->
                WebView(c).apply {
                    // DESKTOP SIMULATION SETTINGS
                    val desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
                    settings.userAgentString = desktopUA
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(v: WebView?, u: String?) {
                            val cks = CookieManager.getInstance().getCookie(u)
                            if (cks != null && cks.contains("SID=")) {
                                prefs.edit().putString("cks", cks).apply()
                            }
                        }
                    }
                    loadUrl("https://accounts.google.com/ServiceLogin?service=youtube")
                }
            }, modifier = Modifier.fillMaxSize())
            
            Button(
                onClick = { showLogin = false; step = 5; prefs.edit().putInt("step", 5).apply() },
                modifier = Modifier.align(Alignment.BottomCenter).padding(20.dp)
            ) { Text("Identity Verified: Click to Continue") }
        }
    } else {
        Scaffold(topBar = { CenterAlignedTopAppBar(title = { Text("YT Audio Elite", fontWeight = FontWeight.Bold) }) }) { p ->
            Column(Modifier.padding(p).padding(16.dp)) {
                if (!done) {
                    Column {
                        Text("Step $step of 5", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                        when(step) {
                            1 -> Wizard("Foundation", "Install Termux.", "Download") { ctx.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://f-droid.org/en/packages/com.termux/"))); step = 2 }
                            2 -> Wizard("Bridge", "Allow Overlay and Files Access.", "Settings") { ctx.startActivity(Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)) ; step = 3 }
                            3 -> Wizard("Security", "Permissions > 3 Dots > Additional > Allow Run Commands.", "App Info") { ctx.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply { data = Uri.parse("package:${ctx.packageName}") }); step = 4 }
                            4 -> Wizard("Identity", "Sign in as a Desktop PC to fix speed.", "Sign In") { showLogin = true }
                            5 -> Wizard("Finalize", "Configure Blueprint folders.", "Initialize") {
                                val cks = prefs.getString("cks", "")
                                val s = "pkg update -y && pkg install python ffmpeg deno -y && pip install yt-dlp && mkdir -p ~/bin && termux-setup-storage && echo -e '#!/bin/bash\\nyt-dlp -x --audio-format mp3 --restrict-filenames --extractor-args \"youtube:player-client=android\" --add-header \"Cookie: ${cks}\" --newline --progress-template \"%(progress._percent_str)s\" -o \"/sdcard/Download/YT-Audio/%(playlist_title?Playlist/%(playlist_title)s/|Single/)s%(playlist_index?%(playlist_index)s - |)s%(artist,uploader|Unknown)s - %(title)s.%(ext)s\" \"${d}1\" > /sdcard/Download/YT-Audio/.progress 2>&1\\nrm /sdcard/Download/YT-Audio/.progress' > /data/data/com.termux/files/home/bin/yt-audio && chmod +x /data/data/com.termux/files/home/bin/yt-audio"
                                ctx.callTermux("/system/bin/sh", arrayOf("-c", s), false, "SETUP")
                                done = true; prefs.edit().putBoolean("done", true).apply()
                            }
                        }
                        if (step < 5) Button(onClick = { step++ }, modifier = Modifier.align(Alignment.End)) { Text("Next") }
                    }
                } else {
                    OutlinedTextField(value = url, onValueChange = { url = it }, label = { Text("URL") }, modifier = Modifier.fillMaxWidth())
                    if (progress > 0f) LinearProgressIndicator(progress = progress, modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), color = Color.Red)
                    Button(onClick = { ctx.callTermux("/data/data/com.termux/files/home/bin/yt-audio", arrayOf(url), true, "DL_${System.currentTimeMillis()}") }, modifier = Modifier.fillMaxWidth().padding(top = 16.dp).height(56.dp)) { Text("DOWNLOAD MP3") }
                    TextButton(onClick = { prefs.edit().clear().apply(); done = false; step = 1 }) { Text("Reset Application") }
                }
            }
        }
    }
}
@Composable fun Wizard(t: String, d: String, b: String, onClick: () -> Unit) {
    Text(t, fontSize = 20.sp, fontWeight = FontWeight.Bold); Text(d, modifier = Modifier.padding(vertical = 10.dp))
    Button(onClick = onClick, modifier = Modifier.fillMaxWidth()) { Text(b) }
}
