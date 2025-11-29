import { sql } from './config/db.js';

async function createLabSchema() {
  try {
    // Lab test categories table
    await sql`
      CREATE TABLE IF NOT EXISTS lab_test_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Lab tests master table
    await sql`
      CREATE TABLE IF NOT EXISTS lab_tests (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES lab_test_categories(id) ON DELETE SET NULL,
        test_code VARCHAR(20) NOT NULL UNIQUE,
        test_name VARCHAR(200) NOT NULL,
        description TEXT,
        normal_range_min DECIMAL(10,3),
        normal_range_max DECIMAL(10,3),
        unit VARCHAR(50),
        sample_type VARCHAR(100),
        turnaround_time_hours INTEGER DEFAULT 24,
        cost DECIMAL(10,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Lab orders table
    await sql`
      CREATE TABLE IF NOT EXISTS lab_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(10) DEFAULT 'normal',
        clinical_notes TEXT,
        total_cost DECIMAL(10,2) DEFAULT 0,
        sample_collection_date TIMESTAMP,
        sample_collection_notes TEXT,
        report_date TIMESTAMP,
        created_by INTEGER REFERENCES doctors(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Lab order items table (tests within an order)
    await sql`
      CREATE TABLE IF NOT EXISTS lab_order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES lab_orders(id) ON DELETE CASCADE,
        test_id INTEGER REFERENCES lab_tests(id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        cost DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Lab results table
    await sql`
      CREATE TABLE IF NOT EXISTS lab_results (
        id SERIAL PRIMARY KEY,
        order_item_id INTEGER REFERENCES lab_order_items(id) ON DELETE CASCADE,
        result_value DECIMAL(15,6),
        result_text TEXT,
        reference_range VARCHAR(100),
        unit VARCHAR(50),
        status VARCHAR(20) DEFAULT 'normal',
        abnormal_flag BOOLEAN DEFAULT false,
        critical_flag BOOLEAN DEFAULT false,
        result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_by VARCHAR(100),
        verified_at TIMESTAMP,
        notes TEXT,
        file_path VARCHAR(500),
        file_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Lab report files table
    await sql`
      CREATE TABLE IF NOT EXISTS lab_report_files (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES lab_orders(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size INTEGER,
        original_name VARCHAR(255),
        uploaded_by INTEGER REFERENCES doctors(id),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_lab_orders_doctor_id ON lab_orders(doctor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lab_orders_patient_id ON lab_orders(patient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lab_orders_status ON lab_orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lab_orders_date ON lab_orders(order_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lab_order_items_order_id ON lab_order_items(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lab_results_order_item_id ON lab_results(order_item_id)`;

    console.log('Laboratory database schema created successfully!');
  } catch (error) {
    console.error('Error creating lab schema:', error);
  }
}

createLabSchema();