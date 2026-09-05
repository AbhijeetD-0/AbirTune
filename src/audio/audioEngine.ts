import { Capacitor } from '@capacitor/core';
import { Media, MediaObject } from '@awesome-cordova-plugins/media';

export interface TrackMetadata {
  title?: string;
  artist?: string;
  genre?: string;
  moodCategory?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

class AudioEngine {
  private player: any = null;
  private isApiReady: boolean = false;
  private isPlayerReady: boolean = false;
  private isYouTubePlaying: boolean = false;
  private isPlaying: boolean = false;
  private isUserPaused: boolean = false;
  private currentVolume: number = 1.0;
  private isMuted: boolean = false;

  private nativeMedia: MediaObject | null = null;
  private isNativeMediaActive: boolean = false;

  private pollIntervalId: number | null = null;
  private fallbackTimerId: number | null = null;
  private currentTrackDuration: number = 210;
  private currentTime: number = 0;
  private trackId: string = '';

  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onBufferingCallback: ((isBuffering: boolean) => void) | null = null;

  constructor() {
    this.initYouTubeAPI();
    this.initHtmlAudio();
  }

  public setCallbacks(
    onTimeUpdate: (time: number) => void,
    onEnded: () => void,
    onBuffering?: (isBuffering: boolean) => void,
    onError?: (err: any) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
    if (onBuffering) this.onBufferingCallback = onBuffering;
  }

  public initSilentCarrierAudio() {
    // Restored empty binder for background playback hook
  }

  public unlockAudio() {
    // Kept to not break UI signature
  }

  private initHtmlAudio() {
    // Kept to not break constructor, replaced internal logic for native
  }

  private initYouTubeAPI() {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      this.isApiReady = true;
      this.initYouTubePlayer();
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      this.isApiReady = true;
      this.initYouTubePlayer();
    };
    if (!document.getElementById('youtube-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }

  private initYouTubePlayer() {
    if (!this.isApiReady || this.player || typeof document === 'undefined') return;
    let container = document.getElementById('youtube-player-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-player-container';
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }
    const inner = document.createElement('div');
    inner.id = 'youtube-player-inner';
    container.appendChild(inner);

    try {
      this.player = new window.YT.Player('youtube-player-inner', {
        height: '10',
        width: '10',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            this.isPlayerReady = true;
            try { this.player.setVolume(Math.round(this.currentVolume * 100)); } catch (e) {}
          },
          onStateChange: (event: any) => {
            const YTState = window.YT.PlayerState;
            if (event.data === YTState.PLAYING) {
              this.isYouTubePlaying = true;
              this.isPlaying = true;
              if (this.onBufferingCallback) this.onBufferingCallback(false);
              this.startPolling();
              try {
                const d = this.player.getDuration();
                if (d > 0) this.currentTrackDuration = d;
              } catch (e) {}
            } else if (event.data === YTState.BUFFERING) {
              if (this.onBufferingCallback) this.onBufferingCallback(true);
            } else if (event.data === YTState.ENDED) {
              this.isYouTubePlaying = false;
              this.isPlaying = false;
              if (this.onEndedCallback) this.onEndedCallback();
            } else if (event.data === YTState.PAUSED) {
              this.isYouTubePlaying = false;
              if (this.isUserPaused) {
                if (!this.isNativeMediaActive) {
                  this.isPlaying = false;
                  this.stopPolling();
                }
              } else if (this.isPlaying) {
                try { this.player.playVideo(); } catch (e) {}
              }
            }
          },
          onError: () => {
             this.startFallbackTimer();
          }
        }
      });
    } catch (e) {
      console.warn('YT Player init error:', e);
    }
  }

  public playTrack(
    trackId: string,
    duration: number,
    bpm: number,
    resumeFrom: number = 0,
    streamUrl?: string,
    metadata?: TrackMetadata
  ) {
    this.play(trackId, metadata, streamUrl, resumeFrom);
  }

  private play(
    trackId: string,
    metadata?: TrackMetadata,
    streamUrl?: string,
    resumeFrom: number = 0
  ) {
    this.unlockAudio();
    this.isUserPaused = false;
    this.isPlaying = true;
    this.trackId = trackId;
    this.currentTime = resumeFrom;

    if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        this.nativeMedia.release();
      } catch (e) {}
      this.nativeMedia = null;
      this.isNativeMediaActive = false;
    }

    if (this.player && this.isYouTubePlaying) {
      try { this.player.stopVideo(); } catch (e) {}
      this.isYouTubePlaying = false;
    }

    if (streamUrl && streamUrl.startsWith('http')) {
      this.playNativeAudio(streamUrl, resumeFrom);
      return;
    }

