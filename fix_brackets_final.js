const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'app', '(tabs)', 'order.tsx');
console.log(`Reading file: ${filePath}`);

try {
  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`File read successfully. Length: ${content.length} characters`);
  
  // Find occurrences of the issue
  const textStyleMatches = content.match(/style={\[asArrayTextStyle\(\[([^}]+)\}\]>/g) || [];
  console.log(`Found ${textStyleMatches.length} text style issues`);
  
  const viewStyleMatches = content.match(/style={\[asArrayViewStyle\(\[([^}]+)\}\]>/g) || [];
  console.log(`Found ${viewStyleMatches.length} view style issues`);

  // Fix the bracket syntax for array text styles
  content = content.replace(/style={\[asArrayTextStyle\(\[([^\]]+)\]\)}/g, 'style={asArrayTextStyle([$1])}');
  
  // Fix the bracket syntax for array view styles
  content = content.replace(/style={\[asArrayViewStyle\(\[([^\]]+)\]\)}/g, 'style={asArrayViewStyle([$1])}');
  
  // Write the file back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('All bracket syntax issues fixed successfully!');
} catch (error) {
  console.error(`Error processing file: ${error.message}`);
}
