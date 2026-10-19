import { supabase } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processRevenueSplit } from './walletController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const SSL_STORE_ID = process.env.SSL_STORE_ID || '';
const SSL_STORE_PASSWORD = process.env.SSL_STORE_PASSWORD || '';
const IS_LIVE = process.env.SSL_IS_LIVE === 'true';

console.log('Payment Config:', {
  storeIdLoaded: SSL_STORE_ID.substring(0, 8) + '...',
  isLive: IS_LIVE,
  apiUrl: IS_LIVE ? 'SECURE' : 'SANDBOX'
});

const SSL_API_URL = IS_LIVE 
  ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php' 
  : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Initialize a payment session with SSLCommerz
 */
export const initiatePayment = async (req, res) => {
  try {
    const { billing_id, amount, patient_name, patient_email, patient_phone } = req.body;

    console.log('Payment Initiation Request:', { billing_id, amount, patient_name, patient_email, patient_phone });

    if (!billing_id || !amount) {
      console.warn('Payment Initiation Failed: Missing billing_id or amount');
      return res.status(400).json({ error: 'Billing ID and Amount are required' });
    }

    const tran_id = `TXN-${Date.now()}-${billing_id}`;

    // --- MOCK MODE CHECK ---
    // No store configured, or the SSLCommerz sandbox placeholder ID: use a mock flow
    if (!SSL_STORE_ID || SSL_STORE_ID === 'carec67d325785f81f') {
      console.log('🚀 MOCK MODE ACTIVE: Redirecting to simulation...');
      const mockUrl = `${BACKEND_URL}/api/payment/mock-checkout?tran_id=${tran_id}&billing_id=${billing_id}&amount=${amount}&name=${encodeURIComponent(patient_name || 'Patient')}`;
      return res.json({ success: true, url: mockUrl });
    }

    const data = {
      store_id: SSL_STORE_ID,
      store_passwd: SSL_STORE_PASSWORD,
      total_amount: amount,
      currency: 'BDT',
      tran_id: tran_id,
      success_url: `${BACKEND_URL}/api/payment/success?tran_id=${tran_id}&billing_id=${billing_id}`,
      fail_url: `${BACKEND_URL}/api/payment/fail?tran_id=${tran_id}`,
      cancel_url: `${BACKEND_URL}/api/payment/cancel?tran_id=${tran_id}`,
      ipn_url: `${BACKEND_URL}/api/payment/ipn`,
      shipping_method: 'NO',
      product_name: 'Medical Consultation/Test',
      product_category: 'Healthcare',
      product_profile: 'general',
      cus_name: patient_name || 'Anonymous Patient',
      cus_email: patient_email || 'patient@example.com',
      cus_add1: 'Dhaka',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: patient_phone || '01700000000',
    };

    // Use URLSearchParams for form-data as required by SSLCommerz
    const formParams = new URLSearchParams();
    Object.keys(data).forEach(key => formParams.append(key, data[key]));

    console.log('Sending to SSLCommerz API:', SSL_API_URL);
    const response = await fetch(SSL_API_URL, {
      method: 'POST',
      body: formParams,
    });

    const result = await response.json();
    console.log('SSLCommerz API Response:', JSON.stringify(result, null, 2));

    if (result.status === 'SUCCESS') {
      res.json({ success: true, url: result.GatewayPageURL });
    } else {
      console.error('SSLCommerz Initiation Failed:', result.failedreason);
      res.status(400).json({ success: false, message: result.failedreason || 'Payment initiation failed' });
    }
  } catch (error) {
    console.error('Payment Initiation Error (Catch):', error);
    res.status(500).json({ error: 'Internal server error during payment initiation' });
  }
};

/**
 * Mock Checkout Page for testing flow without valid credentials
 */