    if (this.isPlayerReady && this.player && typeof this.player.loadVideoById === 'function') {
      try {
        if (this.onBufferingCallback) this.onBufferingCallback(true);
        this.player.loadVideoById({ videoId: trackId, startSeconds: resumeFrom });
        this.player.setVolume(this.isMuted ? 0 : Math.round(this.currentVolume * 100));
        this.startPolling();
      } catch (err) {
        this.startFallbackTimer();
      }
    } else {
      this.startFallbackTimer();
    }
  }

  private playNativeAudio(url: string, startFrom: number = 0) {
    try {
      this.isNativeMediaActive = true;
      this.nativeMedia = Media.create(url);
      
      // Wire the native media onStatusUpdate to React via existing state vars
      this.nativeMedia.onStatusUpdate.subscribe((status) => {
        // Media.MEDIA_STOPPED = 4
        if (status === 4 && this.isNativeMediaActive) {
          this.isPlaying = false;
          this.isNativeMediaActive = false;
          if (this.onEndedCallback) this.onEndedCallback();
        }
      });
      
      this.nativeMedia.onError.subscribe((err) => {
        console.warn('Native Media error', err);
        this.isNativeMediaActive = false;
        this.startFallbackTimer();
      });

      this.nativeMedia.play();
      this.nativeMedia.setVolume(this.isMuted ? 0 : this.currentVolume);
      
      if (startFrom > 0) {
        this.nativeMedia.seekTo(startFrom * 1000);
      }
      this.startPolling();
    } catch (err) {
      console.warn('Native Media setup error:', err);
      this.isNativeMediaActive = false;
      this.startFallbackTimer();
    }
  }

  public pause() {
    this.isUserPaused = true;
    this.isPlaying = false;
    this.stopPolling();
    this.stopFallbackTimer();

    if (this.player && typeof this.player.pauseVideo === 'function') {
      try { this.player.pauseVideo(); } catch (e) {}
    }

    if (this.nativeMedia && this.isNativeMediaActive) {
      try { this.nativeMedia.pause(); } catch (e) {}
    }
  }

  public resume() {
    this.unlockAudio();
    this.isUserPaused = false;
    this.isPlaying = true;

    if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        this.nativeMedia.play();
        this.startPolling();
        return;
      } catch (e) {}
    }

    if (this.player && typeof this.player.playVideo === 'function') {
      try {
        this.player.playVideo();
        this.startPolling();
        return;
      } catch (e) {}
    }

    this.startFallbackTimer();
  }

  public seek(seconds: number) {
    if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        const d = this.nativeMedia.getDuration();
        if (d > 0) this.currentTrackDuration = d;
      } catch (e) {}
    } else if (this.player && typeof this.player.getDuration === 'function' && this.isYouTubePlaying) {
      try {
        const d = this.player.getDuration();
        if (typeof d === 'number' && d > 0) this.currentTrackDuration = d;
      } catch (e) {}
    }

    this.currentTime = Math.max(0, Math.min(seconds, this.currentTrackDuration - 2));

    if (this.player && typeof this.player.seekTo === 'function') {
      try { this.player.seekTo(this.currentTime, true); } catch (e) {}
    }

    if (this.nativeMedia && this.isNativeMediaActive) {
      try { this.nativeMedia.seekTo(this.currentTime * 1000); } catch (e) {}
    }

    if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(this.currentTime);
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.player && typeof this.player.setVolume === 'function') {
      try { this.player.setVolume(Math.round(this.currentVolume * 100)); } catch (e) {}
    }
    if (this.nativeMedia) {
      try { this.nativeMedia.setVolume(this.isMuted ? 0 : this.currentVolume); } catch (e) {}
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.player) {
      try {
        if (this.isMuted) this.player.mute();
        else {
          this.player.unMute();
          this.player.setVolume(Math.round(this.currentVolume * 100));
        }
      } catch (e) {}
    }
    if (this.nativeMedia) {
      try { this.nativeMedia.setVolume(this.isMuted ? 0 : this.currentVolume); } catch (e) {}
    }
    return this.isMuted;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getDuration(): number {
    if (this.player && typeof this.player.getDuration === 'function' && this.isYouTubePlaying) {
      try {
        const d = this.player.getDuration();
        if (typeof d === 'number' && d > 0) return d;
      } catch (e) {}
    }
    if (this.nativeMedia && this.isNativeMediaActive) {
      try {
        const d = this.nativeMedia.getDuration();
        if (d > 0 && !isNaN(d)) return d;
      } catch (e) {}
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

  private startPolling() {
    this.stopPolling();
    this.pollIntervalId = window.setInterval(async () => {
      if (!this.isPlaying) return;
      if (this.nativeMedia && this.isNativeMediaActive) {
        try {
          // getCurrentPosition() is asynchronous in Cordova Media
          const res = await this.nativeMedia.getCurrentPosition();
          if (typeof res === 'number' && res >= 0) {
            this.currentTime = res;
            if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(this.currentTime);
          }
          const d = this.nativeMedia.getDuration();
          if (d > 0 && !isNaN(d)) this.currentTrackDuration = d;
        } catch (e) {}
      } else if (this.player && typeof this.player.getCurrentTime === 'function') {
        try {
          const t = this.player.getCurrentTime();
          const d = this.player.getDuration();
          if (typeof t === 'number' && !isNaN(t)) {
            this.currentTime = t;
            if (typeof d === 'number' && d > 0) this.currentTrackDuration = d;
            if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(t);
          }
        } catch (e) {}
      }
    }, 250);
  }

  private stopPolling() {
    if (this.pollIntervalId !== null) {
      window.clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  private startFallbackTimer() {
    this.stopFallbackTimer();
    const interval = 250;
    this.fallbackTimerId = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.currentTime += interval / 1000;
      if (this.currentTime >= this.currentTrackDuration) {
        this.stopFallbackTimer();
        this.isPlaying = false;
        if (this.onEndedCallback) this.onEndedCallback();
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
