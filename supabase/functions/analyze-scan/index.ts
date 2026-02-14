import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Auth helper: verify JWT and return user ID
async function authenticateRequest(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required', code: 'AUTH_001' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await anonClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Invalid authentication', code: 'AUTH_002' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return { userId: data.claims.sub as string };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let sessionId: string | undefined;

  try {
    // Authenticate
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    const requestBody = await req.json();
    sessionId = requestBody.sessionId;
    
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required', code: 'INPUT_001' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('=== Starting AI analysis for session:', sessionId, '===');

    // Get session and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('scan_sessions')
      .select(`*, scan_images (*)`)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('[SESSION_001] Session fetch error:', sessionError);
      return new Response(JSON.stringify({ error: 'Unable to retrieve scan session', code: 'SESSION_001' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify session belongs to authenticated user
    if (session.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized access to session', code: 'AUTH_003' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Session found:', session.id, 'Status:', session.status);
    
    const imageData = session.scan_images[0];
    if (!imageData) {
      console.error('No image data found for session');
      throw new Error('No image found for session');
    }

    // Update status to processing
    await supabase.from('scan_sessions').update({ status: 'processing', progress: 10 }).eq('id', sessionId);

    // If client provided extracted PDF text, analyze directly
    if (typeof requestBody.pdfText === 'string' && imageData.mime_type === 'application/pdf') {
      console.log('Received pdfText for PDF, length:', requestBody.pdfText.length);
      await supabase.from('scan_sessions').update({ progress: 60 }).eq('id', sessionId);
      const analysisResults = await analyzePDFTextWithGemini(requestBody.pdfText);
      await supabase.from('scan_sessions').update({ progress: 90 }).eq('id', sessionId);

      const { error: resultError } = await supabase.from('scan_results').insert({
        session_id: sessionId,
        diagnosis: analysisResults.diagnosis,
        confidence: analysisResults.confidence,
        findings: analysisResults.findings,
        recommendations: analysisResults.recommendations,
      });

      if (resultError) {
        console.error('[RESULT_001] Result storage error:', resultError);
        throw new Error('Failed to store results');
      }

      await supabase.from('scan_sessions').update({ status: 'completed', progress: 100 }).eq('id', sessionId);
      console.log('=== Analysis completed for session:', sessionId, '===');

      return new Response(JSON.stringify({ success: true, results: analysisResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('scan_sessions').update({ progress: 20 }).eq('id', sessionId);

    // Download image from storage
    const { data: imageBlob, error: downloadError } = await supabase.storage
      .from('medical-scans')
      .download(imageData.storage_path);

    if (downloadError || !imageBlob) {
      console.error('[DOWNLOAD_001] Storage download error:', downloadError);
      throw new Error('Failed to download image');
    }

    // === SERVER-SIDE FILE VALIDATION ===
    // Validate file size
    if (imageBlob.size > 10 * 1024 * 1024) {
      throw new Error('File exceeds 10MB limit');
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/dicom', 'application/pdf'];
    if (!allowedTypes.includes(imageData.mime_type)) {
      throw new Error('Invalid file type');
    }

    // Verify magic numbers (file signatures)
    const validationBuffer = await imageBlob.arrayBuffer();
    const headerBytes = new Uint8Array(validationBuffer.slice(0, 4));
    const isJPEG = headerBytes[0] === 0xFF && headerBytes[1] === 0xD8 && headerBytes[2] === 0xFF;
    const isPNG = headerBytes[0] === 0x89 && headerBytes[1] === 0x50 && headerBytes[2] === 0x4E && headerBytes[3] === 0x47;
    const isPDF = headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46;

    if (!isJPEG && !isPNG && !isPDF) {
      throw new Error('File signature does not match declared type');
    }

    console.log('File validation passed, size:', imageBlob.size, 'bytes');

    await supabase.from('scan_sessions').update({ progress: 40 }).eq('id', sessionId);

    let analysisResults;

    // Convert blob to base64 in chunks
    const uint8Array = new Uint8Array(validationBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Data = btoa(binaryString);
    
    if (imageData.mime_type === 'application/pdf') {
      await supabase.from('scan_sessions').update({ status: 'failed', progress: 0 }).eq('id', sessionId);
      return new Response(JSON.stringify({ error: 'PDF text extraction required', code: 'PDF_001' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      await supabase.from('scan_sessions').update({ progress: 60 }).eq('id', sessionId);
      analysisResults = await analyzeImageWithGemini(base64Data, imageData.mime_type);
    }

    await supabase.from('scan_sessions').update({ progress: 90 }).eq('id', sessionId);

    const { error: resultError } = await supabase.from('scan_results').insert({
      session_id: sessionId,
      diagnosis: analysisResults.diagnosis,
      confidence: analysisResults.confidence,
      findings: analysisResults.findings,
      recommendations: analysisResults.recommendations,
    });

    if (resultError) {
      console.error('[RESULT_001] Result storage error:', resultError);
      throw new Error('Failed to store results');
    }

    await supabase.from('scan_sessions').update({ status: 'completed', progress: 100 }).eq('id', sessionId);
    console.log('=== Analysis completed for session:', sessionId, '===');

    return new Response(JSON.stringify({ success: true, results: analysisResults }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] Error in analyze-scan:`, error);
    
    if (sessionId) {
      try {
        await supabase.from('scan_sessions').update({ status: 'failed', progress: 0 }).eq('id', sessionId);
      } catch (updateError) {
        console.error('Failed to update session status:', updateError);
      }
    }

    return new Response(JSON.stringify({ 
      error: 'An error occurred during analysis',
      code: 'ANALYSIS_001',
      requestId: errorId,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeImageWithGemini(base64Image: string, mimeType: string) {
  try {
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

Be thorough, specific, and medically accurate.`;

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
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI analysis failed with status ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;
    if (!aiResponse) throw new Error('No response from AI model');

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
          diagnosis: 'Medical Scan Analysis',
          confidence: 0.85,
          findings: { overallAssessment: aiResponse.substring(0, 500), detailedAnalysis: aiResponse },
          recommendations: 'Please consult with a healthcare professional for a comprehensive evaluation.'
        };
      }
    }
    return analysisData;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw new Error('AI analysis failed');
  }
}

async function analyzePDFTextWithGemini(pdfText: string) {
  try {
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

    const userPrompt = `Analyze the following medical pathology and/or blood test report text and provide a comprehensive interpretation in JSON with fields diagnosis (string), confidence (0-1), findings (object with concise sections), and recommendations (string).`;

    const MAX_CHARS = 20000;
    const clipped = pdfText.length > MAX_CHARS ? pdfText.slice(0, MAX_CHARS) : pdfText;

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
          { role: 'user', content: [{ type: 'text', text: userPrompt + "\n\nReport Text:\n" + clipped }] }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI analysis failed with status ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content;
    if (!aiResponse) throw new Error('No response from AI model');

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
          findings: { summary: aiResponse.substring(0, 500), detailedAnalysis: aiResponse },
          recommendations: 'Please consult with your healthcare provider for a comprehensive evaluation.'
        };
      }
    }
    return analysisData;
  } catch (error) {
    console.error('PDF text analysis error:', error);
    throw new Error('PDF text analysis failed');
  }
}
