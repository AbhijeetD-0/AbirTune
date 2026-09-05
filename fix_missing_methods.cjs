const fs = require('fs');
let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

code = code.replace("public unlockAudio() {", `
  public initSilentCarrierAudio() {}
  public unlockAudio() {`);

fs.writeFileSync('src/audio/audioEngine.ts', code);
