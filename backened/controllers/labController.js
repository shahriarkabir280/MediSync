import { sql } from '../config/db.js';

// Get lab dashboard statistics
export const getLabStats = async (req, res) => {
  try {
    // Get today's orders count
    const [todayStats] = await sql`
      SELECT 
        COUNT(*) as total_today,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_today,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as processing_today,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_today
      FROM lab_orders 
      WHERE DATE(order_date) = CURRENT_DATE
    `;

    // Get urgent orders count
    const [urgentStats] = await sql`
      SELECT COUNT(*) as urgent_count
      FROM lab_orders 
      WHERE priority IN ('urgent', 'high') AND status != 'completed'
    `;

    // Get unreviewed results count (orders that are completed but not verified)
    const [unreviewedStats] = await sql`
      SELECT COUNT(DISTINCT lo.id) as unreviewed_count
      FROM lab_orders lo
      JOIN lab_order_items loi ON lo.id = loi.order_id
      LEFT JOIN lab_results lr ON loi.id = lr.order_item_id
      WHERE lo.status = 'completed' AND (lr.verified_by IS NULL OR lr.verified_by = '')
    `;

    res.json({
      success: true,
      data: {
        today: todayStats,
        urgent: urgentStats,
        unreviewed: unreviewedStats
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
    
    const orders = await sql`
      SELECT 
        lo.id,
        lo.order_number,
        lo.priority,
        lo.status,
        lo.order_date,
        lo.clinical_notes,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.unique_id as patient_unique_id,
        COUNT(loi.id) as test_count
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
      GROUP BY lo.id, p.id
      ORDER BY lo.order_date DESC
      LIMIT ${limit}
    `;

    res.json({ success: true, data: orders });
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

    if (search) {
      // Search by order number, patient name, or clinical notes
      const orders = await sql`
        SELECT 
          lo.id,
          lo.order_number,
          lo.priority,
          lo.status,
          lo.order_date,
          lo.clinical_notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.unique_id as patient_unique_id,
          d.first_name as doctor_first_name,
          d.last_name as doctor_last_name,
          COUNT(loi.id) as test_count
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        JOIN doctors d ON lo.doctor_id = d.id
        LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
        WHERE (
          lo.order_number ILIKE ${`%${search}%`} OR
          p.first_name ILIKE ${`%${search}%`} OR
          p.last_name ILIKE ${`%${search}%`} OR
          p.unique_id ILIKE ${`%${search}%`} OR
          lo.clinical_notes ILIKE ${`%${search}%`}
        )
        GROUP BY lo.id, p.id, d.id
        ORDER BY lo.order_date DESC
        LIMIT ${limit}
      `;
      res.json({ success: true, data: orders });
    } else {
      // Return recent orders if no search term
      const orders = await sql`
        SELECT 
          lo.id,
          lo.order_number,
          lo.priority,
          lo.status,
          lo.order_date,
          lo.clinical_notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.unique_id as patient_unique_id,
          COUNT(loi.id) as test_count
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
        GROUP BY lo.id, p.id
        ORDER BY lo.order_date DESC
        LIMIT ${limit}
      `;
      res.json({ success: true, data: orders });
    }
  } catch (error) {
    console.error('Error searching lab orders:', error);
    res.status(500).json({ error: 'Failed to search lab orders' });
  }
};

// Get filtered lab orders by status or priority
export const getFilteredLabOrders = async (req, res) => {
  try {
    const { filter_type, filter_value, limit = 20 } = req.query;

    let orders;

    if (filter_type === 'urgent') {
      orders = await sql`
        SELECT 
          lo.id,
          lo.order_number,
          lo.priority,
          lo.status,
          lo.order_date,
          lo.clinical_notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.unique_id as patient_unique_id,
          COUNT(loi.id) as test_count
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
        WHERE lo.priority IN ('urgent', 'high') AND lo.status != 'completed'
        GROUP BY lo.id, p.id
        ORDER BY lo.order_date DESC
        LIMIT ${limit}
      `;
    } else if (filter_type === 'pending') {
      orders = await sql`
        SELECT 
          lo.id,
          lo.order_number,
          lo.priority,
          lo.status,
          lo.order_date,
          lo.clinical_notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.unique_id as patient_unique_id,
          COUNT(loi.id) as test_count
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
        WHERE lo.status = 'pending'
        GROUP BY lo.id, p.id
        ORDER BY lo.order_date DESC
        LIMIT ${limit}
      `;
    } else if (filter_type === 'completed') {
      orders = await sql`
        SELECT 
          lo.id,
          lo.order_number,
          lo.priority,
          lo.status,
          lo.order_date,
          lo.clinical_notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.unique_id as patient_unique_id,
          COUNT(loi.id) as test_count
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
        WHERE lo.status = 'completed'
        GROUP BY lo.id, p.id
        ORDER BY lo.order_date DESC
        LIMIT ${limit}
      `;
    } else if (filter_type === 'today') {
      orders = await sql`
        SELECT 
          lo.id,
          lo.order_number,
          lo.priority,
          lo.status,
          lo.order_date,
          lo.clinical_notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.unique_id as patient_unique_id,
          COUNT(loi.id) as test_count
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
        WHERE DATE(lo.order_date) = CURRENT_DATE
        GROUP BY lo.id, p.id
        ORDER BY lo.order_date DESC
        LIMIT ${limit}
      `;
    } else {
      // Default to recent orders
      orders = await sql`
        SELECT 
          lo.id,
          lo.order_number,
          lo.priority,
          lo.status,
          lo.order_date,
          lo.clinical_notes,
          p.first_name as patient_first_name,
          p.last_name as patient_last_name,
          p.unique_id as patient_unique_id,
          COUNT(loi.id) as test_count
        FROM lab_orders lo
        JOIN patients p ON lo.patient_id = p.id
        LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
        GROUP BY lo.id, p.id
        ORDER BY lo.order_date DESC
        LIMIT ${limit}
      `;
    }

    res.json({ success: true, data: orders });
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
    const [order] = await sql`
      SELECT 
        lo.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.unique_id as patient_unique_id,
        p.date_of_birth as patient_dob,
        p.gender as patient_gender,
        p.phone as patient_phone,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN doctors d ON lo.doctor_id = d.id
      WHERE lo.id = ${orderId}
    `;

    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Get order items with test details and results
    const orderItems = await sql`
      SELECT 
        loi.*,
        lt.test_code,
        lt.test_name,
        lt.description as test_description,
        lt.sample_type,
        lt.turnaround_time_hours,
        lc.name as category_name,
        lr.id as result_id,
        lr.result_value,
        lr.result_text,
        lr.reference_range,
        lr.unit,
        lr.status as result_status,
        lr.abnormal_flag,
        lr.critical_flag,
        lr.result_date,
        lr.verified_by,
        lr.verified_at,
        lr.notes as result_notes
      FROM lab_order_items loi
      JOIN lab_tests lt ON loi.test_id = lt.id
      LEFT JOIN lab_test_categories lc ON lt.category_id = lc.id
      LEFT JOIN lab_results lr ON loi.id = lr.order_item_id
      WHERE loi.order_id = ${orderId}
      ORDER BY lc.name, lt.test_name
    `;

    res.json({
      success: true,
      data: {
        order,
        items: orderItems,
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
    const categories = await sql`
      SELECT 
        lc.*,
        COUNT(lt.id) as test_count
      FROM lab_test_categories lc
      LEFT JOIN lab_tests lt ON lc.id = lt.category_id
      GROUP BY lc.id, lc.name, lc.description, lc.created_at
      ORDER BY lc.name
    `;

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching lab categories:', error);
    res.status(500).json({ error: 'Failed to fetch lab categories' });
  }
};

// Get all lab tests
export const getLabTests = async (req, res) => {
  try {
    const { category_id, search } = req.query;
    
    let query = `
      SELECT 
        lt.*,
        lc.name as category_name
      FROM lab_tests lt
      LEFT JOIN lab_test_categories lc ON lt.category_id = lc.id
    `;

    const conditions = [];
    const params = [];
    
    if (category_id) {
      conditions.push(`lt.category_id = $${params.length + 1}`);
      params.push(category_id);
    }
    
    if (search) {
      conditions.push(`(lt.test_name ILIKE $${params.length + 1} OR lt.test_code ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY lc.name, lt.test_name`;

    const tests = await sql.unsafe(query, params);
    res.json({ success: true, data: tests });
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

    if (!doctor_id || !patient_id || !test_ids || test_ids.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate order number
    const orderNumber = `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Get test costs
    const tests = await sql`
      SELECT id, cost FROM lab_tests WHERE id = ANY(${test_ids})
    `;

    const totalCost = tests.reduce((sum, test) => sum + parseFloat(test.cost || 0), 0);

    // Create lab order
    const [order] = await sql`
      INSERT INTO lab_orders (
        order_number, doctor_id, patient_id, priority, 
        clinical_notes, total_cost, sample_collection_date, created_by
      )
      VALUES (
        ${orderNumber}, ${doctor_id}, ${patient_id}, ${priority},
        ${clinical_notes}, ${totalCost}, ${sample_collection_date}, ${doctor_id}
      )
      RETURNING *
    `;

    // Create order items
    const orderItems = await Promise.all(
      test_ids.map(async (test_id) => {
        const test = tests.find(t => t.id === parseInt(test_id));
        const [item] = await sql`
          INSERT INTO lab_order_items (order_id, test_id)
          VALUES (${order.id}, ${test_id})
          RETURNING *
        `;
        return item;
      })
    );

    res.status(201).json({
      success: true,
      message: 'Lab order created successfully',
      data: { ...order, items: orderItems }
    });
  } catch (error) {
    console.error('Error creating lab order:', error);
    res.status(500).json({ error: 'Failed to create lab order' });
  }
};

// Get lab orders for a doctor
export const getLabOrders = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, patient_id, limit = 50 } = req.query;

    let query = `
      SELECT 
        lo.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.unique_id as patient_unique_id,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        COUNT(loi.id) as total_tests
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN doctors d ON lo.doctor_id = d.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
      WHERE lo.doctor_id = $1
    `;

    const params = [doctorId];
    
    if (status) {
      query += ` AND lo.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (patient_id) {
      query += ` AND lo.patient_id = $${params.length + 1}`;
      params.push(patient_id);
    }

    query += `
      GROUP BY lo.id, p.id, d.id
      ORDER BY lo.order_date DESC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const orders = await sql.unsafe(query, params);
    res.json({ success: true, data: orders });
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
    const [order] = await sql`
      SELECT 
        lo.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.unique_id as patient_unique_id,
        p.date_of_birth as patient_dob,
        p.gender as patient_gender,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN doctors d ON lo.doctor_id = d.id
      WHERE lo.id = ${orderId}
    `;

    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Get order items with test details and results
    const orderItems = await sql`
      SELECT 
        loi.*,
        lt.test_code,
        lt.test_name,
        lt.normal_range_min,
        lt.normal_range_max,
        lt.unit,
        lt.sample_type,
        lc.name as category_name,
        lr.id as result_id,
        lr.result_value,
        lr.result_text,
        lr.reference_range,
        lr.status as result_status,
        lr.abnormal_flag,
        lr.critical_flag,
        lr.result_date,
        lr.verified_by,
        lr.verified_at,
        lr.notes as result_notes,
        lr.file_path as result_file_path,
        lr.file_name as result_file_name
      FROM lab_order_items loi
      JOIN lab_tests lt ON loi.test_id = lt.id
      LEFT JOIN lab_test_categories lc ON lt.category_id = lc.id
      LEFT JOIN lab_results lr ON loi.id = lr.order_item_id
      WHERE loi.order_id = ${orderId}
      ORDER BY lc.name, lt.test_name
    `;

    // Get report files
    const reportFiles = await sql`
      SELECT * FROM lab_report_files 
      WHERE order_id = ${orderId}
      ORDER BY uploaded_at DESC
    `;

    res.json({
      success: true,
      data: {
        ...order,
        items: orderItems,
        reportFiles
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

    const [updatedOrder] = await sql`
      UPDATE lab_orders 
      SET 
        status = ${status},
        sample_collection_date = COALESCE(${sample_collection_date}, sample_collection_date),
        sample_collection_notes = COALESCE(${sample_collection_notes}, sample_collection_notes),
        report_date = CASE WHEN ${status} = 'completed' THEN CURRENT_TIMESTAMP ELSE report_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${orderId}
      RETURNING *
    `;

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Lab order not found' });
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

    // Check if result exists
    const [existingResult] = await sql`
      SELECT id FROM lab_results WHERE order_item_id = ${orderItemId}
    `;

    let result;
    if (existingResult) {
      // Update existing result
      [result] = await sql`
        UPDATE lab_results 
        SET 
          result_value = COALESCE(${result_value}, result_value),
          result_text = COALESCE(${result_text}, result_text),
          reference_range = COALESCE(${reference_range}, reference_range),
          unit = COALESCE(${unit}, unit),
          status = ${status},
          abnormal_flag = ${abnormal_flag},
          critical_flag = ${critical_flag},
          verified_by = COALESCE(${verified_by}, verified_by),
          verified_at = CASE WHEN ${verified_by} IS NOT NULL THEN CURRENT_TIMESTAMP ELSE verified_at END,
          notes = COALESCE(${notes}, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE order_item_id = ${orderItemId}
        RETURNING *
      `;
    } else {
      // Create new result
      [result] = await sql`
        INSERT INTO lab_results (
          order_item_id, result_value, result_text, reference_range,
          unit, status, abnormal_flag, critical_flag, verified_by,
          verified_at, notes
        )
        VALUES (
          ${orderItemId}, ${result_value}, ${result_text}, ${reference_range},
          ${unit}, ${status}, ${abnormal_flag}, ${critical_flag}, ${verified_by},
          ${verified_by ? sql`CURRENT_TIMESTAMP` : null}, ${notes}
        )
        RETURNING *
      `;
    }

    // Update order item status
    await sql`
      UPDATE lab_order_items 
      SET status = 'completed'
      WHERE id = ${orderItemId}
    `;

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

    const orders = await sql`
      SELECT 
        lo.*,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        COUNT(loi.id) as total_tests,
        COUNT(CASE WHEN loi.status = 'completed' THEN 1 END) as completed_tests
      FROM lab_orders lo
      JOIN doctors d ON lo.doctor_id = d.id
      LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
      WHERE lo.patient_id = ${patientId}
      GROUP BY lo.id, d.id
      ORDER BY lo.order_date DESC
      LIMIT ${limit}
    `;

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching patient lab history:', error);
    res.status(500).json({ error: 'Failed to fetch patient lab history' });
  }
};

// Delete lab order
export const deleteLabOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Check if order can be deleted (only pending orders)
    const [order] = await sql`
      SELECT status FROM lab_orders WHERE id = ${orderId}
    `;

    if (!order) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be deleted' });
    }

    // Delete order (CASCADE will handle related records)
    await sql`DELETE FROM lab_orders WHERE id = ${orderId}`;

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

    let patients;
    
    if (search) {
      patients = await sql`
        SELECT 
          id,
          unique_id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email
        FROM patients
        WHERE 
          first_name ILIKE ${`%${search}%`} OR
          last_name ILIKE ${`%${search}%`} OR
          unique_id ILIKE ${`%${search}%`} OR
          phone ILIKE ${`%${search}%`}
        ORDER BY last_name, first_name
        LIMIT ${parseInt(limit)}
      `;
    } else {
      patients = await sql`
        SELECT 
          id,
          unique_id,
          first_name,
          last_name,
          date_of_birth,
          gender,
          phone,
          email
        FROM patients
        ORDER BY last_name, first_name
        LIMIT ${parseInt(limit)}
      `;
    }

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};