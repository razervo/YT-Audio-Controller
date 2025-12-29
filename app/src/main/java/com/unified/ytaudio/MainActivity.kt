package com.unified.ytaudio

import android.app.Activity
import android.content.*
import android.content.pm.PackageManager
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

// Safe Context Finder
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
    
    // Bridge Logic
    fun callTermux(path: String, args: Array<String>, isBg: Boolean, sid: String) {
        try {
            val i = Intent("com.termux.RUN_COMMAND").apply {
                component = ComponentName("com.termux", "com.termux.app.RunCommandService")
                putExtra("com.termux.RUN_COMMAND_PATH", path)
                putExtra("com.termux.RUN_COMMAND_ARGUMENTS", args)
                putExtra("com.termux.RUN_COMMAND_SESSION_ACTION", "0")
                putExtra("com.termux.RUN_COMMAND_BACKGROUND", isBg)
                putExtra("com.termux.RUN_COMMAND_SESSION_ID", sid)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            val uniqueId = System.currentTimeMillis().toInt()
            val pi = android.app.PendingIntent.getService(
                this, uniqueId, i, 
                android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE
            )
            pi.send()
            
        } catch (e: Exception) { 
             Toast.makeText(this, "Termux Error: ${e.message}", Toast.LENGTH_LONG).show()
        }
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
    
    // [FIX] We construct the command parts dynamically
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
                    val pixelUA = "Mozilla/5.0 (Linux; Android 13; Pixel 7 Pro Build/TQ1A.230105.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.196 Mobile Safari/537.36"
                    val stealthUA = pixelUA.replace("; wv", "").replace("Version/4.0 ", "")
                    settings.userAgentString = stealthUA
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(v: WebView?, u: String?) {
                            val stealthJS = """
                                javascript:(function() {
                                    try { Object.defineProperty(navigator, 'userAgentData', { get: () => ({ brands: [{brand: "Google Chrome", version: "114"}], mobile: true, platform: "Android" }) }); } catch(e) {}
                                    try { Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] }); } catch(e) {}
                                    try { Object.defineProperty(navigator, 'webdriver', {get: () => undefined}); } catch(e) {}
                                })()
                            """
                            v?.evaluateJavascript(stealthJS, null)

                            val cks = CookieManager.getInstance().getCookie(u)
                            if (cks != null && cks.contains("SID=")) {
                                prefs.edit().putString("cks", cks).apply()
                            }
                        }
                    }
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
                                } catch(e: Exception) { step = 3 }
                            }
                            3 -> Wizard("Security", "Permissions > 3 Dots > Additional > Allow Run Commands.", "App Info") { 
                                try {
                                    activity?.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply { data = Uri.parse("package:${activity.packageName}") })
                                    step = 4 
                                } catch (e: Exception) {}
                            }
                            4 -> Wizard("Identity", "Sign in (Stealth Mode)", "Sign In") { showLogin = true }
                            5 -> Wizard("Finalize", "Install Tools", "Initialize") {
                                // [FIX 1] SETUP: Only install tools. Add 'read' to keep window open.
                                val s = "pkg update -y && pkg install python ffmpeg deno -y && pip install yt-dlp && mkdir -p ~/bin && termux-setup-storage && echo 'SETUP FINISHED - CLOSE THIS WINDOW' && read"
                                if (activity is MainActivity) {
                                    activity.callTermux("/system/bin/sh", arrayOf("-c", s), false, "SETUP")
                                }
                                done = true; prefs.edit().putBoolean("done", true).apply()
                            }
                        }
                        if (step < 5) Button(onClick = { step++ }, modifier = Modifier.align(Alignment.End)) { Text("Next") }
                    }
                } else {
                    OutlinedTextField(value = url, onValueChange = { url = it }, label = { Text("URL") }, modifier = Modifier.fillMaxWidth())
                    if (progress > 0f) LinearProgressIndicator(progress = progress, modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), color = Color.Red)
                    Button(onClick = { 
                        if (activity is MainActivity) {
                            // [FIX 2] DOWNLOAD: Inject Cookie Dynamically + Keep window open on error
                            val cks = prefs.getString("cks", "") ?: ""
                            val cleanCookie = cks.replace("\"", "") // Sanitize
                            
                            // The Command
                            val cmd = "yt-dlp -x --audio-format mp3 --restrict-filenames --extractor-args \"youtube:player-client=android\" --add-header \"Cookie: $cleanCookie\" --newline --progress-template \"%(progress._percent_str)s\" -o \"/sdcard/Download/YT-Audio/%(playlist_title?Playlist/%(playlist_title)s/|Single/)s%(playlist_index?%(playlist_index)s - |)s%(artist,uploader|Unknown)s - %(title)s.%(ext)s\" \"$url\" > /sdcard/Download/YT-Audio/.progress 2>&1; echo 'DONE'; read"
                            
                            // Execute via Termux Bash to ensure PATH is correct
                            activity.callTermux("/data/data/com.termux/files/usr/bin/bash", arrayOf("-l", "-c", cmd), false, "DL_${System.currentTimeMillis()}")
                        }
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
