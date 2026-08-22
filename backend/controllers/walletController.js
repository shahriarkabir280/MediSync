import { supabase } from '../config/db.js';

// Get wallet summary (balance, earnings stats)
export const getWalletSummary = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // 1. Get Wallet Balance
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('doctor_id', doctorId)
      .maybeSingle();

    if (walletError) throw walletError;

    // If no wallet exists, create one
    if (!wallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ doctor_id: doctorId, balance: 0, total_earned: 0 })
        .select()
        .single();
      
      if (createError) throw createError;
      wallet = newWallet;
    }

    // 2. Get Today's Summary
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: todayTransactions, error: todayError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('doctor_id', doctorId)
      .eq('type', 'credit')
      .gte('created_at', startOfToday.toISOString());

    if (todayError) throw todayError;

    const todayEarnings = todayTransactions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    // 3. Get Monthly Summary
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthTransactions, error: monthError } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('doctor_id', doctorId)
      .eq('type', 'credit')
      .gte('created_at', startOfMonth.toISOString());

    if (monthError) throw monthError;

    const monthlyEarnings = monthTransactions.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        total_earned: wallet.total_earned,
        today_earnings: todayEarnings,
        monthly_earnings: monthlyEarnings
      }
    });
  } catch (error) {
    console.error('Error fetching wallet summary:', error);
    res.status(500).json({ error: 'Failed to fetch wallet summary' });
  }
};

// Get transaction history
export const getTransactions = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const { data, error, count } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ success: true, data, count });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Request withdrawal
export const requestWithdrawal = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { amount, payment_method, account_details } = req.body;

    if (!amount || !payment_method || !account_details) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('doctor_id', doctorId)
      .single();

    if (walletError || !wallet) throw new Error('Wallet not found');

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Start transaction (simplified as Supabase doesn't support easy multi-table transactions in JS client without RPC)
    // 1. Create withdrawal request
    const { data: request, error: requestError } = await supabase
      .from('withdrawal_requests')
      .insert({
        doctor_id: doctorId,
        amount,
        payment_method,
        account_details,
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // 2. Debit wallet balance
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ 
        balance: parseFloat(wallet.balance) - parseFloat(amount),
        updated_at: new Date().toISOString()
      })
      .eq('doctor_id', doctorId);

    if (updateError) throw updateError;

    // 3. Log transaction
    const { error: logError } = await supabase
      .from('wallet_transactions')
      .insert({
        doctor_id: doctorId,
        amount,
        type: 'debit',
        source: 'withdrawal',
        source_id: request.id,
        description: `Withdrawal request to ${payment_method} (${account_details})`
      });

    if (logError) throw logError;

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: request
    });
  } catch (error) {
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({ error: error.message || 'Failed to request withdrawal' });
  }
};

// Get all revenue split rules
export const getRevenueRules = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('revenue_split_rules')
      .select('*')
      .order('service_type');

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching revenue rules:', error);
    res.status(500).json({ error: 'Failed to fetch revenue rules' });
  }
};

// Update a revenue split rule
export const updateRevenueRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_percentage, clinic_percentage, referral_percentage } = req.body;

    const { data, error } = await supabase
      .from('revenue_split_rules')
      .update({
        doctor_percentage,
        clinic_percentage,
        referral_percentage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data, message: 'Rule updated successfully' });
  } catch (error) {
    console.error('Error updating revenue rule:', error);
    res.status(500).json({ error: 'Failed to update revenue rule' });
  }
};

// Finance Rule Engine: Process Revenue Split
export const processRevenueSplit = async (billingId) => {
  try {
    // 1. Get Billing Record
    const { data: billing, error: billingError } = await supabase
      .from('billing')
      .select('*')
      .eq('id', billingId)
      .single();

    if (billingError || !billing) throw new Error('Billing record not found');
    if (billing.status !== 'paid') return;

    // 2. Get Rules
    const { data: rules, error: rulesError } = await supabase
      .from('revenue_split_rules')
      .select('*');
    
    if (rulesError || !rules) throw new Error('Revenue split rules not found');

    // Default rule (consultation)
    const rule = rules.find(r => r.service_type === (billing.appointment_id ? 'consultation' : 'lab_test')) || rules[0];

    const amount = parseFloat(billing.amount);
    const doctorShare = (amount * parseFloat(rule.doctor_percentage)) / 100;
    
    // 3. Update Doctor Wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, total_earned')
      .eq('doctor_id', billing.doctor_id)
      .maybeSingle();

    if (walletError) throw walletError;

    let currentBalance = 0;
    let currentTotalEarned = 0;

    if (wallet) {
      currentBalance = parseFloat(wallet.balance);
      currentTotalEarned = parseFloat(wallet.total_earned);
      
      await supabase
        .from('wallets')
        .update({ 
          balance: currentBalance + doctorShare,
          total_earned: currentTotalEarned + doctorShare,
          updated_at: new Date().toISOString()
        })
        .eq('doctor_id', billing.doctor_id);
    } else {
      await supabase
        .from('wallets')
        .insert({
          doctor_id: billing.doctor_id,
          balance: doctorShare,
          total_earned: doctorShare
        });
    }

    // 4. Log Transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        doctor_id: billing.doctor_id,
        amount: doctorShare,
        type: 'credit',
        source: billing.appointment_id ? 'consultation' : 'referral',
        source_id: billing.id,
        description: `Revenue share from ${billing.appointment_id ? 'Consultation' : 'Diagnostic Referral'} - Bill #${billing.id}`
      });

    console.log(`Revenue split processed for Bill #${billingId}: Doctor Share = ৳${doctorShare.toFixed(2)}`);
    return true;
  } catch (error) {
    console.error('Error processing revenue split:', error);
    return false;
  }
};
