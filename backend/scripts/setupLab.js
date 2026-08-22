#!/usr/bin/env node

const { createLabSchema } = require('../config/createLabSchema');
const { insertLabSampleData } = require('../sampleData/labSampleData');

async function setupCompleteLabSystem() {
    console.log('🏥 Setting up complete laboratory system...\n');
    
    try {
        // Step 1: Create lab schema
        console.log('📋 Step 1: Creating laboratory database schema...');
        await createLabSchema();
        console.log('✅ Database schema created successfully!\n');
        
        // Step 2: Insert sample data
        console.log('📊 Step 2: Inserting laboratory sample data...');
        await insertLabSampleData();
        console.log('✅ Sample data inserted successfully!\n');
        
        console.log('🎉 Laboratory system setup completed!');
        console.log('\nYour laboratory system now includes:');
        console.log('• Complete database schema with 6 tables');
        console.log('• 27 different lab tests across 6 categories');
        console.log('• Sample patient data with 8 lab orders');
        console.log('• Realistic lab results with normal and abnormal findings');
        console.log('• Priority-based workflow management');
        console.log('\n💡 You can now:');
        console.log('• View patient lab reports in the Laboratory tab');
        console.log('• Create new lab orders');
        console.log('• Review urgent and pending results');
        console.log('• Use AI clinical decision support');
        console.log('• Generate comprehensive lab reports');
        
    } catch (error) {
        console.error('❌ Error setting up laboratory system:', error);
        console.error('\n💡 Make sure PostgreSQL is running and database credentials are correct.');
        process.exit(1);
    }
}

// Run the setup
setupCompleteLabSystem();