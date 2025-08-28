const express = require('express');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:8081', 'exp://localhost:8081', 'https://kleanly.app'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);

// Template engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

// Utility functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (date) => {
  return moment(date).format('MMMM DD, YYYY');
};

const formatTime = (date) => {
  return moment(date).format('h:mm A');
};

// Generate receipt PDF
const generateReceiptPDF = async (orderData) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = parseFloat(process.env.TAX_RATE) || 0.08;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Prepare template data
    const templateData = {
      ...orderData,
      subtotal: formatCurrency(subtotal),
      taxAmount: formatCurrency(taxAmount),
      taxRate: (taxRate * 100).toFixed(1),
      total: formatCurrency(total),
      date: formatDate(orderData.createdAt),
      time: formatTime(orderData.createdAt),
      receiptNumber: orderData.receiptNumber || `RCP-${orderData.id}`,
      companyName: process.env.COMPANY_NAME,
      companyAddress: process.env.COMPANY_ADDRESS,
      companyPhone: process.env.COMPANY_PHONE,
      companyEmail: process.env.COMPANY_EMAIL,
      companyWebsite: process.env.COMPANY_WEBSITE,
      taxNumber: process.env.TAX_NUMBER,
      gstNumber: process.env.GST_NUMBER,
      formatCurrency,
      formatDate,
      formatTime
    };

    // Render HTML from template
    const templatePath = path.join(__dirname, 'templates', 'receipt.ejs');
    const html = await ejs.renderFile(templatePath, templateData);

    // Set page content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

// Upload PDF to Google Cloud Storage
const uploadPDFToStorage = async (pdfBuffer, fileName) => {
  const file = bucket.file(fileName);
  
  await file.save(pdfBuffer, {
    metadata: {
      contentType: 'application/pdf',
      cacheControl: 'public, max-age=31536000'
    }
  });

  // Generate signed URL (valid for 1 year)
  const options = {
    version: 'v4',
    action: 'read',
    expires: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
  };

  const [signedUrl] = await file.getSignedUrl(options);
  return signedUrl;
};

// Main receipt generation endpoint
app.post('/generate-receipt', async (req, res) => {
  try {
    const { orderData, userId } = req.body;

    if (!orderData || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Order data and user ID are required'
      });
    }

    // Validate order data structure
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one item'
      });
    }

    // Generate unique file name
    const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
    const fileName = `receipts/${userId}/${orderData.id || uuidv4()}-${timestamp}.pdf`;

    // Generate PDF
    console.log('Generating PDF for order:', orderData.id);
    const pdfBuffer = await generateReceiptPDF(orderData);

    // Upload to storage
    console.log('Uploading PDF to storage:', fileName);
    const downloadUrl = await uploadPDFToStorage(pdfBuffer, fileName);

    // Update Firestore with receipt URL
    if (orderData.id) {
      const db = admin.firestore();
      await db.collection('orders').doc(orderData.id).update({
        receiptUrl: downloadUrl,
        receiptGenerated: true,
        receiptGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({
      success: true,
      receiptUrl: downloadUrl,
      fileName,
      message: 'Receipt generated successfully'
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate receipt',
      details: error.message
    });
  }
});

// Get receipt by order ID
app.get('/receipt/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const db = admin.firestore();
    const orderDoc = await db.collection('orders').doc(orderId).get();
    
    if (!orderDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    const orderData = orderDoc.data();
    
    if (!orderData.receiptUrl) {
      return res.status(404).json({
        success: false,
        error: 'Receipt not generated for this order'
      });
    }

    res.json({
      success: true,
      receiptUrl: orderData.receiptUrl,
      receiptGenerated: orderData.receiptGenerated || false,
      receiptGeneratedAt: orderData.receiptGeneratedAt
    });

  } catch (error) {
    console.error('Error getting receipt:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get receipt',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Kleanly Receipt Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Kleanly Receipt Service running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

module.exports = app;
