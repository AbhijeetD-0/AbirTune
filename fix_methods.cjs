const fs = require('fs');
let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

code = code.replace("public unlockAudio() {}", `
  public unlockAudio() {}

  public setCallbacks(callbacks: { onTimeUpdate?: (t: number) => void, onEnded?: () => void, onBuffering?: (b: boolean) => void }) {
    if (callbacks.onTimeUpdate) this.onTimeUpdateCallback = callbacks.onTimeUpdate;
    if (callbacks.onEnded) this.onEndedCallback = callbacks.onEnded;
    if (callbacks.onBuffering) this.onBufferingCallback = callbacks.onBuffering;
  }

  public playTrack(trackId: string, metadata?: TrackMetadata, streamUrl?: string, resumeFrom: number = 0) {
    this.play(trackId, metadata, streamUrl, resumeFrom);
  }

  public initSilentCarrierAudio() {}
`);

fs.writeFileSync('src/audio/audioEngine.ts', code);
