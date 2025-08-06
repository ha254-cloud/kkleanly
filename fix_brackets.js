const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'app', '(tabs)', 'order.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix missing closing brackets in style arrays with a more direct approach
content = content.replace(/style={\[asArrayTextStyle\(\[styles\.\w+, {[^}]+}\]\)}/g, (match) => {
  return match.replace(/\]\)}/g, '])]}>');
});

content = content.replace(/style={\[asArrayViewStyle\(\[styles\.\w+, {[^}]+}\]\)}/g, (match) => {
  return match.replace(/\]\)}/g, '])]}>');
});

// Special fix for the input style that needs a closing bracket
content = content.replace(/style={\[asArrayTextStyle\(\[styles\.input, {[^\]]+\]}/g, 
  'style={[asArrayTextStyle([styles.input, { backgroundColor: colors.background, color: colors.text })]}');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Bracket fixes applied successfully to order.tsx');
