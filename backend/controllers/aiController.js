import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/db.js';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const labAiChat = async (req, res) => {
  try {
    const { patientId, message, history = [] } = req.body;

    if (!patientId || !message) {
      return res.status(400).json({ error: 'Patient ID and message are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key is not configured' });
    }

    // 1. Fetch Patient Info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('first_name, last_name, gender, date_of_birth, blood_group, unique_id, medical_history')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Calculate age
    let age = 'Unknown';
    if (patient.date_of_birth) {
      const diffMs = Date.now() - new Date(patient.date_of_birth).getTime();
      const ageDate = new Date(diffMs);
      age = Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    // 2. Fetch Recent Lab Orders and Results
    // Only fetch completed or in_progress orders with their items and results
    const { data: orders, error: ordersError } = await supabase
      .from('lab_orders')
      .select(`
        id, order_number, order_date, status, priority, clinical_notes,
        doctor:doctors(first_name, last_name, specialization),
        lab_order_items (
            status,
            lab_tests (test_name, test_code, normal_range_min, normal_range_max, unit, description),
            lab_results (result_value, result_text, reference_range, unit, status, abnormal_flag, critical_flag, notes, verified_by, result_date)
        )
      `)
      .eq('patient_id', patientId)
      .order('order_date', { ascending: false })
      .limit(5); // Get last 5 orders for context

    if (ordersError) {
      console.error('Error fetching patient lab history:', ordersError);
    }

    // 3. Construct the clinical context string
    let patientContext = `PATIENT PROFILE:
Name: ${patient.first_name} ${patient.last_name}
Age: ${age}
Gender: ${patient.gender || 'Unknown'}
Blood Group: ${patient.blood_group || 'Unknown'}
Medical History: ${patient.medical_history || 'None recorded'}

RECENT LAB ORDERS & RESULTS:
`;

    if (!orders || orders.length === 0) {
      patientContext += "No recent lab orders found for this patient.\n";
    } else {
      orders.forEach(order => {
        const docName = order.doctor ? `Dr. ${order.doctor.first_name} ${order.doctor.last_name}` : 'Unknown';
        patientContext += `\n--- Order ${order.order_number} (${new Date(order.order_date).toLocaleDateString()}) - Priority: ${order.priority} ---
Status: ${order.status.toUpperCase()}
Ordered By: ${docName}
Clinical Notes: ${order.clinical_notes || 'None'}
Tests:
`;
        if (order.lab_order_items && order.lab_order_items.length > 0) {
          order.lab_order_items.forEach(item => {
            const testName = item.lab_tests?.test_name || 'Unknown Test';
            patientContext += `  - ${testName} (${item.status}):`;
            
            if (item.lab_results) {
              const resultsArray = Array.isArray(item.lab_results) ? item.lab_results : [item.lab_results];
              
              if (resultsArray.length > 0) {
                  const resObj = resultsArray[0];
                  const isAbnormal = resObj.abnormal_flag || resObj.critical_flag || resObj.status !== 'normal';
                  const flagStr = resObj.critical_flag ? '[CRITICAL] ' : (resObj.abnormal_flag ? '[ABNORMAL] ' : '');
                  const valStr = resObj.result_value !== null ? resObj.result_value : resObj.result_text;
                  const unit = resObj.unit || item.lab_tests?.unit || '';
                  const refSpan = resObj.reference_range || (item.lab_tests?.normal_range_min != null ? `${item.lab_tests.normal_range_min} - ${item.lab_tests.normal_range_max}` : 'N/A');
                  
                  patientContext += `\n    Result: ${flagStr}${valStr} ${unit} (Ref: ${refSpan})`;
                  if (resObj.notes) patientContext += `\n    Notes: ${resObj.notes}`;
              } else {
                  patientContext += ` No results published yet.`;
              }
            } else {
              patientContext += ` No results published yet.`;
            }
            patientContext += `\n`;
          });
        } else {
          patientContext += `  No tests recorded.\n`;
        }
      });
    }

    // 4. Set up Gemini model and system prompt
    // Use gemini-2.5-flash since it's the latest and extremely capable and fast
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are CareConnect Clinical AI, an advanced, highly intelligent medical assistant designed to help doctors interpret lab results, analyze patient histories, and make clinical decisions.
You are chatting directly with the attending doctor. 

Guidelines:
1. ALWAYS be highly professional, precise, and concise. You are talking to a medical doctor.
2. If the doctor asks for a summary, provide a brief, structured overview of the most recent results.
3. If they ask for trends, compare recent values to older values if available in the context.
4. HIGHLIGHT any abnormal or [CRITICAL] values clearly.
5. Provide actionable, evidence-based clinical suggestions if asked, BUT always include a disclaimer that the final decision rests with the doctor.
6. Use markdown formatting for readability (bolding important metrics, using bullet points).
7. Base your answers strictly on the patient context provided below. Do not hallucinate data.

CURRENT CONTEXT:
${patientContext}`
    });

    // 5. Format history for Google Generative AI
    // Gemini history format is { role: 'user' | 'model', parts: [{text: '...'}...]}
    const formattedHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Start chat
    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        temperature: 0.2, // Keep it grounded and factual
        maxOutputTokens: 1024,
      },
    });

    // 6. Send the message and get the response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      reply: text
    });

  } catch (error) {
    console.error('Error in Lab AI Chat:', error);
    res.status(500).json({ 
      error: 'Failed to process AI request',
      details: error.message 
    });
  }
};
