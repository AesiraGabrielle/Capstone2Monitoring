/*
  Remove sourceMappingURL comments from react-datepicker dist files to silence
  noisy source-map-loader warnings in CRA dev server.
*/
const fs = require('fs');
const path = require('path');

const pkgRoot = process.cwd();
const targetDir = path.join(pkgRoot, 'node_modules', 'react-datepicker', 'dist');

function stripSourceMapComments(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const before = content;
    // Remove lines like //# sourceMappingURL=...
    content = content.replace(/\n\s*\/\/[#@]\s*sourceMappingURL=.*$/gm, '\n');
    if (content !== before) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patched] ${path.relative(pkgRoot, filePath)}`);
    } else {
      console.log(`[unchanged] ${path.relative(pkgRoot, filePath)} (no sourceMappingURL found)`);
    }
  } catch (e) {
    console.warn(`[skip] ${filePath}: ${e.message}`);
  }
}

if (fs.existsSync(targetDir)) {
  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith('.js'));
  files.forEach((f) => stripSourceMapComments(path.join(targetDir, f)));
} else {
  console.warn('react-datepicker dist folder not found. Did you run npm install?');
}