export const mockCheckout = (req, res) => {
  const { tran_id, billing_id, amount, name } = req.query;
  
  const html = `
    <html>
      <head>
        <title>MediSync Mock Payment</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
        <style>body { font-family: 'Inter', sans-serif; }</style>
      </head>
      <body class="bg-[#fafafa] flex items-center justify-center min-h-screen p-4">
        <div class="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 p-10 border border-slate-100 text-center">
          <div class="w-20 h-20 bg-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 shadow-xl shadow-indigo-500/20">
             <span class="text-white text-4xl font-black">৳</span>
          </div>
          <h1 class="text-2xl font-black text-slate-900 mb-2">Simulated Checkout</h1>
          <p class="text-slate-500 text-sm mb-8 font-medium">Testing mode: No real money will be charged.</p>
          
          <div class="bg-slate-50 rounded-2xl p-6 mb-8 text-left space-y-3">
            <div class="flex justify-between items-center"><span class="text-slate-400 text-[10px] font-black uppercase tracking-widest">Patient</span><span class="text-slate-900 font-bold text-sm">${name}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-400 text-[10px] font-black uppercase tracking-widest">Amount</span><span class="text-indigo-600 font-black text-lg">৳${amount}</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-400 text-[10px] font-black uppercase tracking-widest">Reference</span><span class="text-slate-500 text-[10px] font-bold">Bill #${billing_id}</span></div>
          </div>
          
          <div class="space-y-4">
            <a href="${BACKEND_URL}/api/payment/success?tran_id=${tran_id}&billing_id=${billing_id}" 
               class="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25">
               Pay Now (Success)
            </a>
            <a href="${BACKEND_URL}/api/payment/fail?tran_id=${tran_id}" 
               class="block w-full py-4 bg-white text-rose-500 border-2 border-rose-500/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all">
               Simulate Failure
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
  res.send(html);
};

/**
 * Handle successful payment redirect
 */
export const handleSuccess = async (req, res) => {
  try {
    // SSLCommerz might POST or GET. Extract data from either.
    const tran_id = req.query.tran_id || req.body.tran_id;
    let billing_id = req.query.billing_id || req.body.billing_id;

    // If billing_id is missing from direct params, extract from tran_id
    if (!billing_id && tran_id) {
        const parts = tran_id.split('-');
        billing_id = parts[parts.length - 1];
    }

    console.log('Payment Success Hook:', { tran_id, billing_id });

    if (!billing_id) {
        console.error('Payment Success Handler Error: Missing billing_id');
        return res.redirect(`${BASE_URL}/?tab=wallet&status=error&message=missing_id`);
    }

    // 1. Mark billing as paid
    const { error: billingError } = await supabase
      .from('billing')
      .update({ 
        status: 'paid', 
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', billing_id);

    if (billingError) {
        console.error('Database Update Error (Success Hook):', billingError);
        throw billingError;
    }

    // 2. Trigger revenue split
    await processRevenueSplit(billing_id);

    // 3. Redirect to frontend success page (Root path '/')
    const amount = req.query.amount || req.body.amount || '';
    res.redirect(`${BASE_URL}/?tab=wallet&status=success&tran_id=${tran_id}&amount=${amount}`);
  } catch (error) {
    console.error('Payment Success Handler Error:', error);
    res.redirect(`${BASE_URL}/?tab=wallet&status=error`);
  }
};

/**
 * Handle failed/canceled payment redirect
 */
export const handleFail = async (req, res) => {
  res.redirect(`${BASE_URL}/?tab=wallet&status=fail`);
};

export const handleCancel = async (req, res) => {
  res.redirect(`${BASE_URL}/?tab=wallet&status=cancel`);
};

/**
 * IPN (Instant Payment Notification) listener
 */
export const handleIPN = async (req, res) => {
  try {
    const data = req.body;
    console.log('IPN Received:', data.tran_id, data.status);
    
    if (data.status === 'VALID' || data.status === 'AUTHENTICATED') {
        const tran_id = data.tran_id;
        // Extract billing_id from tran_id (Format: TXN-timestamp-billingId)
        const parts = tran_id.split('-');
        const billing_id = parts[parts.length - 1];

        // Update billing if not already updated
        const { error } = await supabase
          .from('billing')
          .update({ 
            status: 'paid', 
            payment_date: new Date().toISOString()
          })
          .eq('id', billing_id);

        if (!error) {
            await processRevenueSplit(billing_id);
        }
    }
    
    res.status(200).send('IPN Received');
  } catch (error) {
    console.error('IPN Error:', error);
    res.status(500).send('IPN Error');
  }
};
