const fs = require('fs');
let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

code = code.replace(/public setCallbacks[\s\S]*?\}\n/, `
  public setCallbacks(
    onTimeUpdate: (time: number) => void,
    onEnded: () => void,
    onBuffering: (isBuffering: boolean) => void,
    onStart?: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
    this.onBufferingCallback = onBuffering;
  }
`);

code = code.replace(/public playTrack[\s\S]*?\}\n/, `
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
`);

fs.writeFileSync('src/audio/audioEngine.ts', code);
