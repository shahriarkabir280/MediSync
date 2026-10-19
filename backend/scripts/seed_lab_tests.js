import { supabase } from '../config/db.js';

async function seed() {
  console.log('Starting lab test seeding...');

  try {
    // 1. Define Categories
    const categoriesData = [
      { name: 'Hematology', description: 'Comprehensive blood component analysis' },
      { name: 'Biochemistry', description: 'Metabolic and chemical markers' },
      { name: 'Immunology & Serology', description: 'Immune response and infectious markers' },
      { name: 'Endocrinology', description: 'Hormonal and endocrine system studies' },
      { name: 'Microbiology', description: 'Pathogen detection and culture' },
      { name: 'Toxicology', description: 'Drug and toxin screening' },
      { name: 'Molecular Biology', description: 'Genetic and PCR based testing' },
      { name: 'Urinalysis', description: 'Kidney and urinary tract health' }
    ];

    console.log('Seeding categories...');
    const { data: categories, error: catError } = await supabase
      .from('lab_test_categories')
      .upsert(categoriesData, { onConflict: 'name' })
      .select();

    if (catError) throw catError;
    console.log(`Successfully seeded ${categories.length} categories.`);

    const catMap = categories.reduce((acc, cat) => {
      acc[cat.name] = cat.id;
      return acc;
    }, {});

    // 2. Define Tests
    const testsData = [
      // Hematology
      { test_code: 'CBC', test_name: 'Complete Blood Count', category_id: catMap['Hematology'], cost: 450, sample_type: 'Whole Blood (EDTA)', turnaround_time_hours: 4, normal_range_min: '4.5', normal_range_max: '11.0', unit: '10^3/uL' },
      { test_code: 'HGB', test_name: 'Hemoglobin', category_id: catMap['Hematology'], cost: 150, sample_type: 'Whole Blood (EDTA)', turnaround_time_hours: 2, normal_range_min: '12.0', normal_range_max: '16.0', unit: 'g/dL' },
      { test_code: 'ESR', test_name: 'Erythrocyte Sedimentation Rate', category_id: catMap['Hematology'], cost: 200, sample_type: 'Whole Blood (Citrate)', turnaround_time_hours: 2, normal_range_min: '0', normal_range_max: '20', unit: 'mm/hr' },
      { test_code: 'PLT', test_name: 'Platelet Count', category_id: catMap['Hematology'], cost: 150, sample_type: 'Whole Blood (EDTA)', turnaround_time_hours: 2, normal_range_min: '150', normal_range_max: '450', unit: '10^3/uL' },
      { test_code: 'RETIC', test_name: 'Reticulocyte Count', category_id: catMap['Hematology'], cost: 350, sample_type: 'Whole Blood (EDTA)', turnaround_time_hours: 6, normal_range_min: '0.5', normal_range_max: '2.5', unit: '%' },

      // Biochemistry
      { test_code: 'FBS', test_name: 'Fasting Blood Sugar', category_id: catMap['Biochemistry'], cost: 120, sample_type: 'Plasma (Fluoride)', turnaround_time_hours: 4, normal_range_min: '70', normal_range_max: '100', unit: 'mg/dL' },
      { test_code: 'PPBS', test_name: 'Post Prandial Blood Sugar', category_id: catMap['Biochemistry'], cost: 120, sample_type: 'Plasma (Fluoride)', turnaround_time_hours: 4, normal_range_min: '70', normal_range_max: '140', unit: 'mg/dL' },
      { test_code: 'HBA1C', test_name: 'HbA1c (Glycated Hemoglobin)', category_id: catMap['Biochemistry'], cost: 550, sample_type: 'Whole Blood (EDTA)', turnaround_time_hours: 24, normal_range_min: '4.0', normal_range_max: '5.6', unit: '%' },
      { test_code: 'LIPID', test_name: 'Lipid Profile', category_id: catMap['Biochemistry'], cost: 850, sample_type: 'Serum', turnaround_time_hours: 8, description: 'Total Cholesterol, HDL, LDL, Triglycerides', unit: 'mg/dL' },
      { test_code: 'LFT', test_name: 'Liver Function Test', category_id: catMap['Biochemistry'], cost: 750, sample_type: 'Serum', turnaround_time_hours: 6, description: 'SGOT, SGPT, Bilirubin, Protein', unit: 'U/L' },
      { test_code: 'KFT', test_name: 'Kidney Function Test', category_id: catMap['Biochemistry'], cost: 650, sample_type: 'Serum', turnaround_time_hours: 6, description: 'Urea, Creatinine, Uric Acid', unit: 'mg/dL' },
      { test_code: 'CREAT', test_name: 'Serum Creatinine', category_id: catMap['Biochemistry'], cost: 180, sample_type: 'Serum', turnaround_time_hours: 4, normal_range_min: '0.6', normal_range_max: '1.2', unit: 'mg/dL' },
      { test_code: 'UREA', test_name: 'Blood Urea', category_id: catMap['Biochemistry'], cost: 180, sample_type: 'Serum', turnaround_time_hours: 4, normal_range_min: '15', normal_range_max: '45', unit: 'mg/dL' },

      // Immunology & Serology
      { test_code: 'CRP', test_name: 'C-Reactive Protein', category_id: catMap['Immunology & Serology'], cost: 450, sample_type: 'Serum', turnaround_time_hours: 4, normal_range_min: '0', normal_range_max: '6', unit: 'mg/L' },
      { test_code: 'RA', test_name: 'RA Factor (Quantitative)', category_id: catMap['Immunology & Serology'], cost: 550, sample_type: 'Serum', turnaround_time_hours: 8, normal_range_min: '0', normal_range_max: '15', unit: 'IU/mL' },
      { test_code: 'ASO', test_name: 'ASO Titer', category_id: catMap['Immunology & Serology'], cost: 500, sample_type: 'Serum', turnaround_time_hours: 8, normal_range_min: '0', normal_range_max: '200', unit: 'IU/mL' },
      { test_code: 'VDRL', test_name: 'VDRL (Syphilis Screening)', category_id: catMap['Immunology & Serology'], cost: 300, sample_type: 'Serum', turnaround_time_hours: 12, unit: 'Titer' },
      { test_code: 'HIV', test_name: 'HIV 1 & 2 antibodies', category_id: catMap['Immunology & Serology'], cost: 650, sample_type: 'Serum', turnaround_time_hours: 12, unit: 'Index' },

      // Endocrinology
      { test_code: 'TFT', test_name: 'Thyroid Function Test (3 Params)', category_id: catMap['Endocrinology'], cost: 650, sample_type: 'Serum', turnaround_time_hours: 8, description: 'T3, T4, TSH', unit: 'uIU/mL' },
      { test_code: 'TSH', test_name: 'TSH (Thyroid Stimulating Hormone)', category_id: catMap['Endocrinology'], cost: 350, sample_type: 'Serum', turnaround_time_hours: 6, normal_range_min: '0.35', normal_range_max: '4.94', unit: 'uIU/mL' },
      { test_code: 'VITB12', test_name: 'Vitamin B12', category_id: catMap['Endocrinology'], cost: 1200, sample_type: 'Serum', turnaround_time_hours: 24, normal_range_min: '200', normal_range_max: '900', unit: 'pg/mL' },
      { test_code: 'VITD', test_name: 'Vitamin D (25-Hydroxy)', category_id: catMap['Endocrinology'], cost: 1500, sample_type: 'Serum', turnaround_time_hours: 24, normal_range_min: '30', normal_range_max: '100', unit: 'ng/mL' },

      // Urinalysis
      { test_code: 'URA', test_name: 'Urine Routine Examination', category_id: catMap['Urinalysis'], cost: 150, sample_type: 'Midstream Urine', turnaround_time_hours: 2, description: 'Physical, Chemical & Microscopic' },
      { test_code: 'UPC', test_name: 'Urine Culture & Sensitivity', category_id: catMap['Urinalysis'], cost: 850, sample_type: 'Sterile Urine', turnaround_time_hours: 48 },
      
      // Microbiology
      { test_code: 'BC', test_name: 'Blood Culture', category_id: catMap['Microbiology'], cost: 1200, sample_type: 'Whole Blood (Culture Bottle)', turnaround_time_hours: 72 },
      { test_code: 'GRAM', test_name: 'Gram Stain', category_id: catMap['Microbiology'], cost: 250, sample_type: 'Swab/Fluids', turnaround_time_hours: 4 },
      
      // Toxiclogy
      { test_code: 'DRUG', test_name: 'Drug Screen (10 Panels)', category_id: catMap['Toxicology'], cost: 2500, sample_type: 'Urine', turnaround_time_hours: 24 }
    ];

    console.log('Seeding tests...');
    const { data: tests, error: testError } = await supabase
      .from('lab_tests')
      .upsert(testsData, { onConflict: 'test_code' })
      .select();

    if (testError) throw testError;
    console.log(`Successfully seeded ${tests.length} tests.`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
