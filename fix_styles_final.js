const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'app', '(tabs)', 'order.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix missing closing brackets in asArrayTextStyle
content = content.replace(/\[asArrayTextStyle\(\[styles\.(\w+), ([^\]]+)\]\)>/g, '[asArrayTextStyle([styles.$1, $2])]>');
content = content.replace(/\[asArrayViewStyle\(\[styles\.(\w+), ([^\]]+)\]\)>/g, '[asArrayViewStyle([styles.$1, $2])]>');

// Fix additional View styles that were incorrectly set to TextStyle
const viewStyleProps = [
  'deliverySection', 'deliveryCard', 'inputGroup', 'inputIconContainer', 
  'checkoutSection', 'checkoutGradient', 'checkoutButton'
];

viewStyleProps.forEach(prop => {
  // Fix simple style={asTextStyle(styles.X)}
  content = content.replace(new RegExp(`asTextStyle\\(styles\\.${prop}\\)`, 'g'), `asViewStyle(styles.${prop})`);
  
  // Fix array style=[asArrayTextStyle([styles.X, ...
  content = content.replace(new RegExp(`asArrayTextStyle\\(\\[styles\\.${prop},`, 'g'), `asArrayViewStyle([styles.${prop},`);
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Final style fixes applied successfully to order.tsx');
