package com.unified.ytaudio

import android.app.Activity
import android.content.*
import android.net.Uri
import android.os.*
import android.provider.Settings
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
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

// Safe Activity Finder
fun Context.findActivity(): ComponentActivity? {
    var context = this
    while (context is ContextWrapper) {
        if (context is ComponentActivity) return context
        context = context.baseContext
    }
    return null
}

class MainActivity : ComponentActivity() {
    private var sharedUrl = mutableStateOf("")
    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        try {
            if (intent?.action == Intent.ACTION_SEND) sharedUrl.value = intent.getStringExtra(Intent.EXTRA_TEXT) ?: ""
            val p = getSharedPreferences("yt_elite_v1.6", MODE_PRIVATE)
            setContent { MaterialTheme(colorScheme = darkColorScheme()) { Surface { EliteUI(p, sharedUrl.value) } } }
        } catch (e: Exception) { }
    }
    
    fun callTermux(p: String, a: Array<String>, isBg: Boolean, sid: String) {
        try {
            val i = Intent("com.termux.RUN_COMMAND").apply {
                component = ComponentName("com.termux", "com.termux.app.RunCommandService")
                putExtra("com.termux.RUN_COMMAND_PATH", p); putExtra("com.termux.RUN_COMMAND_ARGUMENTS", a)
                putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0"); putExtra("com.termux.RUN_COMMAND_BACKGROUND", isBg)
                putExtra("com.termux.RUN_COMMAND_SESSION_ID", sid); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            val pi = android.app.PendingIntent.getService(this, System.currentTimeMillis().toInt(), i, android.app.PendingIntent.FLAG_IMMUTABLE)
            pi.send()
        } catch (e: Exception) { }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EliteUI(prefs: SharedPreferences, sUrl: String) {
    val context = LocalContext.current
    val activity = remember(context) { context.findActivity() }
    var step by remember { mutableStateOf(prefs.getInt("step", 1)) }
    var done by remember { mutableStateOf(prefs.getBoolean("done", false)) }
    var url by remember { mutableStateOf(sUrl) }
    var progress by remember { mutableStateOf(0f) }
    var showLogin by remember { mutableStateOf(false) }
    val d = '$'

    LaunchedEffect(done) {
        while (done) {
            try {
                if (Environment.isExternalStorageManager()) {
                    val f = File("/sdcard/Download/YT-Audio/.progress")
                    if (f.exists()) {
                        progress = (f.readText().replace(Regex("[^0-9.]"), "").toFloatOrNull() ?: 0f) / 100f
                    } else if (progress > 0.9f) progress = 0f
                }
            } catch (e: Exception) { }
            delay(500)
        }
    }

    if (showLogin) {
        Box(Modifier.fillMaxSize()) {
            AndroidView(factory = { c ->
                WebView(c).apply {
                    // [DEEP RESEARCH FIX] 1. Perfect User-Agent (Pixel 7 Pro)
                    val pixelUA = "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro Build/TQ1A.230105.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36"
                    // We REMOVE 'wv' and 'Version/4.0' to hide the WebView nature
                    val stealthUA = pixelUA.replace("; wv", "").replace("Version/4.0 ", "")
                    settings.userAgentString = stealthUA
                    
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    
                    // [DEEP RESEARCH FIX] 2. Inject Client Hints via JS
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(v: WebView?, u: String?) {
                            // This Payload mimics a Real Chrome Browser to fool Google's AI
                            val stealthJS = """
                                javascript:(function() {
                                    // 1. Mock Client Hints (The missing piece)
                                    try {
                                        Object.defineProperty(navigator, 'userAgentData', {
                                            get: () => ({
                                                brands: [
                                                    {brand: "Google Chrome", version: "114"},
                                                    {brand: "Chromium", version: "114"},
                                                    {brand: "Not=A?Brand", version: "24"}
                                                ],
                                                mobile: true,
                                                platform: "Android"
                                            })
                                        });
                                    } catch(e) {}
                                    
                                    // 2. Mock Plugins (WebViews usually have 0, Chrome has 5)
                                    try {
                                        Object.defineProperty(navigator, 'plugins', {
                                            get: () => [1, 2, 3, 4, 5]
                                        });
                                    } catch(e) {}
                                    
                                    // 3. Remove WebDriver flag
                                    try {
                                        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                                    } catch(e) {}
                                    
                                    // 4. Inject 'window.chrome' (Missing in some WebViews)
                                    if (!window.chrome) { window.chrome = { runtime: {} }; }
                                })()
                            """
                            v?.evaluateJavascript(stealthJS, null)

                            // Cookie Capture
                            val cks = CookieManager.getInstance().getCookie(u)
                            if (cks != null && cks.contains("SID=")) {
                                prefs.edit().putString("cks", cks).apply()
                                android.util.Log.d("STEALTH_LOG", "CAPTURED: " + cks)
                            }
                        }
                    }
                    // Load Google Home (Global Scope)
                    loadUrl("https://accounts.google.com/ServiceLogin?continue=https://www.google.com&hl=en")
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
                            1 -> Wizard("Foundation", "Install Termux.", "Download") { 
                                try { activity?.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://f-droid.org/en/packages/com.termux/"))); step = 2 } catch(e: Exception) {}
                            }
                            2 -> Wizard("Bridge", "Allow Overlay and Files Access.", "Settings") { 
                                try { 
                                    val i = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                                    i.data = Uri.parse("package:${activity?.packageName}")
                                    activity?.startActivity(i)
                                    step = 3
                                } catch(e: Exception) {
                                    step = 3 // Bypass if permission flow fails
                                }
                            }
                            3 -> Wizard("Security", "Permissions > 3 Dots > Additional > Allow Run Commands.", "App Info") { 
                                try {
                                    activity?.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply { data = Uri.parse("package:${activity.packageName}") })
                                    step = 4 
                                } catch (e: Exception) {}
                            }
                            4 -> Wizard("Identity", "Sign in (Stealth Mode)", "Sign In") { showLogin = true }
                            5 -> Wizard("Finalize", "Configure Blueprint folders.", "Initialize") {
                                val cks = prefs.getString("cks", "")
                                val s = "pkg update -y && pkg install python ffmpeg deno -y && pip install yt-dlp && mkdir -p ~/bin && termux-setup-storage && echo -e '#!/bin/bash\\nyt-dlp -x --audio-format mp3 --restrict-filenames --extractor-args \"youtube:player-client=android\" --add-header \"Cookie: ${cks}\" --newline --progress-template \"%(progress._percent_str)s\" -o \"/sdcard/Download/YT-Audio/%(playlist_title?Playlist/%(playlist_title)s/|Single/)s%(playlist_index?%(playlist_index)s - |)s%(artist,uploader|Unknown)s - %(title)s.%(ext)s\" \"${d}1\" > /sdcard/Download/YT-Audio/.progress 2>&1\\nrm /sdcard/Download/YT-Audio/.progress' > /data/data/com.termux/files/home/bin/yt-audio && chmod +x /data/data/com.termux/files/home/bin/yt-audio"
                                if (activity is MainActivity) activity.callTermux("/system/bin/sh", arrayOf("-c", s), false, "SETUP")
                                done = true; prefs.edit().putBoolean("done", true).apply()
                            }
                        }
                        if (step < 5) Button(onClick = { step++ }, modifier = Modifier.align(Alignment.End)) { Text("Next") }
                    }
                } else {
                    OutlinedTextField(value = url, onValueChange = { url = it }, label = { Text("URL") }, modifier = Modifier.fillMaxWidth())
                    if (progress > 0f) LinearProgressIndicator(progress = progress, modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), color = Color.Red)
                    Button(onClick = { 
                        if (activity is MainActivity) activity.callTermux("/data/data/com.termux/files/home/bin/yt-audio", arrayOf(url), true, "DL_${System.currentTimeMillis()}")
                    }, modifier = Modifier.fillMaxWidth().padding(top = 16.dp).height(56.dp)) { Text("DOWNLOAD MP3") }
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
