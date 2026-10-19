import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkOrders() {
    console.log('--- Recent Lab Orders ---');
    const { data: orders, error } = await supabase
        .from('lab_orders')
        .select('id, order_number, patient_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    for (const order of orders) {
        const { data: items } = await supabase
            .from('lab_order_items')
            .select('id, status')
            .eq('order_id', order.id);
        
        console.log(`Order: ${order.order_number} | Patient: ${order.patient_id} | Status: ${order.status} | Created: ${order.created_at} | Items: ${items?.length || 0}`);
    }
}

checkOrders();
