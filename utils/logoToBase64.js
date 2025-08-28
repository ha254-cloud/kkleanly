/**
 * Convert Kleanly logo to base64 for email embedding
 * Run this utility to generate the base64 string for your logo
 */

const fs = require('fs');
const path = require('path');

const convertLogoToBase64 = () => {
  try {
    // Path to your logo file
    const logoPath = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
    
    // Check if file exists
    if (!fs.existsSync(logoPath)) {
      console.log('❌ Logo file not found at:', logoPath);
      console.log('📁 Available files:');
      const imagesDir = path.join(__dirname, '..', 'assets', 'images');
      const files = fs.readdirSync(imagesDir);
      files.forEach(file => console.log(`   - ${file}`));
      return;
    }
    
    // Read the file
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Convert to base64
    const base64String = logoBuffer.toString('base64');
    
    // Create data URI for different file types
    const extension = path.extname(logoPath).toLowerCase();
    let mimeType = 'image/png';
    
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.svg':
        mimeType = 'image/svg+xml';
        break;
      case '.gif':
        mimeType = 'image/gif';
        break;
      default:
        mimeType = 'image/png';
    }
    
    const dataUri = `data:${mimeType};base64,${base64String}`;
    
    console.log('✅ Logo converted to base64 successfully!');
    console.log('📊 File info:');
    console.log(`   - File: ${path.basename(logoPath)}`);
    console.log(`   - Size: ${Math.round(logoBuffer.length / 1024)}KB`);
    console.log(`   - MIME: ${mimeType}`);
    console.log(`   - Base64 length: ${base64String.length} characters`);
    
    console.log('\n📋 Copy this data URI to use in your email template:');
    console.log('═'.repeat(80));
    console.log(dataUri);
    console.log('═'.repeat(80));
    
    // Save to file for easy copying
    const outputPath = path.join(__dirname, 'kleanly-logo-base64.txt');
    fs.writeFileSync(outputPath, dataUri);
    console.log(`\n💾 Also saved to: ${outputPath}`);
    
    // Generate the updated function code
    console.log('\n🔧 Updated function for professionalEmailService.ts:');
    console.log('─'.repeat(60));
    console.log(`const getKleanlyLogoBase64 = (): string => {
  return '${dataUri}';
};`);
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error converting logo:', error.message);
  }
};

// Run the conversion
convertLogoToBase64();
