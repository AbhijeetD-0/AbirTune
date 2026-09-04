const fs = require('fs');
const path = require('path');

const jsPath = path.resolve(__dirname, '../node_modules/capacitor-music-controls-plugin/dist/esm/index.js');
if (fs.existsSync(jsPath)) {
  let content = fs.readFileSync(jsPath, 'utf8');
  if (!content.includes('MusicControls')) {
    content = content.replace(
      'export { CapacitorMusicControls };',
      `const MusicControls = Object.assign(CapacitorMusicControls, {
    subscribe: (callback) => {
        if (CapacitorMusicControls && typeof CapacitorMusicControls.addListener === 'function') {
            CapacitorMusicControls.addListener('controlsNotification', (info) => {
                const action = typeof info === 'string' ? info : (info?.message || info?.action || info);
                callback(action);
            });
        }
        if (typeof document !== 'undefined') {
            document.addEventListener('controlsNotification', (event) => {
                const action = event?.detail?.message || event?.message || event?.action || event;
                callback(action);
            });
        }
    }
});
export { CapacitorMusicControls, MusicControls };`
    );
    fs.writeFileSync(jsPath, content, 'utf8');
  }
}

const dtsPath = path.resolve(__dirname, '../node_modules/capacitor-music-controls-plugin/dist/esm/index.d.ts');
if (fs.existsSync(dtsPath)) {
  let content = fs.readFileSync(dtsPath, 'utf8');
  if (!content.includes('MusicControls')) {
    content = content.replace(
      'export { CapacitorMusicControls };',
      `declare const MusicControls: CapacitorMusicControlsPlugin & {
    subscribe: (callback: (action: any) => void) => void;
};
export { CapacitorMusicControls, MusicControls };`
    );
    fs.writeFileSync(dtsPath, content, 'utf8');
  }
}
