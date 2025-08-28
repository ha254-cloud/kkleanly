// Test Location Permission Fix
// Run this file to test the enhanced location detection

import { locationService } from './services/locationService';

async function testLocationPermissions() {
  console.log('🧪 TESTING LOCATION PERMISSION FIX');
  console.log('═'.repeat(40));
  
  try {
    // Test 1: Check permission request
    console.log('📍 Testing permission request...');
    const hasPermission = await locationService.requestPermissions();
    console.log(`✅ Permission granted: ${hasPermission}`);
    
    if (hasPermission) {
      // Test 2: Get current location
      console.log('\n📍 Testing location detection...');
      const result = await locationService.getCurrentAddress();
      
      if (result.success) {
        console.log('✅ Location detected successfully!');
        console.log(`📧 Address: ${result.data?.address}`);
        console.log(`📍 Coordinates: ${result.data?.latitude}, ${result.data?.longitude}`);
      } else {
        console.log('❌ Location detection failed:', result.error);
      }
    } else {
      console.log('❌ Permission not granted - user should see helpful dialogs');
    }
    
    console.log('\n🎉 TEST COMPLETED!');
    console.log('═'.repeat(40));
    console.log('📱 Now test the "Detect" button in your app');
    console.log('✅ You should see permission dialogs with helpful messages');
    console.log('✅ Location should be detected automatically after permission granted');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if executed directly
if (require.main === module) {
  testLocationPermissions();
}

export { testLocationPermissions };
