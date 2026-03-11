import { supabase } from '../config/db.js';

// Get lab dashboard statistics
export const getLabStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Parallel requests for today's stats
    const { data: todayOrders, error: todayError } = await supabase
      .from('lab_orders')
      .select('status')
      .gte('order_date', `${today}T00:00:00`)
      .lte('order_date', `${today}T23:59:59`);

    if (todayError) throw todayError;

    const todayStats = {
      total_today: todayOrders.length,
      pending_today: todayOrders.filter(o => o.status === 'pending').length,
      processing_today: todayOrders.filter(o => o.status === 'in_progress').length,
      completed_today: todayOrders.filter(o => o.status === 'completed').length
    };

    // Urgent stats
    const { count: urgentCount, error: urgentError } = await supabase
      .from('lab_orders')
      .select('*', { count: 'exact', head: true })
      .in('priority', ['urgent', 'high'])
      .neq('status', 'completed');

    if (urgentError) throw urgentError;

    // Unreviewed results: Count orders that are completed but have unverified results
    // We join lab_results through lab_order_items to check status and verified_by
    const { data: unreviewedResults, error: unreviewedError } = await supabase
      .from('lab_results')
      .select('lab_order_items!inner(order_id, lab_orders!inner(status))')
      .is('verified_by', null)
      .eq('lab_order_items.lab_orders.status', 'completed');

    if (unreviewedError) throw unreviewedError;

    const unreviewedOrders = new Set(unreviewedResults.map(r => r.lab_order_items.order_id));

    res.json({
      success: true,
      data: {
        today: todayStats,
        urgent: { urgent_count: urgentCount || 0 },
        unreviewed: { unreviewed_count: unreviewedOrders.size }
      }
    });
  } catch (error) {
    console.error('Error fetching lab statistics:', error);
    res.status(500).json({ error: 'Failed to fetch lab statistics' });
  }
};

// Get recent lab orders with patient info
export const getRecentLabOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const { data: orders, error } = await supabase
      .from('lab_orders')
      .select(`
            *,
            patient:patients (first_name, last_name, unique_id),
            lab_order_items (count)
        `)
      .order('order_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const formattedOrders = orders.map(o => ({
      ...o,
      patient_first_name: o.patient?.first_name,
      patient_last_name: o.patient?.last_name,
      patient_unique_id: o.patient?.unique_id,
      test_count: o.lab_order_items?.[0]?.count || 0 // aggregate count from supabase
    }));

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Error fetching recent lab orders:', error);
    res.status(500).json({ error: 'Failed to fetch recent lab orders' });
  }
};

// Search lab orders with advanced filtering
export const searchLabOrders = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      limit = 50
    } = req.query;

    let query = supabase
      .from('lab_orders')
      .select(`
            *,
            patient:patients!inner (first_name, last_name, unique_id),
            doctor:doctors (first_name, last_name),
            lab_order_items (count)
        `);

    if (search) {
      const term = `%${search}%`;
      // Search by order number, clinical notes, OR patient name/unique_id
      query = query.or(`order_number.ilike.${term},clinical_notes.ilike.${term},patient.first_name.ilike.${term},patient.last_name.ilike.${term},patient.unique_id.ilike.${term}`);
    }

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data: orders, error } = await query
      .order('order_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const formattedOrders = orders.map(o => ({
      ...o,
      patient_first_name: o.patient?.first_name,
      patient_last_name: o.patient?.last_name,
      patient_unique_id: o.patient?.unique_id,
      doctor_first_name: o.doctor?.first_name,
      doctor_last_name: o.doctor?.last_name,
      test_count: o.lab_order_items?.[0]?.count || 0
    }));

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Error searching lab orders:', error);
    res.status(500).json({ error: 'Failed to search lab orders' });
  }
};

