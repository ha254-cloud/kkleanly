const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'app', '(tabs)', 'order.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix incorrect text style assertions
content = content.replace(/asViewStyle\(styles\.(\w+)\)}/g, 'asTextStyle(styles.$1)}');
content = content.replace(/\[asViewStyle\(styles\.(\w+)\), /g, '[asTextStyle(styles.$1), ');

// Fix the service item styles
content = content.replace(/styles\.serviceItem/g, 'asViewStyle(styles.serviceItem)');
content = content.replace(/styles\.serviceItemSelected/g, 'asViewStyle(styles.serviceItemSelected)');

// Fix inCartText 
content = content.replace(/style={asViewStyle\(styles\.inCartText\)}/g, 'style={asTextStyle(styles.inCartText)}');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Additional style fixes applied successfully to order.tsx');
