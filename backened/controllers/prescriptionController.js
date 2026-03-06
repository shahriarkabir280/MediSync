import { supabase } from '../config/db.js';

// Create a new prescription with items
export const createPrescription = async (req, res) => {
    try {
        const {
            patient_id,
            doctor_id,
            chief_complaints,
            clinical_history,
            physical_examination,
            investigations,
            diagnosis,
            advice,
            vitals_weight,
            next_visit_date,
            custom_letterhead,
            prescription_items
        } = req.body;

        if (!patient_id || !doctor_id) {
            return res.status(400).json({ error: 'Patient ID and Doctor ID are required' });
        }

        // 1. Insert main prescription
        const { data: prescription, error: prescriptionError } = await supabase
            .from('prescriptions')
            .insert({
                patient_id,
                doctor_id,
                chief_complaints,
                clinical_history,
                physical_examination,
                investigations,
                diagnosis,
                advice,
                vitals_weight,
                next_visit_date,
                custom_letterhead
            })
            .select()
            .single();

        if (prescriptionError) throw prescriptionError;

        // 2. Insert prescription items if they exist
        if (prescription_items && prescription_items.length > 0) {
            const itemsToInsert = prescription_items.map(item => ({
                prescription_id: prescription.id,
                medicine_type: item.medicine_type,
                medicine_name: item.medicine_name,
                dosage: item.dosage,
                duration: item.duration,
                instructions: item.instructions
            }));

            const { error: itemsError } = await supabase
                .from('prescription_items')
                .insert(itemsToInsert);

            if (itemsError) {
                // Consider rolling back the main prescription here in a real production environment
                console.error("Failed to insert items:", itemsError);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Prescription created successfully',
            data: prescription
        });

    } catch (error) {
        console.error('Error creating prescription:', error);
        res.status(500).json({ error: 'Failed to create prescription' });
    }
};

// Get all prescriptions for a specific patient
export const getPatientPrescriptions = async (req, res) => {
    try {
        const { patientId } = req.params;

        const { data: prescriptions, error } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctors (
                    first_name, last_name, specialization
                ),
                prescription_items (*)
            `)
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Flatten doctor details for easier frontend consumption
        const flattened = prescriptions.map(p => ({
            ...p,
            doctor_name: p.doctors ? `${p.doctors.first_name} ${p.doctors.last_name}` : null,
            doctor_specialization: p.doctors?.specialization,
            doctors: undefined // remove nested object
        }));

        res.json({ success: true, data: flattened });

    } catch (error) {
        console.error('Error fetching patient prescriptions:', error);
        res.status(500).json({ error: 'Failed to fetch prescriptions' });
    }
};

// Get a single prescription by its ID
export const getPrescriptionById = async (req, res) => {
    try {
        const { prescriptionId } = req.params;

        const { data: prescription, error } = await supabase
            .from('prescriptions')
            .select(`
                *,
                doctors (
                    first_name, last_name, specialization, email, phone, qualifications, license_number, chamber_address, hospital_name, clinic_name
                ),
                patients (
                    first_name, last_name, date_of_birth, gender
                ),
                prescription_items (*)
            `)
            .eq('id', prescriptionId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Prescription not found' });
            }
            throw error;
        }

        // Flatten related entities for frontend
        const flattened = {
            ...prescription,
            doctor: prescription.doctors,
            patient: prescription.patients,
            doctors: undefined,
            patients: undefined
        };

        res.json({ success: true, data: flattened });

    } catch (error) {
        console.error('Error fetching prescription detail:', error);
        res.status(500).json({ error: 'Failed to fetch prescription details' });
    }
};
