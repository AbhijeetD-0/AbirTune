const fs = require('fs');
let code = fs.readFileSync('src/audio/audioEngine.ts', 'utf8');

let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('try {')) {
    // Find the matching closing brace
    let braceCount = 0;
    let foundStart = false;
    for (let j = i; j < lines.length; j++) {
      for (let k = 0; k < lines[j].length; k++) {
        if (lines[j][k] === '{') {
          braceCount++;
          foundStart = true;
        } else if (lines[j][k] === '}') {
          braceCount--;
        }
      }
      if (foundStart && braceCount === 0) {
        // check if next line or this line has catch
        let combined = lines.slice(j, j+3).join(' ');
        if (!combined.includes('catch')) {
           // Insert catch
           lines[j] = lines[j] + ' catch (e) {}';
        }
        break;
      }
    }
  }
}

fs.writeFileSync('src/audio/audioEngine.ts', lines.join('\n'));