// Get all lab orders (For Diagnostic Center Portal)
export const getAllLabOrders = async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = supabase
      .from('lab_orders')
      .select(`
            *,
            patient:patients (first_name, last_name, unique_id, date_of_birth, gender),
            doctor:doctors (first_name, last_name, specialization),
            lab_order_items (
                id,
                status,
                lab_tests (test_name, test_code)
            )
        `)
      .order('order_date', { ascending: false })
      .limit(parseInt(limit));

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) throw error;

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching all lab orders:', error);
    res.status(500).json({ error: 'Failed to fetch all lab orders' });
  }
};

// Get filtered lab orders by status or priority (legacy helper function, somewhat redundant with search but used by UI likely)
export const getFilteredLabOrders = async (req, res) => {
  try {
    const { filter_type, limit = 20 } = req.query;

    let query = supabase
      .from('lab_orders')
      .select(`
            *,
            patient:patients (first_name, last_name, unique_id),
            lab_order_items (count)
        `)
      .order('order_date', { ascending: false })
      .limit(parseInt(limit));

    if (filter_type === 'urgent') {
      query = query.in('priority', ['urgent', 'high']).neq('status', 'completed');
    } else if (filter_type === 'pending') {
      query = query.eq('status', 'pending');
    } else if (filter_type === 'completed') {
      query = query.eq('status', 'completed');
    } else if (filter_type === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('order_date', `${today}T00:00:00`).lte('order_date', `${today}T23:59:59`);
    }

    const { data: orders, error } = await query;
    if (error) throw error;

    const formattedOrders = orders.map(o => ({
      ...o,
      patient_first_name: o.patient?.first_name,
      patient_last_name: o.patient?.last_name,
      patient_unique_id: o.patient?.unique_id,
      test_count: o.lab_order_items?.[0]?.count || 0
    }));

    res.json({ success: true, data: formattedOrders });
  } catch (error) {
    console.error('Error getting filtered lab orders:', error);
    res.status(500).json({ error: 'Failed to get filtered lab orders' });
  }
};

