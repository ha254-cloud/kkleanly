const path = require('path');
const axios = require('axios');
const moment = require('moment');

// Test receipt generation
const generateTestReceipt = async () => {
  try {
    console.log('🧪 Testing receipt generation...');
    
    // Sample order data
    const testOrderData = {
      id: 'ORDER_' + Date.now(),
      receiptNumber: 'RCP-' + Date.now(),
      status: 'Completed',
      customerName: 'John Doe',
      customerPhone: '+1 (555) 123-4567',
      customerEmail: 'john.doe@example.com',
      pickupAddress: '123 Main Street, Apt 4B, New York, NY 10001',
      deliveryAddress: '123 Main Street, Apt 4B, New York, NY 10001',
      createdAt: new Date(),
      pickupDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      paymentMethod: 'Credit Card',
      paymentStatus: 'Paid',
      transactionId: 'TXN_' + Date.now(),
      items: [
        {
          name: 'Wash & Fold',
          description: 'Regular laundry service with premium detergent',
          quantity: 2,
          price: 15.99,
          specialInstructions: 'Use fabric softener'
        },
        {
          name: 'Dry Cleaning',
          description: 'Professional dry cleaning for delicate items',
          quantity: 1,
          price: 8.50
        },
        {
          name: 'Shirt Pressing',
          description: 'Professional pressing and folding',
          quantity: 3,
          price: 3.25
        }
      ],
      discount: 5.00,
      tip: 3.00
    };

    const requestData = {
      orderData: testOrderData,
      userId: 'test_user_123'
    };

    console.log('📝 Order data prepared:', {
      orderId: testOrderData.id,
      itemCount: testOrderData.items.length,
      customer: testOrderData.customerName
    });

    // Make request to receipt service
    const response = await axios.post('http://localhost:3001/generate-receipt', requestData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('✅ Receipt generated successfully!');
      console.log('📄 Receipt URL:', response.data.receiptUrl);
      console.log('📁 File name:', response.data.fileName);
      console.log('💾 Message:', response.data.message);
      
      // Test health endpoint
      const healthResponse = await axios.get('http://localhost:3001/health');
      console.log('🏥 Health check:', healthResponse.data);
      
      return {
        success: true,
        receiptUrl: response.data.receiptUrl,
        fileName: response.data.fileName,
        healthCheck: healthResponse.data
      };
    } else {
      console.log('❌ Receipt generation failed:', response.data.error);
      return { success: false, error: response.data.error };
    }

  } catch (error) {
    console.error('🚨 Error testing receipt generation:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the receipt service is running on port 3001');
      console.log('   Run: npm start in the backend directory');
    }
    
    return { success: false, error: error.message };
  }
};

// Run test if called directly
if (require.main === module) {
  generateTestReceipt()
    .then(result => {
      console.log('\n📊 Test Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = generateTestReceipt;
