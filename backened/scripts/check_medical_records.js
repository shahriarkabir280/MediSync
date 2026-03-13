import { supabase } from '../config/db.js';

const { data, error } = await supabase
    .from('medical_records')
    .select('id, file_name, file_type')
    .order('created_at', { ascending: false })
    .limit(20);

if (error) { console.error(error); process.exit(1); }

console.log(`\nLast ${data.length} records in medical_records:\n`);
data.forEach(r => console.log(`  id=${r.id}  type="${r.file_type}"  name="${r.file_name}"`));
