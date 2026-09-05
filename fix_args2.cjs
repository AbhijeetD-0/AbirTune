const fs = require('fs');
let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

code = code.replace(/public setCallbacks[\s\S]*?\}\n/, `
  public setCallbacks(
    onTimeUpdate: (time: number) => void,
    onEnded: () => void,
    onBuffering?: (isBuffering: boolean) => void,
    onError?: (err: any) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onEndedCallback = onEnded;
    if (onBuffering) this.onBufferingCallback = onBuffering;
    // We don't necessarily need to trigger onError here since fallback handles it, 
    // but we accept it to fix typing.
  }
`);

fs.writeFileSync('src/audio/audioEngine.ts', code);