// Get detailed lab report for an order
export const getLabReport = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order with patient and doctor details
    const { data: order, error: orderError } = await supabase
      .from('lab_orders')
      .select(`
            *,
            patient:patients (first_name, last_name, unique_id, date_of_birth, gender, phone),
            doctor:doctors (first_name, last_name, specialization)
        `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Flatten for response
    const flattenedOrder = {
      ...order,
      patient_first_name: order.patient?.first_name,
      patient_last_name: order.patient?.last_name,
      patient_unique_id: order.patient?.unique_id,
      patient_dob: order.patient?.date_of_birth,
      patient_gender: order.patient?.gender,
      patient_phone: order.patient?.phone,
      doctor_first_name: order.doctor?.first_name,
      doctor_last_name: order.doctor?.last_name,
      doctor_specialization: order.doctor?.specialization
    };

    // Get items with tests and results
    // Relation chain: lab_order_items -> lab_tests, lab_order_items -> lab_results (1:1 usually)
    const { data: items, error: itemsError } = await supabase
      .from('lab_order_items')
      .select(`
            *,
            lab_tests (test_code, test_name, description, sample_type, turnaround_time_hours, category_id, lab_test_categories(name)),
            lab_results (*)
        `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    const formattedItems = items.map(item => ({
      ...item,
      test_code: item.lab_tests?.test_code,
      test_name: item.lab_tests?.test_name,
      test_description: item.lab_tests?.description,
      sample_type: item.lab_tests?.sample_type,
      turnaround_time_hours: item.lab_tests?.turnaround_time_hours,
      category_name: item.lab_tests?.lab_test_categories?.name,
      result_id: item.lab_results?.[0]?.id, // Assuming array from join, or object if one-to-one
      result_value: item.lab_results?.[0]?.result_value,
      result_text: item.lab_results?.[0]?.result_text,
      reference_range: item.lab_results?.[0]?.reference_range,
      unit: item.lab_results?.[0]?.unit,
      result_status: item.lab_results?.[0]?.status,
      abnormal_flag: item.lab_results?.[0]?.abnormal_flag,
      critical_flag: item.lab_results?.[0]?.critical_flag,
      result_date: item.lab_results?.[0]?.result_date,
      verified_by: item.lab_results?.[0]?.verified_by,
      verified_at: item.lab_results?.[0]?.verified_at,
      result_notes: item.lab_results?.[0]?.notes
    })).sort((a, b) => (a.category_name || '').localeCompare(b.category_name || '') || (a.test_name || '').localeCompare(b.test_name || ''));


    // Get the most recent report file if exists
    const { data: reportFiles } = await supabase
      .from('lab_report_files')
      .select('*')
      .eq('order_id', orderId)
      .order('uploaded_at', { ascending: false })
      .limit(1);

    const latestFile = reportFiles?.[0];

    res.json({
      success: true,
      data: {
        order: flattenedOrder,
        items: formattedItems,
        file_name: latestFile?.file_name,
        file_path: latestFile?.file_path,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting lab report:', error);
    res.status(500).json({ error: 'Failed to get lab report' });
  }
};

// Get all lab test categories
export const getLabCategories = async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('lab_test_categories')
      .select(`
            *,
            lab_tests (count)
        `)
      .order('name');

    if (error) throw error;

    const formatted = categories.map(c => ({
      ...c,
      test_count: c.lab_tests?.[0]?.count || 0
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching lab categories:', error);
    res.status(500).json({ error: 'Failed to fetch lab categories' });
  }
};

// Get all lab tests
export const getLabTests = async (req, res) => {
  try {
    const { category_id, search } = req.query;

    let query = supabase
      .from('lab_tests')
      .select('*, lab_test_categories(name)')
      .order('test_name');

    if (category_id) {
      query = query.eq('category_id', category_id);
    }

    if (search) {
      query = query.or(`test_name.ilike.%${search}%,test_code.ilike.%${search}%`);
    }

    const { data: tests, error } = await query;
    if (error) throw error;

    const formatted = tests.map(t => ({
      ...t,
      category_name: t.lab_test_categories?.name
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
};

// Create lab order
export const createLabOrder = async (req, res) => {
  try {
    const {
      doctor_id,
      patient_id,
      test_ids,
      priority = 'normal',
      clinical_notes,
      sample_collection_date
    } = req.body;

    console.log('Creating lab order with params:', { doctor_id, patient_id, test_ids, priority });

    if (!doctor_id || !patient_id || !test_ids || test_ids.length === 0) {
      console.warn('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure IDs are integers
    const doctorIdInt = parseInt(doctor_id);
    const patientIdInt = parseInt(patient_id);

    if (isNaN(doctorIdInt) || isNaN(patientIdInt)) {
      console.error('Validation failed: Invalid doctor_id or patient_id');
      return res.status(400).json({ error: 'Invalid ID formats' });
    }

    // Generate order number
    const orderNumber = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Get test costs
    const { data: tests, error: testError } = await supabase
      .from('lab_tests')
      .select('id, cost')
      .in('id', test_ids);

    if (testError) {
      console.error('Supabase error fetching tests:', testError);
      throw testError;
    }

    const totalCost = tests?.reduce((sum, test) => sum + parseFloat(test.cost || 0), 0) || 0;

    // Create lab order
    const { data: order, error: createError } = await supabase
      .from('lab_orders')
      .insert({
        order_number: orderNumber,
        doctor_id: doctorIdInt,
        patient_id: patientIdInt,
        priority,
        clinical_notes,
        total_cost: totalCost,
        sample_collection_date,
        created_by: doctorIdInt
      })
      .select()
      .single();

    if (createError) {
      console.error('Supabase error creating order:', createError);
      throw createError;
    }

    // Create order items
    const orderItemsData = test_ids.map(test_id => ({
      order_id: order.id,
      test_id: parseInt(test_id)
    }));

    const { data: orderItems, error: itemsError } = await supabase
      .from('lab_order_items')
      .insert(orderItemsData)
      .select();

    if (itemsError) {
      console.error('Supabase error creating items, should cleanup order', order.id, itemsError);
      throw itemsError;
    }

    console.log('Lab order created successfully:', order.order_number);
    res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
      data: { ...order, items: orderItems }
    });
  } catch (error) {
    console.error('CRITICAL: Error in createLabOrder:', error.message || error);
    res.status(500).json({ 
        success: false, 
        error: 'Failed to create lab order',
        details: error.message || 'Internal server error'
    });
  }
};

// Get lab orders for a doctor
export const getLabOrders = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, patient_id, limit = 50 } = req.query;

    let query = supabase
      .from('lab_orders')
      .select(`
            *,
            patient:patients (first_name, last_name, unique_id),
            doctor:doctors (first_name, last_name),
            lab_order_items (count)
        `)
      .eq('doctor_id', doctorId)
      .order('order_date', { ascending: false })
      .limit(parseInt(limit));

    if (status) query = query.eq('status', status);
    if (patient_id) query = query.eq('patient_id', patient_id);

    const { data: orders, error } = await query;
    if (error) throw error;

    const formatted = orders.map(o => ({
      ...o,
      patient_first_name: o.patient?.first_name,
      patient_last_name: o.patient?.last_name,
      patient_unique_id: o.patient?.unique_id,
      doctor_first_name: o.doctor?.first_name,
      doctor_last_name: o.doctor?.last_name,
      total_tests: o.lab_order_items?.[0]?.count || 0
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    res.status(500).json({ error: 'Failed to fetch lab orders' });
  }
};

// Get lab order details with results
export const getLabOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('lab_orders')
      .select(`
            *,
            patient:patients (first_name, last_name, unique_id, date_of_birth, gender),
            doctor:doctors (first_name, last_name)
        `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Lab order not found' });

    // Flatten
    const formattedOrder = {
      ...order,
      patient_first_name: order.patient?.first_name,
      patient_last_name: order.patient?.last_name,
      patient_unique_id: order.patient?.unique_id,
      patient_dob: order.patient?.date_of_birth,
      patient_gender: order.patient?.gender,
      doctor_first_name: order.doctor?.first_name,
      doctor_last_name: order.doctor?.last_name
    };

    // Get items with details
    const { data: items, error: itemsError } = await supabase
      .from('lab_order_items')
      .select(`
            *,
            lab_tests (test_code, test_name, normal_range_min, normal_range_max, unit, sample_type, category_id, lab_test_categories(name)),
            lab_results (*)
        `)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    const formattedItems = items.map(item => ({
      ...item,
      test_code: item.lab_tests?.test_code,
      test_name: item.lab_tests?.test_name,
      normal_range_min: item.lab_tests?.normal_range_min,
      normal_range_max: item.lab_tests?.normal_range_max,
      unit: item.lab_tests?.unit,
      sample_type: item.lab_tests?.sample_type,
      category_name: item.lab_tests?.lab_test_categories?.name,
      result_id: item.lab_results?.[0]?.id,
      result_value: item.lab_results?.[0]?.result_value,
      result_text: item.lab_results?.[0]?.result_text,
      reference_range: item.lab_results?.[0]?.reference_range,
      result_status: item.lab_results?.[0]?.status,
      abnormal_flag: item.lab_results?.[0]?.abnormal_flag,
      critical_flag: item.lab_results?.[0]?.critical_flag,
      result_date: item.lab_results?.[0]?.result_date,
      verified_by: item.lab_results?.[0]?.verified_by,
      verified_at: item.lab_results?.[0]?.verified_at,
      result_notes: item.lab_results?.[0]?.notes,
      result_file_path: item.lab_results?.[0]?.file_path,
      result_file_name: item.lab_results?.[0]?.file_name
    })).sort((a, b) => (a.category_name || '').localeCompare(b.category_name || '') || (a.test_name || '').localeCompare(b.test_name || ''));

    // Report files
    const { data: reportFiles } = await supabase
      .from('lab_report_files')
      .select('*')
      .eq('order_id', orderId)
      .order('uploaded_at', { ascending: false });

    res.json({
      success: true,
      data: {
        ...formattedOrder,
        items: formattedItems,
        reportFiles: reportFiles || []
      }
    });
  } catch (error) {
    console.error('Error fetching lab order details:', error);
    res.status(500).json({ error: 'Failed to fetch lab order details' });
  }
};

// Update lab order status
export const updateLabOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, sample_collection_date, sample_collection_notes } = req.body;

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (sample_collection_date) updates.sample_collection_date = sample_collection_date;
    if (sample_collection_notes) updates.sample_collection_notes = sample_collection_notes;
    if (status === 'completed') updates.report_date = new Date().toISOString();

    const { data: updatedOrder, error } = await supabase
      .from('lab_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error || !updatedOrder) {
      return res.status(404).json({ error: 'Lab order not found or update failed' });
    }

    res.json({
      success: true,
      message: 'Lab order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating lab order status:', error);
    res.status(500).json({ error: 'Failed to update lab order status' });
  }
};

// Add/Update lab result
export const updateLabResult = async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const {
      result_value,
      result_text,
      reference_range,
      unit,
      status = 'normal',
      abnormal_flag = false,
      critical_flag = false,
      verified_by,
      notes
    } = req.body;

    // Check existence
    const { data: existing } = await supabase.from('lab_results').select('id').eq('order_item_id', orderItemId).maybeSingle();
    let result;

    const resultData = {
      order_item_id: orderItemId,
      result_value,
      result_text,
      reference_range,
      unit,
      status,
      abnormal_flag,
      critical_flag,
      verified_by,
      notes,
      updated_at: new Date().toISOString()
    };

    if (verified_by) resultData.verified_at = new Date().toISOString();

    if (existing) {
      const { data: upd, error } = await supabase
        .from('lab_results')
        .update(resultData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = upd;
    } else {
      const { data: ins, error } = await supabase
        .from('lab_results')
        .insert(resultData)
        .select()
        .single();
      if (error) throw error;
      result = ins;
    }

    // Update item status
    await supabase.from('lab_order_items').update({ status: 'completed' }).eq('id', orderItemId);

    res.json({
      success: true,
      message: 'Lab result updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating lab result:', error);
    res.status(500).json({ error: 'Failed to update lab result' });
  }
};

// Get patient lab history
export const getPatientLabHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 20 } = req.query;

    const { data: orders, error } = await supabase
      .from('lab_orders')
      .select(`
            id,
            order_number,
            order_date,
            status,
            priority,
            doctor:doctors (first_name, last_name),
            lab_order_items (
              id,
              status,
              lab_tests (test_code, test_name),
              lab_results (id, result_value, result_text, status, file_path, file_name, result_date)
            )
        `)
      .eq('patient_id', parseInt(patientId))
      .order('order_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    console.log(`Fetched ${orders?.length || 0} orders for patient ${patientId}`);
    
    // Flatten into individual test items for easier frontend consumption
    const allTests = [];
    orders.forEach(order => {
      const items = order.lab_order_items || [];
      items.forEach(item => {
        const itemStatus = (item.lab_results && item.lab_results.length > 0) || item.status === 'completed' ? 'done' : 
                          (order.status?.toLowerCase() === 'pending' ? 'new' : 'processing');
        
        allTests.push({
          order_id: order.id,
          order_number: order.order_number,
          order_date: order.order_date,
          order_priority: order.priority,
          order_status: order.status,
          doctor_name: `${order.doctor?.first_name || ''} ${order.doctor?.last_name || ''}`.trim(),
          item_id: item.id,
          test_code: item.lab_tests?.test_code,
          test_name: item.lab_tests?.test_name,
          status: itemStatus,
          result: item.lab_results?.[0] || null
        });
      });
    });

    console.log(`Returning ${allTests.length} tests. Statuses:`, allTests.map(t => t.status));
    res.json({ success: true, data: allTests });
  } catch (error) {
    console.error('Error fetching patient lab history:', error);
    res.status(500).json({ error: 'Failed to fetch patient lab history' });
  }
};

// Delete lab order
export const deleteLabOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check status
    const { data: order } = await supabase.from('lab_orders').select('status').eq('id', orderId).single();

    if (!order) return res.status(404).json({ error: 'Lab order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be deleted' });
    }

    const { error } = await supabase.from('lab_orders').delete().eq('id', orderId);
    if (error) throw error;

    res.json({
      success: true,
      message: 'Lab order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab order:', error);
    res.status(500).json({ error: 'Failed to delete lab order' });
  }
};

// Get all patients for lab order selection
export const getLabPatients = async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;

    let query = supabase
      .from('patients')
      .select('id, unique_id, first_name, last_name, date_of_birth, gender, phone, email')
      .order('last_name')
      .limit(parseInt(limit));

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,unique_id.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: patients, error } = await query;
    if (error) throw error;

    res.json({ success: true, data: patients });
  } catch (error) {
    console.error('Error fetching lab patients:', error);
    res.status(500).json({ error: 'Failed to fetch lab patients' });
  }
};

