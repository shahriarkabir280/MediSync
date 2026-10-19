import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/db.js';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Tried in order when GEMINI_MODEL is retired (404), overloaded (429/503), or unreachable
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
const RETRY_ROUNDS = 2;
const RETRY_DELAY_MS = 1500;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isRetryableModelError = (error) => [404, 429, 500, 503].includes(error?.status) ||
  /\[(404|429|500|503) |fetch failed|ECONNRESET|ETIMEDOUT/.test(error?.message || '');

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
            lab_results (result_value, result_text, reference_range, unit, status, abnormal_flag, critical_flag, notes, verified_by, result_date, file_name)
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
                  const unit = resObj.unit || item.lab_tests?.unit || '';
                  const refSpan = resObj.reference_range || (item.lab_tests?.normal_range_min != null ? `${item.lab_tests.normal_range_min} - ${item.lab_tests.normal_range_max}` : 'N/A');
                  // Many reports arrive only as an uploaded PDF; say so instead of passing "null" to the model
                  const hasValue = resObj.result_value !== null && resObj.result_value !== undefined && resObj.result_value !== '';
                  const valStr = hasValue ? `${resObj.result_value} ${unit}`.trim()
                    : resObj.result_text ? resObj.result_text
                    : resObj.file_name ? 'Values not entered in the system; the full report is attached as a PDF'
                    : 'No value recorded';

                  patientContext += `\n    Result: ${flagStr}${valStr} (Ref: ${refSpan})`;
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

    // 4. System prompt. Models are tried in order: Google retires older models for new API keys
    // and the newest ones are sometimes overloaded (503), so fall back instead of failing.
    const systemInstruction = `You are MediSync Clinical AI, an advanced, highly intelligent medical assistant designed to help doctors interpret lab results, analyze patient histories, and make clinical decisions.
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
${patientContext}`;
    const modelNames = [...new Set([process.env.GEMINI_MODEL || 'gemini-3.8-flash', ...FALLBACK_MODELS])];

    // 5. Format history for Google Generative AI
    // Gemini history format is { role: 'user' | 'model', parts: [{text: '...'}...]}
    // Gemini requires the history to start with a user turn, so drop any leading model messages
    const formattedHistory = history
      .filter(msg => typeof msg?.text === 'string' && msg.text.trim())
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
    while (formattedHistory.length && formattedHistory[0].role !== 'user') formattedHistory.shift();

    // 6. Send the message, falling back to the next model if one is unavailable,
    //    and retrying the whole list once if every model is busy
    let text;
    let lastError;
    for (let round = 0; round < RETRY_ROUNDS && text === undefined; round++) {
      if (round > 0) await sleep(RETRY_DELAY_MS);

      for (const modelName of modelNames) {
        try {
          const chat = genAI.getGenerativeModel({ model: modelName, systemInstruction }).startChat({
            history: formattedHistory,
            generationConfig: {
              temperature: 0.2, // Keep it grounded and factual
              // Newer Gemini models spend output tokens on internal reasoning first;
              // a 1024 limit left ~40 tokens for the answer and cut replies off mid-sentence
              maxOutputTokens: 8192,
            },
          });
          const result = await chat.sendMessage(message);
          text = result.response.text();
          break;
        } catch (error) {
          lastError = error;
          if (!isRetryableModelError(error)) throw error;
          console.warn(`Gemini model ${modelName} unavailable (${error.status || error.message}); trying next`);
        }
      }
    }
    if (text === undefined) {
      return res.status(503).json({
        error: 'The AI service is busy right now. Please try again in a moment.',
        details: lastError?.message
      });
    }

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
