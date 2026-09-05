const fs = require('fs');

let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

// Imports
code = code.replace(
  "import { Capacitor, registerPlugin } from '@capacitor/core';",
  "import { Capacitor } from '@capacitor/core';\nimport { Media, MediaObject } from '@awesome-cordova-plugins/media';"
);

// Remove NativeAudioBridge
code = code.replace("const NativeAudioBridge = registerPlugin<any>('NativeAudioBridge');\n", "");

// Properties
code = code.replace(
  "private htmlAudio: HTMLAudioElement | null = null;",
  "private nativeMedia: MediaObject | null = null;"
);
code = code.replace(
  "private isHtmlAudioActive: boolean = false;",
  "private isNativeMediaActive: boolean = false;"
);
code = code.replace(
  "private useNativeAudio: boolean = false;",
  ""
);

// initHtmlAudio
code = code.replace(
  /private initHtmlAudio\(\) \{[\s\S]*?\} \/\/\s*End of initHtmlAudio\s*\}/m,
  "// Removed HTMLAudio in favor of Cordova Media"
);
// Actually it's just `private initHtmlAudio() { ... }`
// I'll use regex to match initHtmlAudio entirely.
// Let's manually replace the big chunks.
