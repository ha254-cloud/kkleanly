const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'app', '(tabs)', 'order.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// View style fixes
content = content.replace(/style={styles\.(\w+)}/g, 'style={asViewStyle(styles.$1)}');
content = content.replace(/style={\[styles\.(\w+), /g, 'style={[asViewStyle(styles.$1), ');

// Text style fixes
content = content.replace(/style={styles\.(\w+)}>([^<]*)<\/Text>/g, 'style={asTextStyle(styles.$1)}>$2</Text>');
content = content.replace(/style={\[styles\.(\w+), (.+?)]}>\s*([^<]*)<\/Text>/g, 'style={asArrayTextStyle([styles.$1, $2])}>$3</Text>');

// Image style fixes
content = content.replace(/style={styles\.(\w+)} source=/g, 'style={asImageStyle(styles.$1)} source=');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Style fixes applied successfully to order.tsx');
