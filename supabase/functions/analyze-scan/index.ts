import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let sessionId: string | undefined;

  try {
    const requestBody = await req.json();
    sessionId = requestBody.sessionId;
    
    if (!sessionId) {
      console.error('No sessionId provided in request');
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('=== Starting AI analysis for session:', sessionId, '===');

    // Get the session and image details
    console.log('Fetching session and image data...');
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
      return new Response(JSON.stringify({ 
        error: 'Session not found',
        details: sessionError.message 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Session found:', session.id, 'Status:', session.status);
    
    const imageData = session.scan_images[0];
    if (!imageData) {
      console.error('No image data found for session');
      throw new Error('No image found for session');
    }
    
    console.log('Image data:', {
      fileName: imageData.file_name,
      mimeType: imageData.mime_type,
      size: imageData.file_size,
      path: imageData.storage_path
    });

    // Update status to processing
    console.log('Updating session status to processing...');
    const { error: updateError } = await supabase
      .from('scan_sessions')
      .update({ status: 'processing', progress: 10 })
      .eq('id', sessionId);
    
    if (updateError) {
      console.error('Failed to update session status:', updateError);
    }

    // Update progress stages
    await supabase.from('scan_sessions').update({ progress: 20 }).eq('id', sessionId);
    console.log('Downloading scan from storage...');

    // Get image from storage
    console.log('Downloading image from storage bucket...');
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('medical-scans')
      .download(imageData.storage_path);

    if (downloadError) {
      console.error('Storage download error:', downloadError);
      throw new Error(`Failed to download image: ${downloadError.message}`);
    }
    
    console.log('Image downloaded successfully, size:', imageBlob.size, 'bytes');

    // Update progress
    await supabase.from('scan_sessions').update({ progress: 40 }).eq('id', sessionId);
    console.log('Preparing file for AI analysis...');

    let analysisResults;

    // Convert blob to base64 for Gemini (chunk for large files to avoid stack overflow)
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to handle large files
    let binaryString = '';
    const chunkSize = 8192; // Process 8KB at a time
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Data = btoa(binaryString);
    
    // Check if it's a PDF document
    if (imageData.mime_type === 'application/pdf') {
      console.log('Analyzing PDF pathology report with Gemini AI...');
      await supabase.from('scan_sessions').update({ progress: 60 }).eq('id', sessionId);
      analysisResults = await analyzePDFWithGemini(base64Data);
    } else {
      console.log('Analyzing medical scan image with Gemini AI...');
      await supabase.from('scan_sessions').update({ progress: 60 }).eq('id', sessionId);
      analysisResults = await analyzeImageWithGemini(base64Data, imageData.mime_type);
    }

    await supabase.from('scan_sessions').update({ progress: 90 }).eq('id', sessionId);
    console.log('Generating detailed report...');

    // Store results in database
    console.log('Storing analysis results in database...');
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
    
    console.log('Results stored successfully');

    // Update session to completed
    console.log('Updating session status to completed...');
    const { error: completionError } = await supabase
      .from('scan_sessions')
      .update({ status: 'completed', progress: 100 })
      .eq('id', sessionId);
    
    if (completionError) {
      console.error('Failed to update session to completed:', completionError);
    }

    console.log('=== Analysis completed successfully for session:', sessionId, '===');

    return new Response(JSON.stringify({ 
      success: true,
      results: analysisResults 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-scan function:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Update session status to failed if we have sessionId
    if (sessionId) {
      try {
        await supabase
          .from('scan_sessions')
          .update({ 
            status: 'failed',
            progress: 0
          })
          .eq('id', sessionId);
        console.log('Updated session to failed status');
      } catch (updateError) {
        console.error('Failed to update session status:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      sessionId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeImageWithGemini(base64Image: string, mimeType: string) {
  try {
    console.log('Calling Gemini AI for image analysis...');
    
    const systemPrompt = `You are an expert medical radiologist specializing in kidney and renal imaging analysis. 
You provide detailed, accurate medical assessments of CT scans, MRI scans, ultrasounds, and X-rays focusing on kidney health.

Your analysis should include:
1. Overall assessment of the scan
2. Detailed findings organized by anatomical structures
3. Identification of any abnormalities
4. Confidence level in your assessment
5. Specific, actionable medical recommendations

Format your response as a detailed medical report that is both professional and understandable.
Be specific about what you observe in the image. If you detect any concerning findings, clearly state them.
Always recommend professional medical consultation for definitive diagnosis.`;

    const userPrompt = `Please analyze this kidney/renal medical scan image and provide a comprehensive medical assessment.

Provide your analysis in the following JSON format:
{
  "diagnosis": "Primary diagnosis or finding",
  "confidence": 0.85,
  "findings": {
    "overallAssessment": "General overview of the scan",
    "bilateralKidneyStatus": "Status of both kidneys",
    "corticalAppearance": "Kidney cortex assessment",
    "medullaryStructures": "Medullary structures evaluation",
    "collectingSystem": "Collecting system status",
    "vascularPatterns": "Vascular perfusion assessment",
    "pathologicalFindings": "Any pathological findings",
    "cysticLesions": "Cystic lesion assessment",
    "calculiOrStones": "Stone detection",
    "hydronephrosisAssessment": "Hydronephrosis evaluation",
    "surroundingStructures": "Adjacent structures assessment",
    "imageQualityNotes": "Image quality observations"
  },
  "recommendations": "Detailed medical recommendations and next steps"
}

Be thorough, specific, and medically accurate. If the image quality is poor or the scan type is unclear, note this in your assessment.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI service requires additional credits. Please contact support.');
      }
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI model');
    }

    console.log('AI Response received, parsing...');
    
    // Extract JSON from the response
    let analysisData;
    try {
      // Try to parse the entire response as JSON
      analysisData = JSON.parse(aiResponse);
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // Fallback: create structured response from text
        analysisData = {
          diagnosis: 'Medical Scan Analysis',
          confidence: 0.85,
          findings: {
            overallAssessment: aiResponse.substring(0, 500),
            detailedAnalysis: aiResponse
          },
          recommendations: 'Please consult with a healthcare professional for a comprehensive evaluation.'
        };
      }
    }

    return analysisData;

  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function analyzePDFWithGemini(base64PDF: string) {
  try {
    console.log('Calling Gemini AI for PDF analysis...');
    
    const systemPrompt = `You are an expert medical pathologist specializing in interpreting pathology reports and laboratory results related to kidney and renal health.

Your analysis should include:
1. Key findings from the pathology report
2. Clinical significance of the results
3. Interpretation of laboratory values
4. Prognostic factors
5. Treatment implications
6. Specific, actionable recommendations

Provide a comprehensive yet understandable interpretation of the pathology report.
Always recommend professional medical consultation for treatment planning.`;

    const userPrompt = `Please analyze this medical pathology report PDF and provide a comprehensive interpretation.

Provide your analysis in the following JSON format:
{
  "diagnosis": "Primary pathology finding",
  "confidence": 0.85,
  "findings": {
    "primaryPathology": "Main pathological findings",
    "histologicalFeatures": "Histological characteristics",
    "immunohistochemistry": "Immunohistochemistry results",
    "molecularMarkers": "Molecular marker analysis",
    "stagingAndGrading": "Disease staging and grading",
    "marginsAssessment": "Surgical margins if applicable",
    "laboratoryFindings": "Key laboratory values",
    "prognosticFactors": "Prognostic indicators",
    "treatmentResponse": "Treatment response if applicable",
    "additionalObservations": "Other relevant observations"
  },
  "recommendations": "Detailed medical recommendations and next steps"
}

Extract all relevant medical information from the report and provide a thorough interpretation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64PDF}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 402) {
        throw new Error('AI service requires additional credits. Please contact support.');
      }
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI model');
    }

    console.log('AI Response received, parsing...');
    
    // Extract JSON from the response
    let analysisData;
    try {
      analysisData = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                       aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        analysisData = {
          diagnosis: 'Pathology Report Analysis',
          confidence: 0.85,
          findings: {
            primaryPathology: aiResponse.substring(0, 500),
            detailedAnalysis: aiResponse
          },
          recommendations: 'Please consult with your healthcare provider for a comprehensive evaluation.'
        };
      }
    }

    return analysisData;

  } catch (error) {
    console.error('Gemini PDF analysis error:', error);
    throw new Error(`PDF analysis failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}