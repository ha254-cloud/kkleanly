/**
 * Logo Converter Utility
 * Converts Kleanly logo to base64 for email embedding
 */

const fs = require('fs');
const path = require('path');

function convertLogoToBase64() {
  console.log('🎨 Kleanly Logo Converter Starting...\n');
  
  try {
    // Try to find the logo file
    const logoPath = path.join(__dirname, '..', 'assets', 'images', 'icon.png');
    const faviconPath = path.join(__dirname, '..', 'assets', 'images', 'favicon.png');
    
    let targetPath = '';
    let logoType = '';
    
    if (fs.existsSync(logoPath)) {
      targetPath = logoPath;
      logoType = 'icon.png';
    } else if (fs.existsSync(faviconPath)) {
      targetPath = faviconPath;
      logoType = 'favicon.png';
    } else {
      console.log('❌ No logo file found in assets/images/');
      console.log('Looking for: icon.png or favicon.png');
      return;
    }
    
    console.log(`📁 Found logo: ${logoType}`);
    console.log(`📍 Path: ${targetPath}`);
    
    // Read the logo file
    const logoBuffer = fs.readFileSync(targetPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoDataUri = `data:image/png;base64,${logoBase64}`;
    
    console.log(`✅ Logo converted to base64`);
    console.log(`📏 Size: ${(logoBase64.length / 1024).toFixed(2)} KB`);
    console.log(`🔗 Data URI length: ${logoDataUri.length} characters\n`);
    
    // Output the base64 for use in email template
    console.log('📧 BASE64 FOR EMAIL TEMPLATE:');
    console.log('================================');
    console.log(logoDataUri);
    console.log('================================\n');
    
    // Save to a file for easy copying
    const outputPath = path.join(__dirname, 'kleanly-logo-base64.txt');
    fs.writeFileSync(outputPath, logoDataUri);
    console.log(`💾 Base64 saved to: ${outputPath}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Copy the base64 string above');
    console.log('2. Replace the placeholder in professionalEmailService.ts');
    console.log('3. Your logo will appear in password reset emails!\n');
    
  } catch (error) {
    console.error('❌ Error converting logo:', error.message);
  }
}

// Run the converter
convertLogoToBase64();
