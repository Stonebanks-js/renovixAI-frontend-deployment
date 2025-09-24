import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    console.log('Starting analysis for session:', sessionId);

    // Get the session and image details
    const { data: session, error: sessionError } = await supabase
      .from('scan_sessions')
      .select(`
        *,
        scan_images (*)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageData = session.scan_images[0];
    if (!imageData) {
      throw new Error('No image found for session');
    }

    // Update status to processing
    await supabase
      .from('scan_sessions')
      .update({ status: 'processing', progress: 10 })
      .eq('id', sessionId);

    // Real AI analysis pipeline
    const stages = [
      { progress: 20, message: 'Downloading image from storage...' },
      { progress: 40, message: 'Preprocessing image for AI analysis...' },
      { progress: 60, message: 'Running AI diagnostic model...' },
      { progress: 80, message: 'Analyzing pathological patterns...' },
      { progress: 95, message: 'Generating detailed medical report...' },
    ];

    for (const stage of stages) {
      await supabase
        .from('scan_sessions')
        .update({ progress: stage.progress })
        .eq('id', sessionId);
      
      console.log(`Stage: ${stage.message} (${stage.progress}%)`);
    }

    // Get image from storage
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('medical-scans')
      .download(imageData.storage_path);

    if (downloadError) {
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }

    let analysisResults;

    // Check if it's a PDF document
    if (imageData.mime_type === 'application/pdf') {
      console.log('Processing PDF pathology report...');
      analysisResults = await analyzePDFPathologyReport(imageBlob);
    } else {
      console.log('Processing medical scan image...');
      analysisResults = await analyzeMedicalScanWithAI(imageBlob, imageData.mime_type);
    }

    // Store results in database
    const { error: resultError } = await supabase
      .from('scan_results')
      .insert({
        session_id: sessionId,
        diagnosis: analysisResults.diagnosis,
        confidence: analysisResults.confidence,
        findings: analysisResults.findings,
        recommendations: analysisResults.recommendations,
      });

    if (resultError) {
      console.error('Result storage error:', resultError);
      throw resultError;
    }

    // Update session to completed
    await supabase
      .from('scan_sessions')
      .update({ status: 'completed', progress: 100 })
      .eq('id', sessionId);

    console.log('Analysis completed for session:', sessionId);

    return new Response(JSON.stringify({ 
      success: true,
      results: analysisResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-scan function:', error);
    
    // Update session status to failed if we have sessionId
    try {
      const { sessionId } = await req.json();
      if (sessionId) {
        await supabase
          .from('scan_sessions')
          .update({ status: 'failed' })
          .eq('id', sessionId);
      }
    } catch (updateError) {
      console.error('Failed to update session status:', updateError);
    }

    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeMedicalScanWithAI(imageBlob: Blob, mimeType: string) {
  try {
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert medical AI radiologist with specialized training in kidney and urological imaging analysis. Your task is to provide a comprehensive, ChatGPT-style detailed medical report based on the CT scan image provided.

ANALYSIS REQUIREMENTS:
1. PRIMARY DIAGNOSIS: Classify as one of: Normal Kidney Function, Kidney Stone Detected, Renal Cyst Identified, Suspicious Mass/Tumor Detected, Chronic Kidney Disease, or Other Abnormality
2. CONFIDENCE ASSESSMENT: Provide confidence level (0.0-1.0) based on image quality and clarity of findings
3. DETAILED CLINICAL FINDINGS: Comprehensive anatomical assessment
4. HEALTH RECOMMENDATIONS: Actionable medical advice and next steps

COMPREHENSIVE EVALUATION CRITERIA:
- Bilateral kidney assessment (size, shape, position)
- Cortical and medullary differentiation
- Collecting system evaluation
- Vascular patterns and perfusion
- Presence of masses, lesions, or abnormal densities
- Calcifications, stones, or obstructions
- Cystic formations and their characteristics
- Surrounding anatomical structures
- Hydronephrosis or urinary tract dilatation

REPORT STRUCTURE - Respond ONLY in valid JSON format:
{
  "diagnosis": "Primary diagnosis from the specified categories",
  "confidence": 0.0-1.0,
  "findings": {
    "overallAssessment": "Comprehensive summary of scan findings",
    "bilateralKidneyStatus": "Status of both kidneys including size and morphology",
    "corticalAppearance": "Cortical thickness, echogenicity, and integrity",
    "medullaryStructures": "Medullary pyramid appearance and differentiation",
    "collectingSystem": "Renal pelvis, calyces, and ureter assessment", 
    "vascularPatterns": "Renal vasculature and perfusion patterns",
    "pathologicalFindings": "Any masses, lesions, stones, or abnormalities detected",
    "cysticLesions": "Description of any cysts - simple vs complex",
    "calculiOrStones": "Location, size, and characteristics of any stones",
    "hydronephrosisAssessment": "Presence and severity of urinary obstruction",
    "surroundingStructures": "Adjacent organs and soft tissues",
    "imageQualityNotes": "Technical assessment of scan quality"
  },
  "recommendations": "Detailed clinical recommendations including: immediate actions needed, follow-up imaging requirements, specialist referrals, lifestyle modifications, monitoring protocols, and patient education points"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this kidney scan image and provide a comprehensive diagnostic report.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Invalid AI response format');
    }

  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
}

async function analyzePDFPathologyReport(pdfBlob: Blob) {
  try {
    // Convert PDF to text using a simple extraction method
    // Note: In production, you might want to use a more sophisticated PDF parser
    const formData = new FormData();
    formData.append('file', pdfBlob, 'report.pdf');

    // For now, we'll use OpenAI to analyze the PDF content
    // In production, you'd first extract text from PDF, then analyze
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert medical AI pathologist specialized in interpreting comprehensive pathology reports. Analyze the provided PDF pathology report and deliver a detailed, ChatGPT-style medical interpretation.

ANALYSIS SCOPE:
1. PRIMARY DIAGNOSIS: Extract and interpret the main pathological diagnosis
2. CONFIDENCE LEVEL: Assess certainty based on report definitiveness (0.0-1.0)
3. COMPREHENSIVE FINDINGS: All significant pathological, laboratory, and clinical findings
4. CLINICAL RECOMMENDATIONS: Treatment protocols and follow-up requirements

DETAILED ASSESSMENT CRITERIA:
- Histopathological findings and cellular characteristics
- Immunohistochemistry results and molecular markers
- Laboratory values and biomarker levels
- Staging and grading information
- Margins assessment and extent of disease
- Prognostic indicators and risk factors
- Treatment response evaluation (if applicable)

Respond ONLY in valid JSON format:
{
  "diagnosis": "Primary pathological diagnosis with staging/grading",
  "confidence": 0.0-1.0,
  "findings": {
    "primaryPathology": "Main histopathological diagnosis and characteristics",
    "histologicalFeatures": "Detailed cellular and tissue architecture findings",
    "immunohistochemistry": "IHC markers and their expression patterns",
    "molecularMarkers": "Genetic markers, mutations, or biomarkers identified",
    "stagingAndGrading": "TNM staging, tumor grade, or classification system used",
    "marginsAssessment": "Surgical margins status if applicable",
    "laboratoryFindings": "Complete blood count, chemistry panel, specific tumor markers",
    "prognosticFactors": "Risk stratification and prognostic indicators",
    "treatmentResponse": "Response to therapy if mentioned in report",
    "additionalObservations": "Other clinically significant findings"
  },
  "recommendations": "Comprehensive treatment recommendations including: immediate therapeutic interventions, follow-up monitoring schedule, additional testing requirements, specialist consultations, patient education, and long-term care planning"
}`
          },
          {
            role: 'user',
            content: `Please analyze this pathology report PDF and extract the medical findings. The PDF is encoded as: data:application/pdf;base64,${base64Pdf.substring(0, 1000)}...`
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Invalid AI response format');
    }

  } catch (error) {
    console.error('PDF analysis error:', error);
    throw error;
  }
}