export const uploadLabReportFile = async (req, res) => {
  try {
    const { orderId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Insert into lab_report_files
    const { data: reportFile, error } = await supabase
      .from('lab_report_files')
      .insert({
        order_id: orderId,
        file_name: file.filename,
        file_path: file.path
      })
      .select()
      .single();

    if (error) throw error;

    // Optional: Update order status to in_progress if it was pending
    await supabase
      .from('lab_orders')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'pending');

    res.status(201).json({
      success: true,
      message: 'Lab report uploaded successfully',
      data: reportFile
    });
  } catch (error) {
    console.error('Error uploading lab report:', error);
    res.status(500).json({ error: 'Failed to upload lab report' });
  }
};

// NEW: Upload report for a specific lab order item
export const uploadLabOrderItemReport = async (req, res) => {
  try {
    const { orderItemId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Get the order item to find its order_id
    const { data: item, error: itemError } = await supabase
      .from('lab_order_items')
      .select('order_id')
      .eq('id', orderItemId)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Lab order item not found' });
    }

    // 2. Insert or Update lab_results for this item
    const { data: existingResult } = await supabase
      .from('lab_results')
      .select('id')
      .eq('order_item_id', orderItemId)
      .maybeSingle();

    const resultData = {
      order_item_id: orderItemId,
      file_name: file.filename,
      file_path: file.path,
      status: 'normal',
      result_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let savedResult;
    if (existingResult) {
      const { data, error } = await supabase
        .from('lab_results')
        .update(resultData)
        .eq('id', existingResult.id)
        .select()
        .single();
      if (error) throw error;
      savedResult = data;
    } else {
      const { data, error } = await supabase
        .from('lab_results')
        .insert(resultData)
        .select()
        .single();
      if (error) throw error;
      savedResult = data;
    }

    // 3. Update order & item status
    await Promise.all([
      supabase
        .from('lab_orders')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', item.order_id)
        .eq('status', 'pending'),
      supabase
        .from('lab_order_items')
        .update({ status: 'completed' })
        .eq('id', orderItemId)
    ]);

    // 4. CHECK IF ALL ITEMS HAVE RESULTS -> Auto-Complete Order
    const { data: allItems } = await supabase
      .from('lab_order_items')
      .select('id')
      .eq('order_id', item.order_id);
    
    const itemIds = allItems.map(i => i.id);
    const { data: resultsCount } = await supabase
      .from('lab_results')
      .select('order_item_id')
      .in('order_item_id', itemIds);

    if (resultsCount && resultsCount.length === itemIds.length) {
      // All tests are done!
      await supabase
        .from('lab_orders')
        .update({ 
          status: 'completed', 
          report_date: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', item.order_id);
    }

    res.status(201).json({
      success: true,
      message: 'Test result uploaded successfully',
      data: savedResult,
      isOrderCompleted: resultsCount?.length === itemIds.length
    });

  } catch (error) {
    console.error('Error uploading item report:', error);
    res.status(500).json({ error: 'Failed to upload test result' });
  }
};

// Get pending reviews: Completed orders with unverified results
export const getPendingReviews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Join lab_results with lab_order_items and lab_orders
    // and patients for a complete "Review" card
    const { data: results, error } = await supabase
      .from('lab_results')
      .select(`
            *,
            item:lab_order_items!inner (
                order_id,
                lab_tests (test_name),
                order:lab_orders!inner (
                    status,
                    patient:patients (first_name, last_name, unique_id)
                )
            )
        `)
      .is('verified_by', null)
      .eq('item.order.status', 'completed')
      .order('updated_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    const formatted = results.map(r => ({
      id: r.id,
      order_id: r.item.order_id,
      test_name: r.item.lab_tests?.test_name,
      patient_name: `${r.item.order.patient?.first_name} ${r.item.order.patient?.last_name}`.trim(),
      patient_id: r.item.order.patient?.unique_id,
      updated_at: r.updated_at,
      status: r.status,
      abnormal: r.abnormal_flag
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Failed to fetch pending reviews' });
  }
};
// Verify and sign off all results for an order
export const verifyLabResultsForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required for verification' });
    }

    // 1. Get all order items for this order
    const { data: items, error: itemsError } = await supabase
      .from('lab_order_items')
      .select('id')
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;
    if (!items || items.length === 0) {
      return res.status(404).json({ error: 'No items found for this order' });
    }

    const itemIds = items.map(i => i.id);

    // 2. Update all results for these items
    const { error: verifyError } = await supabase
      .from('lab_results')
      .update({
        verified_by: doctorId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('order_item_id', itemIds);

    if (verifyError) throw verifyError;

    res.json({
      success: true,
      message: 'All lab results for this order have been verified and signed off'
    });
  } catch (error) {
    console.error('Error verifying lab results:', error);
    res.status(500).json({ error: 'Failed to verify lab results' });
  }
};

// Update lab order details (clinical notes, priority, etc)
export const updateLabOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { clinical_notes, priority, status, test_ids } = req.body;

    // 1. Update the main order fields
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (clinical_notes !== undefined) updates.clinical_notes = clinical_notes;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;

    // 2. Handle test list reconciliation if test_ids are provided
    if (test_ids && Array.isArray(test_ids)) {
      // Get current items
      const { data: currentItems, error: itemsFetchError } = await supabase
        .from('lab_order_items')
        .select('test_id')
        .eq('order_id', orderId);

      if (itemsFetchError) throw itemsFetchError;

      const currentTestIds = currentItems.map(item => item.test_id);
      const incomingTestIds = test_ids.map(id => parseInt(id));

      const toAdd = incomingTestIds.filter(id => !currentTestIds.includes(id));
      const toRemove = currentTestIds.filter(id => !incomingTestIds.includes(id));

      // Add new tests
      if (toAdd.length > 0) {
        const insertData = toAdd.map(test_id => ({
          order_id: orderId,
          test_id: test_id
        }));
        const { error: insertError } = await supabase.from('lab_order_items').insert(insertData);
        if (insertError) throw insertError;
      }

      // Remove tests (only if not already completed/has results, or just remove them?)
      // For simplicity, we remove them.
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('lab_order_items')
          .delete()
          .eq('order_id', orderId)
          .in('test_id', toRemove);
        if (deleteError) throw deleteError;
      }

      // Recalculate total cost
      const { data: tests, error: testError } = await supabase
        .from('lab_tests')
        .select('cost')
        .in('id', incomingTestIds);
      
      if (testError) throw testError;
      
      updates.total_cost = tests?.reduce((sum, test) => sum + parseFloat(test.cost || 0), 0) || 0;
    }

    const { data: updatedOrder, error } = await supabase
      .from('lab_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Lab order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating lab order:', error);
    res.status(500).json({ error: 'Failed to update lab order' });
  }
};
