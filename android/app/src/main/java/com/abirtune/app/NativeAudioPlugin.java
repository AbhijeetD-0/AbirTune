package com.abirtune.app;

import android.media.AudioAttributes;
import android.media.MediaPlayer;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeAudioBridge")
public class NativeAudioPlugin extends Plugin {

    private MediaPlayer mediaPlayer;
    private boolean isPrepared = false;

    @PluginMethod
    public void load(PluginCall call) {
        String url = call.getString("url");
        if (url == null) {
            call.reject("Must provide an audio URL");
            return;
        }

        try {
            if (mediaPlayer != null) {
                mediaPlayer.release();
            }
            isPrepared = false;
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build()
            );
            mediaPlayer.setDataSource(url);

            mediaPlayer.setOnPreparedListener(mp -> {
                isPrepared = true;
                notifyListeners("canplay", new JSObject());
                call.resolve();
            });

            mediaPlayer.setOnCompletionListener(mp -> {
                notifyListeners("ended", new JSObject());
            });
            
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                JSObject ret = new JSObject();
                ret.put("error", what);
                notifyListeners("error", ret);
                return true;
            });

            mediaPlayer.prepareAsync();
        } catch (Exception e) {
            call.reject("Error loading audio: " + e.getMessage());
        }
    }

    @PluginMethod
    public void play(PluginCall call) {
        if (mediaPlayer != null && isPrepared) {
            mediaPlayer.start();
            notifyListeners("play", new JSObject());
        }
        call.resolve();
    }

    @PluginMethod
    public void pause(PluginCall call) {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.pause();
            notifyListeners("pause", new JSObject());
        }
        call.resolve();
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        if (mediaPlayer != null) {
            float volume = call.getFloat("volume", 1.0f);
            mediaPlayer.setVolume(volume, volume);
        }
        call.resolve();
    }

    @PluginMethod
    public void seek(PluginCall call) {
        if (mediaPlayer != null && isPrepared) {
            int timeMs = call.getInt("timeMs", 0);
            mediaPlayer.seekTo(timeMs);
        }
        call.resolve();
    }

    @PluginMethod
    public void getCurrentTime(PluginCall call) {
        JSObject ret = new JSObject();
        if (mediaPlayer != null && isPrepared) {
            ret.put("timeMs", mediaPlayer.getCurrentPosition());
        } else {
            ret.put("timeMs", 0);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void destroy(PluginCall call) {
        if (mediaPlayer != null) {
            mediaPlayer.release();
            mediaPlayer = null;
            isPrepared = false;
        }
        call.resolve();
    }
}
