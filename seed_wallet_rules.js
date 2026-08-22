import { supabase } from './backend/config/db.js';

const seedRules = async () => {
    console.log('Seeding Revenue Split Rules...');
    
    const rules = [
        { service_type: 'consultation', doctor_percentage: 70.00, clinic_percentage: 30.00, referral_percentage: 0.00 },
        { service_type: 'lab_test', doctor_percentage: 15.00, clinic_percentage: 85.00, referral_percentage: 15.00 }
    ];

    for (const rule of rules) {
        const { error } = await supabase
            .from('revenue_split_rules')
            .upsert(rule, { onConflict: 'service_type' });
        
        if (error) {
            console.error(`Failed to seed ${rule.service_type}:`, error);
        } else {
            console.log(`Successfully seeded/updated rule for ${rule.service_type}`);
        }
    }
    
    console.log('Seeding completed.');
    process.exit();
};

seedRules();
