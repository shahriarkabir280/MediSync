import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getBillingRecords,
  createBillingRecord,
  updateBillingRecord,
  markAsPaid,
  getBillingSummary
} from '../controllers/billingController.js';
import { sql } from '../config/db.js';

const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'careconnect_jwt_secret_2024';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.doctorId = decoded.doctorId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Billing routes
router.get('/doctor/:doctorId', getBillingRecords);
router.get('/doctor/:doctorId/summary', getBillingSummary);
router.post('/doctor/:doctorId', createBillingRecord);
router.put('/:billingId', updateBillingRecord);
router.patch('/:billingId/mark-paid', markAsPaid);

// Billing settings routes
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    
    const settings = await sql`
      SELECT billing_settings FROM doctor_settings WHERE doctor_id = ${doctorId}
    `;

    const billingSettings = settings.length > 0 && settings[0].billing_settings 
      ? settings[0].billing_settings 
      : {
          defaultPaymentMethod: '',
          autoPayEnabled: false,
          invoiceEmail: '',
          taxId: '',
          billingAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          },
          paymentMethods: []
        };

    res.json(billingSettings);
  } catch (error) {
    console.error('Get billing settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const billingSettings = req.body;

    // Upsert billing settings
    await sql`
      INSERT INTO doctor_settings (doctor_id, billing_settings, updated_at)
      VALUES (${doctorId}, ${JSON.stringify(billingSettings)}, CURRENT_TIMESTAMP)
      ON CONFLICT (doctor_id) 
      DO UPDATE SET 
        billing_settings = ${JSON.stringify(billingSettings)},
        updated_at = CURRENT_TIMESTAMP
    `;

    res.json({
      success: true,
      message: 'Billing settings updated successfully'
    });
  } catch (error) {
    console.error('Update billing settings error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Payment methods routes
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    
    // In a real implementation, this would integrate with a payment processor like Stripe
    const paymentMethods = await sql`
      SELECT payment_methods FROM doctor_settings WHERE doctor_id = ${doctorId}
    `;

    const methods = paymentMethods.length > 0 && paymentMethods[0].payment_methods 
      ? paymentMethods[0].payment_methods 
      : [];

    res.json(methods);
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { type, last4, expiry, isDefault } = req.body;

    // In a real implementation, this would integrate with a payment processor
    const newMethod = {
      id: Date.now().toString(),
      type,
      last4,
      expiry,
      isDefault: isDefault || false,
      createdAt: new Date().toISOString()
    };

    // Get current payment methods
    const currentSettings = await sql`
      SELECT payment_methods FROM doctor_settings WHERE doctor_id = ${doctorId}
    `;

    let paymentMethods = currentSettings.length > 0 && currentSettings[0].payment_methods 
      ? currentSettings[0].payment_methods 
      : [];

    // If this is the default, make others non-default
    if (newMethod.isDefault) {
      paymentMethods = paymentMethods.map(method => ({ ...method, isDefault: false }));
    }

    paymentMethods.push(newMethod);

    // Update in database
    await sql`
      INSERT INTO doctor_settings (doctor_id, payment_methods, updated_at)
      VALUES (${doctorId}, ${JSON.stringify(paymentMethods)}, CURRENT_TIMESTAMP)
      ON CONFLICT (doctor_id) 
      DO UPDATE SET 
        payment_methods = ${JSON.stringify(paymentMethods)},
        updated_at = CURRENT_TIMESTAMP
    `;

    res.json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethod: newMethod
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/payment-methods/:methodId', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;
    const { methodId } = req.params;

    // Get current payment methods
    const currentSettings = await sql`
      SELECT payment_methods FROM doctor_settings WHERE doctor_id = ${doctorId}
    `;

    let paymentMethods = currentSettings.length > 0 && currentSettings[0].payment_methods 
      ? currentSettings[0].payment_methods 
      : [];

    // Remove the specified method
    paymentMethods = paymentMethods.filter(method => method.id !== methodId);

    // Update in database
    await sql`
      UPDATE doctor_settings 
      SET payment_methods = ${JSON.stringify(paymentMethods)}, updated_at = CURRENT_TIMESTAMP
      WHERE doctor_id = ${doctorId}
    `;

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
