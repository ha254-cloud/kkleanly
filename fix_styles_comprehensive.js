const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'app', '(tabs)', 'order.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix incorrect ViewStyle and TextStyle assertions
// First, fix the serviceItemSelected issues
content = content.replace(/asViewStyle\(styles\.serviceItem\)Selected/g, 'asViewStyle(styles.serviceItemSelected)');
content = content.replace(/asViewStyle\(asViewStyle\(styles\.serviceItem\)Selected\)/g, 'asViewStyle(styles.serviceItemSelected)');

// Fix all text styles misattributed as view styles
content = content.replace(/asTextStyle\(styles\.(\w+)\)/g, (match, styleName) => {
  const viewStyleProps = [
    'container', 'keyboardView', 'scrollContent', 'headerGradient', 'headerContent', 'headerTop', 'titleSection',
    'titleRow', 'orderTypeSection', 'orderTypeContainer', 'orderTypeGradient', 'orderTypeContent', 'popularBadge',
    'selectedBadge', 'categoriesSection', 'categoriesContainer', 'categoriesContent', 'categoryGradient', 
    'selectedIndicator', 'selectedDot', 'servicesSection', 'bagServicesHeader', 'bagServiceContent', 'bagServiceInfo',
    'bagServiceHeader', 'quantityControls', 'quantityButton', 'quantityDisplay', 'inCartBadge', 'serviceContent',
    'serviceInfo', 'cartSection', 'cartGradient', 'cartSummary', 'cartHeader', 'cartIconContainer', 'cartHeaderText',
    'cartItems', 'cartItem', 'cartItemInfo', 'cartTotal'
  ];
  
  if (viewStyleProps.includes(styleName)) {
    return `asViewStyle(styles.${styleName})`;
  }
  
  return match; // Keep as is if not in the list
});

// Fix array styles
content = content.replace(/\[asTextStyle\(styles\.(\w+)\)/g, (match, styleName) => {
  const viewStyleProps = [
    'selectedBadge', 'quantityDisplay', 'inCartBadge', 'cartSummary', 'cartHeader', 'cartIconContainer',
    'cartHeaderText', 'cartBadge', 'cartItem', 'cartTotal'
  ];
  
  if (viewStyleProps.includes(styleName)) {
    return `[asArrayViewStyle([styles.${styleName}`;
  }
  
  return `[asArrayTextStyle([styles.${styleName}`;
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Comprehensive style fixes applied successfully to order.tsx');
