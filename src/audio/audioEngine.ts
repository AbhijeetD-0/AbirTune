/**
 * Multi-Tier High-Fidelity Audio Engine for AbirTune.
 * 
 * Architecture:
 * 1. Official YouTube IFrame Player (optimized with responsive viewport sizing & origin handshake)
 * 2. Native HTML5 Audio streaming (for direct streams / audio URLs)
 * 3. Web Audio Harmonic Engine (real-time melodic synthesizer backup for instant, zero-delay sound)
 * 
 * Guarantees smooth, uninterrupted playback, synchronized progress, full media controls,
 * and robust error recovery across all devices and browsers.
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
    webkitAudioContext?: typeof AudioContext;
  }
}

import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeAudioBridge = registerPlugin<any>('NativeAudioBridge');

export interface TrackMetadata {
  title?: string;
  artist?: string;
  genre?: string;
  moodCategory?: string;
}

class AudioEngine {
  // YouTube IFrame Player State
  private player: any = null;
  private isApiReady: boolean = false;
  private isPlayerReady: boolean = false;
  private isYouTubePlaying: boolean = false;
  private isPlaying: boolean = false;
  private isUserPaused: boolean = false;
  private currentVolume: number = 1.0;
  private isMuted: boolean = false;

  // HTML5 Audio Fallback
  private htmlAudio: HTMLAudioElement | null = null;
  private isHtmlAudioActive: boolean = false;
  private useNativeAudio: boolean = false;
  // Silent audio carrier to hijack media session focus and keep background playback alive
  private silentAudio: HTMLAudioElement | null = null;

  // Web Audio Harmonic Synthesizer Fallback
  private audioCtx: AudioContext | null = null;
  private synthGainNode: GainNode | null = null;
  private synthIntervalId: number | null = null;
  private isSynthActive: boolean = false;

  // Time & Progress Tracking
  private pollIntervalId: number | null = null;
  private fallbackTimerId: number | null = null;
  private currentTrackDuration: number = 210;
  private currentTime: number = 0;
  private currentVideoId: string = '';
  private trackId: string = '';
  private currentBpm: number = 100;
  private currentTrackMeta: TrackMetadata = {};

  // Event Callbacks
  private onTimeUpdateCallback: ((currentTime: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onBufferingCallback: ((isBuffering: boolean) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;

  // Pending Play Request
  private pendingPlay: {
    videoId: string;
    duration: number;
    resumeFrom: number;
    streamUrl?: string;
    trackMeta?: TrackMetadata;
  } | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initYouTubeApi();
      this.initHtmlAudio();
    }
  }

  /**
   * Unlock Web Audio & Autoplay policies on first user interaction
   */
  public unlockAudio() {
    try {
      if (!this.audioCtx && typeof window !== 'undefined') {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {}
  }

  /**
   * Initialize HTML5 Audio Element for direct stream fallback
   */
  private initHtmlAudio() {
    try {
      if (Capacitor.isNativePlatform() && NativeAudioBridge) {
        this.useNativeAudio = true;
        const bridge = NativeAudioBridge;
        bridge.addListener('ended', () => {
          if (this.isHtmlAudioActive) {
            this.isPlaying = false;
            this.isHtmlAudioActive = false;
            if (this.onEndedCallback) {
              this.onEndedCallback();
            }
          }
        });
        bridge.addListener('error', () => {
          if (this.isHtmlAudioActive) {
            this.isHtmlAudioActive = false;
            this.startHarmonicSynth();
          }
        });
        return;
      }
      
      if (typeof Audio !== 'undefined') {
        this.htmlAudio = new Audio();
        this.htmlAudio.preload = 'auto';
        this.htmlAudio.addEventListener('timeupdate', () => {
          if (this.isHtmlAudioActive && this.htmlAudio) {
            this.currentTime = this.htmlAudio.currentTime;
            if (this.onTimeUpdateCallback) {
              this.onTimeUpdateCallback(this.currentTime);
            }
          }
        });
        this.htmlAudio.addEventListener('ended', () => {
          if (this.isHtmlAudioActive) {
            this.isPlaying = false;
            this.isHtmlAudioActive = false;
            if (this.onEndedCallback) {
              this.onEndedCallback();
            }
          }
        });
        this.htmlAudio.addEventListener('error', () => {
          if (this.isHtmlAudioActive) {
            this.isHtmlAudioActive = false;
            this.startHarmonicSynth();
          }
        });

        // Initialize persistent silent audio carrier for system media notification & background lock
        this.initSilentCarrierAudio();
      }
    } catch {}
  }

  /**
   * Generates a valid standard PCM WAV silence blob URL (4 seconds).
   * Unlike 44-byte dummy WAVs, a multi-second valid PCM WAV loops smoothly without
   * buffer underrun errors on Android AudioTrack, keeping the media notification persistent!
   */
  private createSilentWavUrl(seconds: number = 4): string {
    try {
      const sampleRate = 8000;
      const numChannels = 1;
      const bitsPerSample = 8;
      const numSamples = sampleRate * seconds;
      const dataSize = numSamples;
      const buffer = new ArrayBuffer(44 + dataSize);
      const view = new DataView(buffer);

      // "RIFF" chunk descriptor
      view.setUint32(0, 0x52494646, false); // "RIFF"
      view.setUint32(4, 36 + dataSize, true);
      view.setUint32(8, 0x57415645, false); // "WAVE"

      // "fmt " sub-chunk
      view.setUint32(12, 0x666d7420, false); // "fmt "
      view.setUint32(16, 16, true);          // Subchunk1Size = 16 for PCM
      view.setUint16(20, 1, true);           // AudioFormat = 1 (PCM)
      view.setUint16(22, numChannels, true); // NumChannels = 1
      view.setUint32(24, sampleRate, true);  // SampleRate
      view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
      view.setUint16(32, numChannels * (bitsPerSample / 8), true);              // BlockAlign
      view.setUint16(34, bitsPerSample, true);                                  // BitsPerSample

      // "data" sub-chunk
      view.setUint32(36, 0x64617461, false); // "data"
      view.setUint32(40, dataSize, true);

      // 8-bit unsigned PCM silence is value 128 (0x80)
      const pcm = new Uint8Array(buffer, 44, dataSize);
      pcm.fill(128);

      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    } catch {
      return 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    }
  }

  /**
   * Initializes and attaches the in-DOM silent audio element required by Android
   * NotificationManager and MediaSessionService to keep lock screen controls and
   * the notification bar active even during YouTube iframe playback.
   */
  public initSilentCarrierAudio() {
    try {
      if (typeof document === 'undefined') return;

      if (!this.silentAudio) {
        let el = document.getElementById('abirtune-background-carrier') as HTMLAudioElement;
        if (!el) {
          el = document.createElement('audio');
          el.id = 'abirtune-background-carrier';
          el.setAttribute('aria-hidden', 'true');
          el.style.position = 'fixed';
          el.style.bottom = '0px';
          el.style.right = '0px';
          el.style.width = '1px';
          el.style.height = '1px';
          el.style.opacity = '0.001';
          el.style.pointerEvents = 'none';
          document.body.appendChild(el);
        }
        el.loop = true;
        el.preload = 'auto';
        el.crossOrigin = 'anonymous';
        (el as any).playsInline = true;
        // Inaudible 8-bit silence at 0.01 volume marks this as active audio to Android AudioTrack
        el.volume = 0.01;
        el.src = this.createSilentWavUrl(4);
        this.silentAudio = el;
      }
    } catch (e) {
      console.warn('Silent audio carrier setup warning:', e);
    }
  }

  /**
   * Inject YouTube IFrame API and hook ready events with polling guarantee
   */
  private initYouTubeApi() {
    // If API already available
    if (window.YT && window.YT.Player) {
      this.isApiReady = true;
      this.mountPlayer();
      return;
    }

    // Preserve previous callback if present
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevCallback === 'function') {
        try {
          prevCallback();
        } catch {}
      }
      this.isApiReady = true;
      this.mountPlayer();
    };

    // Active polling fallback in case onYouTubeIframeAPIReady already fired
    const pollTimer = window.setInterval(() => {
      if (window.YT && typeof window.YT.Player === 'function') {
        window.clearInterval(pollTimer);
        this.isApiReady = true;
        if (!this.player) {
          this.mountPlayer();
        }
      }
    }, 60);

    // Cancel polling after 12 seconds
    window.setTimeout(() => window.clearInterval(pollTimer), 12000);

    // Inject script tag if not already injected
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }

  /**
   * Mount YouTube Player inside a viewport-active, completely invisible container.
   * Note: Chrome blocks autoplay if the iframe is sized 1x1, opacity 0, or positioned at -9999px.
   * Setting size to 240x240 with opacity 0.001 at bottom-right satisfies Chrome & YouTube visibility requirements.
   */
  private mountPlayer() {
    if (typeof document === 'undefined' || this.player || !window.YT || !window.YT.Player) {
      return;
    }

    let hostContainer = document.getElementById('youtube-audio-container');
    if (!hostContainer) {
      hostContainer = document.createElement('div');
      hostContainer.id = 'youtube-audio-container';
      hostContainer.setAttribute('aria-hidden', 'true');
      hostContainer.style.position = 'fixed';
      hostContainer.style.bottom = '0px';
      hostContainer.style.right = '0px';
      hostContainer.style.width = '240px';
      hostContainer.style.height = '240px';
      hostContainer.style.opacity = '0.001';
      hostContainer.style.pointerEvents = 'none';
      hostContainer.style.zIndex = '-50';
      hostContainer.style.overflow = 'hidden';
      document.body.appendChild(hostContainer);
    }

    let hostEl = document.getElementById('youtube-audio-host');
    if (!hostEl) {
      hostEl = document.createElement('div');
      hostEl.id = 'youtube-audio-host';
      hostContainer.appendChild(hostEl);
    }

    try {
      const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : '';
      const currentHref = typeof window !== 'undefined' && window.location.href ? window.location.href : '';

      this.player = new window.YT.Player('youtube-audio-host', {
        height: '240',
        width: '240',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: currentOrigin,
          widget_referrer: currentHref,
        },
        events: {
          onReady: (event: any) => {
            this.isPlayerReady = true;
            try {
              event.target.setVolume(Math.round(this.currentVolume * 100));
              if (this.isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
              }
            } catch {}

            // Ensure iframe has autoplay & encrypted-media attributes
            const iframe = document.querySelector('#youtube-audio-container iframe');
            if (iframe) {
              iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
            }

            if (this.pendingPlay) {
              const pending = this.pendingPlay;
              this.pendingPlay = null;
              this.playTrack(
                pending.videoId,
                pending.duration,
                this.currentBpm,
                pending.resumeFrom,
                pending.streamUrl,
                pending.trackMeta
              );
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            const YTState = window.YT?.PlayerState;

            if (!YTState) return;

            if (state === YTState.PLAYING) {
              this.isYouTubePlaying = true;
              this.isPlaying = true;
              this.stopHarmonicSynth();
              this.stopFallbackTimer();
              this.startPolling();
              if (this.onBufferingCallback) {
                this.onBufferingCallback(false);
              }
            } else if (state === YTState.PAUSED) {
              this.isYouTubePlaying = false;
              if (this.isUserPaused) {
                // Genuine user-triggered pause (via UI or Bluetooth control)
                if (!this.isSynthActive && !this.isHtmlAudioActive) {
                  this.isPlaying = false;
                  this.stopPolling();
                }
              } else if (this.isPlaying) {
                // Background suspension / screen-lock pause intercepted!
                // Maintain active playback state and re-trigger video playback
                console.log('[AudioEngine] Background suspension detected, keeping audio alive...');
                try {
                  this.player.playVideo();
                } catch {}
                if (this.silentAudio && this.silentAudio.paused) {
                  this.silentAudio.play().catch(() => {});
                }
              }
            } else if (state === YTState.BUFFERING) {
              if (this.onBufferingCallback) {
                this.onBufferingCallback(true);
              }
            } else if (state === YTState.ENDED) {
              this.isYouTubePlaying = false;
              this.isPlaying = false;
              this.stopPolling();
              this.stopFallbackTimer();
              this.stopHarmonicSynth();
              if (this.onEndedCallback) {
                this.onEndedCallback();
              }
            }
          },
          onError: (errorEvent: any) => {
            const errorCode = errorEvent?.data;
            console.warn(`YouTube IFrame Player error event (code ${errorCode}) on video ${this.currentVideoId}`);
            this.isYouTubePlaying = false;
            if (this.onBufferingCallback) {
              this.onBufferingCallback(false);
            }

            // If error is code 150/101 (embed disabled by content owner) or 100/2/5:
            // Activate Harmonic Synthesizer fallback immediately so audio never cuts out!
            if (this.isPlaying) {
              this.startHarmonicSynth();
              this.startFallbackTimer();
            }

            // Single error callback notification so parent can optionally search alternative embeddable video
            if (this.onErrorCallback) {
              this.onErrorCallback({ code: errorCode, videoId: this.currentVideoId });
            }
          },
        },
      });
    } catch (err) {
      console.warn('Could not instantiate YouTube Player:', err);
    }
  }

  /**
   * Set engine event callbacks
   */
  public setCallbacks(
    onTimeUpdate: (currentTime: number) => void,
    onEnded: () => void,
    onBuffering?: (isBuffering: boolean) => void,
    onError?: (error: any) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
    if (onBuffering) {
      this.onBufferingCallback = onBuffering;
    }
    if (onError) {
      this.onErrorCallback = onError;
    }
  }

  /**
   * Extract or normalize YouTube video ID
   */
  private cleanVideoId(rawId: string): string {
    if (!rawId) return '';
    if (rawId.length === 11 && !rawId.includes('/') && !rawId.includes('?')) {
      return rawId;
    }
    if (rawId.includes('/watch?v=')) {
      return rawId.split('/watch?v=')[1].split('&')[0];
    }
    if (rawId.includes('youtu.be/')) {
      return rawId.split('youtu.be/')[1].split('?')[0];
    }
    if (rawId.includes('/embed/')) {
      return rawId.split('/embed/')[1].split('?')[0];
    }
    const clean = rawId.replace(/^\//, '');
    if (clean.length === 11) return clean;
    return rawId;
  }

  /**
   * Play track with multi-tier fallback:
   * 1. Official YouTube Player
   * 2. Direct HTML5 audio (if streamUrl provided)
   * 3. Web Audio Harmonic Synthesizer
   */
  public playTrack(
    trackOrVideoId: string,
    duration: number = 210,
    bpm: number = 100,
    resumeFrom: number = 0,
    streamUrl?: string,
    trackMeta?: TrackMetadata
  ) {
    this.unlockAudio();
    this.trackId = trackOrVideoId;
    this.currentTrackDuration = duration || 210;
    this.currentTime = resumeFrom;
    this.currentBpm = bpm || 100;
    this.currentTrackMeta = trackMeta || {};
    this.isUserPaused = false;
    this.isPlaying = true;

    this.initSilentCarrierAudio();
    if (this.silentAudio) {
      this.silentAudio.play().catch(() => {});
    }

    // Direct HTML5 Audio stream route (if provided)
    if (streamUrl && streamUrl.startsWith('http')) {
      this.playHtmlAudio(streamUrl, resumeFrom);
      return;
    }

    const videoId = this.cleanVideoId(trackOrVideoId);
    this.currentVideoId = videoId;

    const isValidYouTubeId = videoId && videoId.length === 11 && !videoId.startsWith('yt-');

    if (!isValidYouTubeId) {
      // Non-YouTube custom track: run harmonic synthesizer with smooth progress
      this.startHarmonicSynth();
      this.startFallbackTimer();
      return;
    }

    // If player is not yet ready, queue it and start pleasant audio immediately
    if (!this.isPlayerReady || !this.player || typeof this.player.loadVideoById !== 'function') {
      this.pendingPlay = {
        videoId,
        duration,
        resumeFrom,
        streamUrl,
        trackMeta,
      };
      this.startHarmonicSynth();
      this.startFallbackTimer();
      return;
    }

    try {
      this.stopFallbackTimer();
      if (this.onBufferingCallback) {
        this.onBufferingCallback(true);
      }

      // Unmute & configure volume
      if (!this.isMuted) {
        this.player.unMute();
        this.player.setVolume(Math.round(this.currentVolume * 100));
      } else {
        this.player.mute();
      }

      // Load and begin playback
      if (typeof this.player.loadVideoById === 'function') {
        this.player.loadVideoById(videoId, resumeFrom);
      }
      if (typeof this.player.playVideo === 'function') {
        try {
          this.player.playVideo();
        } catch {}
      }

      this.startPolling();
    } catch (err) {
      console.warn('YouTube loadVideoById error, activating harmonic audio:', err);
      this.startHarmonicSynth();
      this.startFallbackTimer();
    }
  }

  /**
   * HTML5 Audio stream player
   */
  private async playHtmlAudio(url: string, startFrom: number = 0) {
    if (this.useNativeAudio && NativeAudioBridge) {
      this.isHtmlAudioActive = true;
      try {
        await NativeAudioBridge.load({ url });
        if (startFrom > 0) {
           await NativeAudioBridge.seek({ timeMs: startFrom * 1000 });
           this.currentTime = startFrom;
        }
        await NativeAudioBridge.setVolume({ volume: this.isMuted ? 0 : this.currentVolume });
        await NativeAudioBridge.play();
        this.startPolling();
      } catch (err) {
        console.warn('Native Audio play error:', err);
        this.isHtmlAudioActive = false;
        this.startHarmonicSynth();
        this.startFallbackTimer();
      }
      return;
    }

    if (!this.htmlAudio) {
      this.startHarmonicSynth();
      this.startFallbackTimer();
      return;
    }

    try {
      this.isHtmlAudioActive = true;
      this.htmlAudio.src = url;
      this.htmlAudio.volume = this.isMuted ? 0 : this.currentVolume;

      // Crucial fix: wait for metadata to safely set currentTime without causing premature ended/error
      const onMetadataLoaded = () => {
        if (this.htmlAudio && this.isHtmlAudioActive) {
          try {
            if (this.htmlAudio.duration > 0) {
              this.currentTrackDuration = this.htmlAudio.duration;
            }
            if (startFrom > 0 && startFrom < this.currentTrackDuration) {
              this.htmlAudio.currentTime = startFrom;
            }
          } catch {}
        }
        if (this.htmlAudio) {
          this.htmlAudio.removeEventListener('loadedmetadata', onMetadataLoaded);
        }
      };
      this.htmlAudio.addEventListener('loadedmetadata', onMetadataLoaded);

      const playPromise = this.htmlAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('HTML5 Audio play error:', err);
          this.isHtmlAudioActive = false;
          this.startHarmonicSynth();
          this.startFallbackTimer();
        });
      }
    } catch {
      this.isHtmlAudioActive = false;
      this.startHarmonicSynth();
      this.startFallbackTimer();
    }
  }

  /**
   * Web Audio API Harmonic Engine (Generative Melodic Synthesizer)
   * Ensures the user ALWAYS hears music matching the song's BPM and mood even if offline or YouTube is blocked.
   */
  private startHarmonicSynth() {
    if (this.isYouTubePlaying) return;
    this.isSynthActive = true;
    this.unlockAudio();

    if (!this.audioCtx) return;

    try {
      if (this.synthIntervalId !== null) {
        window.clearInterval(this.synthIntervalId);
        this.synthIntervalId = null;
      }

      // Harmonic chords based on mood category
      const mood = (this.currentTrackMeta.moodCategory || '').toLowerCase();
      let chords: number[][];

      if (mood.includes('sad') || mood.includes('heartbreak')) {
        // Minor chords (Am - F - C - G)
        chords = [
          [220.0, 261.63, 329.63], // Am
          [174.61, 220.0, 261.63], // F
          [130.81, 164.81, 196.0], // C
          [196.0, 246.94, 293.66], // G
        ];
      } else if (mood.includes('romance') || mood.includes('romantic')) {
        // Warm romantic chords (Fmaj7 - Em7 - Dm7 - Cmaj7)
        chords = [
          [174.61, 220.0, 261.63, 329.63],
          [164.81, 196.0, 246.94, 293.66],
          [146.83, 174.61, 220.0, 261.63],
          [130.81, 164.81, 196.0, 246.94],
        ];
      } else if (mood.includes('relax') || mood.includes('chill')) {
        // Ambient Lo-Fi chords
        chords = [
          [196.0, 246.94, 293.66, 349.23], // Gmaj7
          [164.81, 220.0, 261.63, 329.63], // Am7
          [146.83, 174.61, 220.0, 261.63], // Dm7
          [130.81, 164.81, 196.0, 246.94], // Cmaj7
        ];
      } else {
        // Vibrant Indian Pop / Bollywood chords (C - G - Am - F)
        chords = [
          [261.63, 329.63, 392.0], // C
          [196.0, 246.94, 293.66], // G
          [220.0, 261.63, 329.63], // Am
          [174.61, 220.0, 261.63], // F
        ];
      }

      let chordIndex = 0;
      const beatInterval = Math.max(1200, (60 / Math.max(60, this.currentBpm)) * 2000);

      const playChord = () => {
        if (!this.isPlaying || !this.isSynthActive || !this.audioCtx || this.isYouTubePlaying) {
          return;
        }

        const now = this.audioCtx.currentTime;
        const currentChord = chords[chordIndex % chords.length];
        chordIndex++;

        // Polyphonic voice generation with soft filter
        const filter = this.audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now);

        const chordGain = this.audioCtx.createGain();
        const baseVolume = this.isMuted ? 0 : this.currentVolume * 0.18;
        chordGain.gain.setValueAtTime(0.001, now);
        chordGain.gain.linearRampToValueAtTime(baseVolume, now + 0.35);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + (beatInterval / 1000) * 0.95);

        filter.connect(chordGain);
        chordGain.connect(this.audioCtx.destination);

        currentChord.forEach((freq) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(filter);
          osc.start(now);
          osc.stop(now + beatInterval / 1000);
        });
      };

      playChord();
      this.synthIntervalId = window.setInterval(playChord, beatInterval);
    } catch (e) {
      console.warn('Harmonic synth initialization notice:', e);
    }
  }

  /**
   * Stop Harmonic Synthesizer
   */
  private stopHarmonicSynth() {
    this.isSynthActive = false;
    if (this.synthIntervalId !== null) {
      window.clearInterval(this.synthIntervalId);
      this.synthIntervalId = null;
    }
  }

  /**
   * Pause playback across all engines
   */
  public pause() {
    this.isUserPaused = true;
    this.isPlaying = false;
    this.stopPolling();
    this.stopFallbackTimer();
    this.stopHarmonicSynth();

    if (this.silentAudio) {
      this.silentAudio.pause();
    }

    if (this.player && typeof this.player.pauseVideo === 'function') {
      try {
        this.player.pauseVideo();
      } catch {}
    }

    if (this.useNativeAudio && this.isHtmlAudioActive && NativeAudioBridge) {
      NativeAudioBridge.pause();
    } else if (this.htmlAudio && this.isHtmlAudioActive) {
      try {
        this.htmlAudio.pause();
      } catch {}
    }
  }

  /**
   * Resume playback
   */
  public resume() {
    this.unlockAudio();
    this.isUserPaused = false;
    this.isPlaying = true;

    this.initSilentCarrierAudio();
    if (this.silentAudio) {
      this.silentAudio.play().catch(() => {});
    }

    if (this.useNativeAudio && this.isHtmlAudioActive && NativeAudioBridge) {
      NativeAudioBridge.play();
      this.startPolling();
      return;
    } else if (this.htmlAudio && this.isHtmlAudioActive) {
      try {
        this.htmlAudio.play().catch(() => {});
        return;
      } catch {}
    }

    if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
        this.startPolling();
        return;
      } catch {}
    }

    // Fallback resume
    this.startHarmonicSynth();
    this.startFallbackTimer();
  }

  /**
   * Seek to specific position in seconds
   */
  public seek(seconds: number) {
    if (this.htmlAudio && this.isHtmlAudioActive && this.htmlAudio.duration > 0) {
      this.currentTrackDuration = this.htmlAudio.duration;
    } else if (this.player && typeof this.player.getDuration === 'function' && this.isYouTubePlaying) {
      try {
        const d = this.player.getDuration();
        if (typeof d === 'number' && d > 0) {
          this.currentTrackDuration = d;
        }
      } catch {}
    }

    // Safety margin to prevent seeking exactly to the very end and triggering ENDED prematurely
    // Also, if someone seeks past duration, we cap it at duration - 2 seconds
    this.currentTime = Math.max(0, Math.min(seconds, this.currentTrackDuration - 2));

    if (this.player && typeof this.player.seekTo === 'function') {
      try {
        this.player.seekTo(this.currentTime, true);
      } catch (err) {
        console.warn('SeekTo error:', err);
      }
    }

    if (this.useNativeAudio && this.isHtmlAudioActive && NativeAudioBridge) {
      NativeAudioBridge.seek({ timeMs: this.currentTime * 1000 });
    } else if (this.htmlAudio && this.isHtmlAudioActive) {
      try {
        this.htmlAudio.currentTime = this.currentTime;
      } catch {}
    }

    if (this.onTimeUpdateCallback) {
      this.onTimeUpdateCallback(this.currentTime);
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));

    if (this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(Math.round(this.currentVolume * 100));
      } catch {}
    }

    if (this.useNativeAudio && this.isHtmlAudioActive && NativeAudioBridge) {
      NativeAudioBridge.setVolume({ volume: this.isMuted ? 0 : this.currentVolume });
    } else if (this.htmlAudio) {
      try {
        this.htmlAudio.volume = this.isMuted ? 0 : this.currentVolume;
      } catch {}
    }
  }

  /**
   * Toggle mute
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;

    if (this.player) {
      try {
        if (this.isMuted) {
          this.player.mute();
        } else {
          this.player.unMute();
          this.player.setVolume(Math.round(this.currentVolume * 100));
        }
      } catch {}
    }

    if (this.useNativeAudio && this.isHtmlAudioActive && NativeAudioBridge) {
      NativeAudioBridge.setVolume({ volume: this.isMuted ? 0 : this.currentVolume });
    } else if (this.htmlAudio) {
      try {
        this.htmlAudio.volume = this.isMuted ? 0 : this.currentVolume;
      } catch {}
    }

    return this.isMuted;
  }

  /**
   * Retrieve active playback time in seconds
   */
  public getCurrentTime(): number {
    if (this.player && typeof this.player.getCurrentTime === 'function' && this.isYouTubePlaying) {
      try {
        const t = this.player.getCurrentTime();
        if (typeof t === 'number' && !isNaN(t)) {
          this.currentTime = t;
          return t;
        }
      } catch {}
    }

    if (this.htmlAudio && this.isHtmlAudioActive) {
      return this.htmlAudio.currentTime || this.currentTime;
    }

    return this.currentTime;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function' && this.isYouTubePlaying) {
      try {
        const d = this.player.getDuration();
        if (typeof d === 'number' && d > 0) {
          this.currentTrackDuration = d;
          return d;
        }
      } catch {}
    }

    if (this.htmlAudio && this.isHtmlAudioActive && this.htmlAudio.duration > 0) {
      return this.htmlAudio.duration;
    }

    return this.currentTrackDuration;
  }

  public getTrackId(): string {
    return this.trackId;
  }

  public formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * High-frequency polling to synchronize progress bar & lyrics
   */
  private startPolling() {
    this.stopPolling();
    this.pollIntervalId = window.setInterval(async () => {
      if (!this.isPlaying) return;
      if (this.useNativeAudio && this.isHtmlAudioActive && NativeAudioBridge) {
        try {
          const res = await NativeAudioBridge.getCurrentTime();
          if (res && typeof res.timeMs === 'number') {
            this.currentTime = res.timeMs / 1000;
            if (this.onTimeUpdateCallback) {
              this.onTimeUpdateCallback(this.currentTime);
            }
          }
        } catch {}
      } else if (this.player && typeof this.player.getCurrentTime === 'function') {
        try {
          const t = this.player.getCurrentTime();
          const d = this.player.getDuration();
          if (typeof t === 'number' && !isNaN(t)) {
            this.currentTime = t;
            if (typeof d === 'number' && d > 0) {
              this.currentTrackDuration = d;
            }
            if (this.onTimeUpdateCallback) {
              this.onTimeUpdateCallback(t);
            }
          }
        } catch {}
      }
    }, 250);
  }

  private stopPolling() {
    if (this.pollIntervalId !== null) {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  /**
   * Smooth progression timer for fallback playback
   */
  private startFallbackTimer() {
    this.stopFallbackTimer();
    const interval = 250;
    this.fallbackTimerId = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.currentTime += interval / 1000;
      if (this.currentTime >= this.currentTrackDuration) {
        this.stopFallbackTimer();
        this.stopHarmonicSynth();
        this.isPlaying = false;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      } else if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.currentTime);
      }
    }, interval);
  }

  private stopFallbackTimer() {
    if (this.fallbackTimerId !== null) {
      window.clearInterval(this.fallbackTimerId);
      this.fallbackTimerId = null;
    }
  }
}

export const audioEngine = new AudioEngine();
