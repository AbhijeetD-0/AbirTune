const fs = require('fs');

let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

// Imports
code = code.replace(
  "import { Capacitor, registerPlugin } from '@capacitor/core';",
  "import { Capacitor } from '@capacitor/core';\nimport { Media, MediaObject } from '@awesome-cordova-plugins/media';"
);
code = code.replace("const NativeAudioBridge = registerPlugin<any>('NativeAudioBridge');\n", "");

// Fields
code = code.replace("private htmlAudio: HTMLAudioElement | null = null;", "private nativeMedia: MediaObject | null = null;");
code = code.replace("private isHtmlAudioActive: boolean = false;", "private isNativeMediaActive: boolean = false;");
code = code.replace("private useNativeAudio: boolean = false;", "");

// Fix references
code = code.replace(/isHtmlAudioActive/g, "isNativeMediaActive");
code = code.replace(/htmlAudio/g, "nativeMedia");

// Remove initHtmlAudio body
code = code.replace(/private initHtmlAudio\(\) \{[\s\S]*?(?=\n  \/\*\*|\n  private initSilentCarrierAudio)/, `private initHtmlAudio() {
    // Replaced by native Media plugin, initialized per-track
  }
`);

// update playHtmlAudio
code = code.replace(/private async playHtmlAudio[\s\S]*?(?=\n  \/\*\*|\n  private startHarmonicSynth)/, `private playHtmlAudio(url: string, startFrom: number = 0) {
    if (this.nativeMedia) {
      this.nativeMedia.release();
      this.nativeMedia = null;
    }
    
    try {
      this.isNativeMediaActive = true;
      this.nativeMedia = Media.create(url);
      
      this.nativeMedia.onSuccess.subscribe(() => {
        if (this.isNativeMediaActive) {
          this.isPlaying = false;
          this.isNativeMediaActive = false;
          if (this.onEndedCallback) {
            this.onEndedCallback();
          }
        }
      });
      
      this.nativeMedia.onError.subscribe((err: any) => {
        console.warn('Native Media error', err);
        this.isNativeMediaActive = false;
        this.startHarmonicSynth();
        this.startFallbackTimer();
      });

      this.nativeMedia.play();
      this.nativeMedia.setVolume(this.isMuted ? 0 : this.currentVolume);
      if (startFrom > 0) {
        this.nativeMedia.seekTo(startFrom * 1000);
        this.currentTime = startFrom;
      }
      this.startPolling();
    } catch (err) {
      console.warn('Native Media exception', err);
      this.isNativeMediaActive = false;
      this.startHarmonicSynth();
      this.startFallbackTimer();
    }
  }
`);

// Fix pause
code = code.replace(/if \(this\.useNativeAudio[\s\S]*?\} else if \(this\.nativeMedia && this\.isNativeMediaActive\) \{[\s\S]*?\}/, `if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        this.nativeMedia.pause();
      } catch {}
    }`);

// Fix resume
code = code.replace(/if \(this\.useNativeAudio[\s\S]*?\} else if \(this\.nativeMedia && this\.isNativeMediaActive\) \{[\s\S]*?\}/, `if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        this.nativeMedia.play();
        this.startPolling();
        return;
      } catch {}
    }`);

// Fix seek
code = code.replace(/if \(this\.useNativeAudio[\s\S]*?\} else if \(this\.nativeMedia && this\.isNativeMediaActive\) \{[\s\S]*?\}/, `if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        this.nativeMedia.seekTo(this.currentTime * 1000);
      } catch {}
    }`);

// Fix setVolume
code = code.replace(/if \(this\.useNativeAudio[\s\S]*?\} else if \(this\.nativeMedia\) \{[\s\S]*?\}/, `if (this.nativeMedia) {
      try {
        this.nativeMedia.setVolume(this.isMuted ? 0 : this.currentVolume);
      } catch {}
    }`);

// Fix toggleMute
code = code.replace(/if \(this\.useNativeAudio[\s\S]*?\} else if \(this\.nativeMedia\) \{[\s\S]*?\}/, `if (this.nativeMedia) {
      try {
        this.nativeMedia.setVolume(this.isMuted ? 0 : this.currentVolume);
      } catch {}
    }`);

// Fix getCurrentTime
code = code.replace(/if \(this\.nativeMedia && this\.isNativeMediaActive\) \{\n      return this\.nativeMedia\.currentTime \|\| this\.currentTime;\n    \}/, `// Polling updates this.currentTime for nativeMedia`);

// Fix getDuration
code = code.replace(/if \(this\.nativeMedia && this\.isNativeMediaActive && this\.nativeMedia\.duration > 0\) \{\n      return this\.nativeMedia\.duration;\n    \}/, `if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        const d = this.nativeMedia.getDuration();
        if (d > 0) return d;
      } catch {}
    }`);

// Fix seek bounds check
code = code.replace(/if \(this\.nativeMedia && this\.isNativeMediaActive && this\.nativeMedia\.duration > 0\) \{\n      this\.currentTrackDuration = this\.nativeMedia\.duration;\n    \}/, `if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        const d = this.nativeMedia.getDuration();
        if (d > 0) this.currentTrackDuration = d;
      } catch {}
    }`);

// Fix startPolling
code = code.replace(/if \(this\.useNativeAudio[\s\S]*?\} else if \(this\.player && typeof this\.player\.getCurrentTime === 'function'\) \{/, `if (this.nativeMedia && this.isNativeMediaActive) {
        try {
          const res = await this.nativeMedia.getCurrentPosition();
          if (typeof res === 'number' && res >= 0) {
            this.currentTime = res;
            if (this.onTimeUpdateCallback) {
              this.onTimeUpdateCallback(this.currentTime);
            }
          }
          const d = this.nativeMedia.getDuration();
          if (d > 0) this.currentTrackDuration = d;
        } catch {}
      } else if (this.player && typeof this.player.getCurrentTime === 'function') {`);

fs.writeFileSync('src/audio/audioEngine.ts', code);
