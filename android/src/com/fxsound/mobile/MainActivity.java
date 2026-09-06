package com.fxsound.mobile;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {

    private static final int REQUEST_MEDIA_PROJECTION = 1001;
    private WebView webView;
    private MediaProjectionManager projectionManager;
    private AudioService audioService;
    private boolean serviceBound = false;

    private final ServiceConnection connection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder binder) {
            audioService = ((AudioService.AudioBinder) binder).getService();
            serviceBound = true;
        }
        @Override
        public void onServiceDisconnected(ComponentName name) {
            audioService = null;
            serviceBound = false;
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        Window w = getWindow();
        w.setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            w.getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        int uiOptions = View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        w.getDecorView().setSystemUiVisibility(uiOptions);

        projectionManager = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new FxBridge(), "FxNative");
        webView.loadUrl("file:///android_asset/index.html");

        // Bind audio service (but don't start capture until user enables it)
        Intent svc = new Intent(this, AudioService.class);
        startService(svc);
        bindService(svc, connection, Context.BIND_AUTO_CREATE);
    }

    /** Javascript <-> native bridge */
    public class FxBridge {

        @JavascriptInterface
        public void startCapture() {
            runOnUiThread(() -> {
                try {
                    startActivityForResult(projectionManager.createScreenCaptureIntent(), REQUEST_MEDIA_PROJECTION);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Capture not available", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void stopCapture() {
            if (audioService != null) {
                audioService.stop();
            }
            runOnUiThread(() -> webView.evaluateJavascript("window.__onCaptureState && window.__onCaptureState(false)", null));
        }

        @JavascriptInterface
        public void setEffect(String id, int value) {
            if (audioService == null) return;
            switch (id) {
                case "fidelity": audioService.setClarity(value); break;
                case "ambience": audioService.setAmbience(value); break;
                case "surround": audioService.setSurround(value); break;
                case "dynamicBoost": audioService.setDynamicBoost(value); break;
                case "bass": audioService.setBass(value); break;
            }
        }

        @JavascriptInterface
        public void setEqBand(int band, float db) {
            if (audioService != null) audioService.setEqBand(band, db);
        }

        @JavascriptInterface
        public void setMasterGain(float db) {
            if (audioService != null) audioService.setMasterGain(db);
        }

        @JavascriptInterface
        public void setVolumeLeveling(float db) {
            if (audioService != null) audioService.setVolumeLeveling(db);
        }

        @JavascriptInterface
        public void setFilterQ(float q) {
            if (audioService != null) audioService.setFilterQ(q);
        }

        @JavascriptInterface
        public void setBalance(float v) {
            if (audioService != null) audioService.setBalance(v);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_MEDIA_PROJECTION) {
            if (resultCode == RESULT_OK && data != null) {
                MediaProjection mp = projectionManager.getMediaProjection(resultCode, data);
                if (audioService != null && mp != null) {
                    audioService.setMediaProjection(mp);
                    audioService.start();
                    runOnUiThread(() -> webView.evaluateJavascript("window.__onCaptureState && window.__onCaptureState(true)", null));
                }
            } else {
                Toast.makeText(this, "Permission denied", Toast.LENGTH_SHORT).show();
                runOnUiThread(() -> webView.evaluateJavascript("window.__onCaptureState && window.__onCaptureState(false)", null));
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (audioService != null) audioService.stop();
        if (serviceBound) {
            unbindService(connection);
            serviceBound = false;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
