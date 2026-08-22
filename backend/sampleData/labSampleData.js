import { sql } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

async function insertLabSampleData() {
    try {
        console.log('Inserting laboratory sample data...');

        // Insert lab test categories
        const categories = [
            { id: 1, name: 'Hematology', description: 'Blood cell analysis and related tests' },
            { id: 2, name: 'Clinical Chemistry', description: 'Chemical analysis of body fluids' },
            { id: 3, name: 'Microbiology', description: 'Bacterial, viral, and fungal testing' },
            { id: 4, name: 'Immunology', description: 'Immune system and antibody tests' },
            { id: 5, name: 'Molecular Diagnostics', description: 'DNA/RNA analysis and genetic testing' },
            { id: 6, name: 'Clinical Pathology', description: 'Tissue and cellular analysis' }
        ];

        for (const category of categories) {
            await sql`INSERT INTO lab_test_categories (name, description) 
                     VALUES (${category.name}, ${category.description}) 
                     ON CONFLICT (name) DO NOTHING`;
        }

        // Insert lab tests
        const labTests = [
            // Hematology Tests
            { test_code: 'CBC001', test_name: 'Complete Blood Count (CBC)', category_id: 1, cost: 45.00, description: 'WBC: 4.5-11.0 K/uL, RBC: 4.7-6.1 M/uL, Hgb: 14.0-18.0 g/dL', sample_type: 'Blood', turnaround_time_hours: 2 },
            { test_code: 'PLT001', test_name: 'Platelet Count', category_id: 1, cost: 25.00, description: '150-450 K/uL', sample_type: 'Blood', turnaround_time_hours: 2 },
            { test_code: 'ESR001', test_name: 'ESR (Erythrocyte Sedimentation Rate)', category_id: 1, cost: 30.00, description: 'Male: 0-15 mm/hr, Female: 0-20 mm/hr', sample_type: 'Blood', turnaround_time_hours: 1 },
            { test_code: 'PT001', test_name: 'Prothrombin Time (PT)', category_id: 1, cost: 35.00, description: '11.0-12.5 seconds', sample_type: 'Blood', turnaround_time_hours: 2 },
            { test_code: 'PTT001', test_name: 'Partial Thromboplastin Time (PTT)', category_id: 1, cost: 35.00, description: '25-35 seconds', sample_type: 'Blood', turnaround_time_hours: 2 },

            // Clinical Chemistry Tests
            { test_code: 'BMP001', test_name: 'Basic Metabolic Panel (BMP)', category_id: 2, cost: 55.00, description: 'Glucose: 70-100 mg/dL, BUN: 7-20 mg/dL, Creatinine: 0.6-1.3 mg/dL', sample_type: 'Blood', turnaround_time_hours: 4 },
            { test_code: 'CMP001', test_name: 'Comprehensive Metabolic Panel (CMP)', category_id: 2, cost: 75.00, description: 'Multiple parameters - see individual reference ranges', sample_type: 'Blood', turnaround_time_hours: 4 },
            { test_code: 'LIP001', test_name: 'Lipid Panel', category_id: 2, cost: 65.00, description: 'Total Cholesterol: <200 mg/dL, LDL: <100 mg/dL, HDL: >40 mg/dL', sample_type: 'Blood', turnaround_time_hours: 4 },
            { test_code: 'A1C001', test_name: 'Hemoglobin A1C', category_id: 2, cost: 50.00, description: '<5.7%', sample_type: 'Blood', turnaround_time_hours: 4 },
            { test_code: 'THY001', test_name: 'Thyroid Function Panel', category_id: 2, cost: 85.00, description: 'TSH: 0.4-4.0 mIU/L, Free T4: 0.8-1.8 ng/dL', sample_type: 'Blood', turnaround_time_hours: 6 },
            { test_code: 'LFT001', test_name: 'Liver Function Panel', category_id: 2, cost: 70.00, description: 'ALT: 7-56 U/L, AST: 10-40 U/L, Bilirubin: 0.1-1.2 mg/dL', sample_type: 'Blood', turnaround_time_hours: 4 },

            // Microbiology Tests
            { test_code: 'BCX001', test_name: 'Blood Culture', category_id: 3, cost: 95.00, description: 'No growth', sample_type: 'Blood', turnaround_time_hours: 72 },
            { test_code: 'UCX001', test_name: 'Urine Culture', category_id: 3, cost: 65.00, description: '<10,000 CFU/mL', sample_type: 'Urine', turnaround_time_hours: 48 },
            { test_code: 'TCX001', test_name: 'Throat Culture', category_id: 3, cost: 45.00, description: 'Normal flora', sample_type: 'Throat Swab', turnaround_time_hours: 48 },
            { test_code: 'SCX001', test_name: 'Stool Culture', category_id: 3, cost: 85.00, description: 'Normal flora, no pathogens', sample_type: 'Stool', turnaround_time_hours: 72 },

            // Immunology Tests
            { test_code: 'COV001', test_name: 'COVID-19 Antibody', category_id: 4, cost: 85.00, description: 'Negative', sample_type: 'Blood', turnaround_time_hours: 24 },
            { test_code: 'HEP001', test_name: 'Hepatitis B Panel', category_id: 4, cost: 120.00, description: 'HBsAg: Negative, Anti-HBs: Negative', sample_type: 'Blood', turnaround_time_hours: 24 },
            { test_code: 'HIV001', test_name: 'HIV 1/2 Antibody', category_id: 4, cost: 75.00, description: 'Negative', sample_type: 'Blood', turnaround_time_hours: 24 },

            // Clinical Pathology
            { test_code: 'URI001', test_name: 'Urinalysis', category_id: 6, cost: 35.00, description: 'Clear, yellow, specific gravity: 1.003-1.030', sample_type: 'Urine', turnaround_time_hours: 2 }
        ];

        for (const test of labTests) {
            await sql`INSERT INTO lab_tests (test_code, test_name, category_id, cost, description, sample_type, turnaround_time_hours) 
                     VALUES (${test.test_code}, ${test.test_name}, ${test.category_id}, ${test.cost}, ${test.description}, ${test.sample_type}, ${test.turnaround_time_hours})`;
        }

        // Insert sample lab orders
        const labOrders = [
            { order_number: 'LAB001', patient_id: 1, doctor_id: 1, priority: 'high', status: 'completed', clinical_notes: 'Patient with chest pain, rule out cardiac event', order_date: '2024-11-25 09:00:00' },
            { order_number: 'LAB002', patient_id: 2, doctor_id: 1, priority: 'normal', status: 'in_progress', clinical_notes: 'Diabetes monitoring - 3 month follow-up', order_date: '2024-11-28 14:30:00' },
            { order_number: 'LAB003', patient_id: 3, doctor_id: 2, priority: 'high', status: 'pending', clinical_notes: 'Cardiac risk assessment for surgery clearance', order_date: '2024-11-29 08:15:00' },
            { order_number: 'LAB004', patient_id: 4, doctor_id: 1, priority: 'normal', status: 'completed', clinical_notes: 'Annual physical examination labs', order_date: '2024-11-20 11:00:00' },
            { order_number: 'LAB005', patient_id: 5, doctor_id: 2, priority: 'normal', status: 'completed', clinical_notes: 'Liver function monitoring - medication side effects', order_date: '2024-11-22 16:45:00' },
            { order_number: 'LAB006', patient_id: 6, doctor_id: 1, priority: 'normal', status: 'in_progress', clinical_notes: 'Thyroid function evaluation', order_date: '2024-11-27 10:20:00' },
            { order_number: 'LAB007', patient_id: 7, doctor_id: 2, priority: 'urgent', status: 'urgent', clinical_notes: 'Suspected bacterial infection - fever workup', order_date: '2024-11-29 06:30:00' },
            { order_number: 'LAB008', patient_id: 8, doctor_id: 1, priority: 'normal', status: 'scheduled', clinical_notes: 'Preventive screening package', order_date: '2024-11-30 09:00:00' }
        ];

        const orderIds = [];
        for (const order of labOrders) {
            const result = await sql`INSERT INTO lab_orders (order_number, patient_id, doctor_id, priority, status, clinical_notes, order_date) 
                                   VALUES (${order.order_number}, ${order.patient_id}, ${order.doctor_id}, ${order.priority}, ${order.status}, ${order.clinical_notes}, ${order.order_date}) 
                                   RETURNING id`;
            orderIds.push(result[0].id);
        }

        // Get lab test IDs for creating order items
        const tests = await sql`SELECT id, test_name FROM lab_tests ORDER BY id`;

        // Insert lab order items (tests associated with each order)
        const orderItems = [
            // Order 1 (John Smith - Cardiac workup)
            { order_id: orderIds[0], test_id: tests.find(t => t.test_name.includes('CBC')).id },
            { order_id: orderIds[0], test_id: tests.find(t => t.test_name.includes('BMP')).id },
            { order_id: orderIds[0], test_id: tests.find(t => t.test_name.includes('Lipid')).id },
            { order_id: orderIds[0], test_id: tests.find(t => t.test_name.includes('Liver')).id },

            // Order 2 (Sarah Johnson - Diabetes monitoring)
            { order_id: orderIds[1], test_id: tests.find(t => t.test_name.includes('A1C')).id },
            { order_id: orderIds[1], test_id: tests.find(t => t.test_name.includes('CMP')).id },
            { order_id: orderIds[1], test_id: tests.find(t => t.test_name.includes('Lipid')).id },

            // Order 3 (Michael Brown - Cardiac risk)
            { order_id: orderIds[2], test_id: tests.find(t => t.test_name.includes('CBC')).id },
            { order_id: orderIds[2], test_id: tests.find(t => t.test_name.includes('CMP')).id },
            { order_id: orderIds[2], test_id: tests.find(t => t.test_name.includes('Lipid')).id },
            { order_id: orderIds[2], test_id: tests.find(t => t.test_name.includes('PT')).id },

            // Order 4 (Emily Davis - Annual physical)
            { order_id: orderIds[3], test_id: tests.find(t => t.test_name.includes('CBC')).id },
            { order_id: orderIds[3], test_id: tests.find(t => t.test_name.includes('CMP')).id },
            { order_id: orderIds[3], test_id: tests.find(t => t.test_name.includes('Urinalysis')).id },

            // Order 5 (Robert Wilson - Liver monitoring)
            { order_id: orderIds[4], test_id: tests.find(t => t.test_name.includes('Liver')).id },
            { order_id: orderIds[4], test_id: tests.find(t => t.test_name.includes('CBC')).id },
            { order_id: orderIds[4], test_id: tests.find(t => t.test_name.includes('CMP')).id },

            // Order 6 (Lisa Anderson - Thyroid)
            { order_id: orderIds[5], test_id: tests.find(t => t.test_name.includes('Thyroid')).id },
            { order_id: orderIds[5], test_id: tests.find(t => t.test_name.includes('CBC')).id },

            // Order 7 (David Miller - Infection workup)
            { order_id: orderIds[6], test_id: tests.find(t => t.test_name.includes('Blood Culture')).id },
            { order_id: orderIds[6], test_id: tests.find(t => t.test_name.includes('CBC')).id },
            { order_id: orderIds[6], test_id: tests.find(t => t.test_name.includes('CMP')).id },
            { order_id: orderIds[6], test_id: tests.find(t => t.test_name.includes('Urine Culture')).id },

            // Order 8 (Jennifer Taylor - Preventive)
            { order_id: orderIds[7], test_id: tests.find(t => t.test_name.includes('CBC')).id },
            { order_id: orderIds[7], test_id: tests.find(t => t.test_name.includes('CMP')).id },
            { order_id: orderIds[7], test_id: tests.find(t => t.test_name.includes('Lipid')).id },
            { order_id: orderIds[7], test_id: tests.find(t => t.test_name.includes('Thyroid')).id }
        ];

        for (const item of orderItems) {
            await sql`INSERT INTO lab_order_items (order_id, test_id) VALUES (${item.order_id}, ${item.test_id})`;
        }

        console.log('✅ Laboratory sample data inserted successfully!');
        console.log(`- ${categories.length} lab test categories`);
        console.log(`- ${labTests.length} lab tests`);
        console.log(`- ${labOrders.length} lab orders`);
        console.log(`- ${orderItems.length} order items`);

    } catch (error) {
        console.error('Error inserting laboratory sample data:', error);
        throw error;
    }
}

// Execute the function
insertLabSampleData()
    .then(() => {
        console.log('Sample data insertion completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to insert sample data:', error);
        process.exit(1);
    });

export { insertLabSampleData };