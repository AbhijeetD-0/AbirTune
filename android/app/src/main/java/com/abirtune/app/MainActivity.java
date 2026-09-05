package com.abirtune.app;

import android.os.Bundle;
import android.os.PowerManager;
import android.content.Context;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeAudioPlugin.class);
        super.onCreate(savedInstanceState);
        
        // Acquire a partial wakelock to keep CPU running for background audio
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "AbirTune::BackgroundAudioLock");
        wakeLock.acquire();
    }

    @Override
    public void onPause() {
        super.onPause();
        // Force the WebView to stay awake to allow background HTML5 audio playback
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().resumeTimers();
            bridge.getWebView().onResume();
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        // Release the wakelock when the app is completely closed
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
