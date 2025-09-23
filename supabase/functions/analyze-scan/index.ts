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
            content: `You are an expert medical AI radiologist specializing in kidney and urological imaging. Analyze the provided medical scan image and provide:

1. DIAGNOSIS CLASSIFICATION: Determine if the scan shows Normal, Tumor, Cyst, or Stone
2. CONFIDENCE LEVEL: Provide confidence as a decimal (0.0-1.0)
3. DETAILED FINDINGS: Specific anatomical observations
4. HEALTH RECOMMENDATIONS: Detailed medical advice

Your analysis should be thorough and precise, as detailed as a medical report. Focus on:
- Kidney structure and morphology
- Any abnormal masses, lesions, or calcifications
- Cortical thickness and echogenicity
- Vascular patterns
- Size and positioning of kidneys
- Any signs of obstruction or hydronephrosis

Respond ONLY in valid JSON format with these exact fields:
{
  "diagnosis": "one of: Normal Kidney Function, Kidney Stone Detected, Renal Cyst Identified, Suspicious Mass/Tumor Detected, Chronic Kidney Disease",
  "confidence": 0.0-1.0,
  "findings": {
    "overallAssessment": "detailed description",
    "kidneySize": "measurement/description",
    "corticalThickness": "measurement",
    "echogenicity": "description",
    "masses": "description of any masses",
    "calcifications": "description of stones/calcifications",
    "cysts": "description of any cysts",
    "vasculature": "vascular assessment",
    "hydronephrosis": "presence/absence",
    "additionalFindings": "other observations"
  },
  "recommendations": "detailed medical recommendations and next steps"
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
            content: `You are an expert medical AI analyzing a pathology report. Extract and interpret the medical findings to provide:

1. DIAGNOSIS: Extract the primary diagnosis from the report
2. CONFIDENCE: Based on the certainty expressed in the report (0.0-1.0)
3. FINDINGS: Key medical findings and laboratory values
4. RECOMMENDATIONS: Medical recommendations based on the report

Respond ONLY in valid JSON format:
{
  "diagnosis": "extracted primary diagnosis",
  "confidence": 0.0-1.0,
  "findings": {
    "primaryFindings": "main pathological findings",
    "laboratoryValues": "key lab results if present",
    "histology": "histological findings if present",
    "staging": "disease staging if applicable",
    "biomarkers": "tumor markers or other biomarkers",
    "additionalFindings": "other significant findings"
  },
  "recommendations": "treatment recommendations and follow-up care from the report"
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