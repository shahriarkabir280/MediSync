import express from 'express';
import { doctorOnly, requireOwnDoctor } from '../middleware/auth.js';
import {
  getBillingRecords,
  createBillingRecord,
  updateBillingRecord,
  markAsPaid,
  getBillingSummary
} from '../controllers/billingController.js';
import { supabase } from '../config/db.js';

const router = express.Router();

// Doctor-only routes
const authenticateToken = doctorOnly;

// Billing routes
router.get('/doctor/:doctorId', authenticateToken, requireOwnDoctor(), getBillingRecords);
router.get('/doctor/:doctorId/summary', authenticateToken, requireOwnDoctor(), getBillingSummary);
router.post('/doctor/:doctorId', authenticateToken, requireOwnDoctor(), createBillingRecord);

// Billing settings routes
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.doctorId;

    const { data: settings } = await supabase
      .from('doctor_settings')
      .select('billing_settings')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    const billingSettings = settings?.billing_settings || {
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
    // Check if exists
    const { data: existing } = await supabase.from('doctor_settings').select('id').eq('doctor_id', doctorId).maybeSingle();

    if (existing) {
      await supabase
        .from('doctor_settings')
        .update({ billing_settings: billingSettings, updated_at: new Date().toISOString() })
        .eq('doctor_id', doctorId);
    } else {
      await supabase
        .from('doctor_settings')
        .insert({
          doctor_id: doctorId,
          billing_settings: billingSettings,
          updated_at: new Date().toISOString()
        });
    }

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

    const { data: settings } = await supabase
      .from('doctor_settings')
      .select('payment_methods')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    const methods = settings?.payment_methods || [];

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
    const { data: settings } = await supabase
      .from('doctor_settings')
      .select('payment_methods')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    let paymentMethods = settings?.payment_methods || [];

    // If this is the default, make others non-default
    if (newMethod.isDefault) {
      paymentMethods = paymentMethods.map(method => ({ ...method, isDefault: false }));
    }

    paymentMethods.push(newMethod);

    // Update in database
    const { data: existing } = await supabase.from('doctor_settings').select('id').eq('doctor_id', doctorId).maybeSingle();

    if (existing) {
      await supabase
        .from('doctor_settings')
        .update({ payment_methods: paymentMethods, updated_at: new Date().toISOString() })
        .eq('doctor_id', doctorId);
    } else {
      await supabase
        .from('doctor_settings')
        .insert({
          doctor_id: doctorId,
          payment_methods: paymentMethods,
          updated_at: new Date().toISOString()
        });
    }

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
    const { data: settings } = await supabase
      .from('doctor_settings')
      .select('payment_methods')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    let paymentMethods = settings?.payment_methods || [];

    // Remove the specified method
    paymentMethods = paymentMethods.filter(method => method.id !== methodId);

    // Update in database
    if (settings) {
      await supabase
        .from('doctor_settings')
        .update({ payment_methods: paymentMethods, updated_at: new Date().toISOString() })
        .eq('doctor_id', doctorId);
    }

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// A doctor may only change their own billing records
const requireOwnBilling = async (req, res, next) => {
  try {
    const { data: billing } = await supabase
      .from('billing')
      .select('doctor_id')
      .eq('id', req.params.billingId)
      .maybeSingle();
    if (!billing) return res.status(404).json({ success: false, message: 'Billing record not found' });
    if (String(billing.doctor_id) !== String(req.doctorId)) {
      return res.status(403).json({ success: false, message: 'You can only update your own billing records' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Registered last so '/:billingId' does not shadow '/settings'
router.put('/:billingId', authenticateToken, requireOwnBilling, updateBillingRecord);
router.patch('/:billingId/mark-paid', authenticateToken, requireOwnBilling, markAsPaid);

export default router;
