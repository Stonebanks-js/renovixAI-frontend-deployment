import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    // Update status to processing
    await supabase
      .from('scan_sessions')
      .update({ status: 'processing', progress: 10 })
      .eq('id', sessionId);

    // Simulate ML model processing stages
    const stages = [
      { progress: 25, message: 'Preprocessing image...' },
      { progress: 50, message: 'Feature extraction...' },
      { progress: 75, message: 'Running classification model...' },
      { progress: 90, message: 'Generating recommendations...' },
    ];

    for (const stage of stages) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      await supabase
        .from('scan_sessions')
        .update({ progress: stage.progress })
        .eq('id', sessionId);
      
      console.log(`Stage: ${stage.message} (${stage.progress}%)`);
    }

    // Simulate AI model results (Replace this with your actual model integration)
    const mockResults = {
      diagnosis: Math.random() > 0.7 ? 'Chronic Kidney Disease Stage 3' : 'Normal Kidney Function',
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      findings: {
        corticalThickness: `${(Math.random() * 3 + 8).toFixed(1)}mm`,
        echogenicity: Math.random() > 0.5 ? 'Normal' : 'Increased',
        scarring: Math.random() > 0.8 ? 'Present' : 'Absent',
        cysts: Math.random() > 0.9 ? 'Multiple small cysts detected' : 'No cysts detected',
        bloodFlow: Math.random() > 0.6 ? 'Normal' : 'Reduced',
      },
      recommendations: generateHealthRecommendations(),
    };

    // Store results in database
    const { error: resultError } = await supabase
      .from('scan_results')
      .insert({
        session_id: sessionId,
        diagnosis: mockResults.diagnosis,
        confidence: mockResults.confidence,
        findings: mockResults.findings,
        recommendations: mockResults.recommendations,
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
      results: mockResults 
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

function generateHealthRecommendations(): string {
  const recommendations = [
    "• Stay well-hydrated by drinking 8-10 glasses of water daily",
    "• Follow a kidney-friendly diet low in sodium and phosphorus",
    "• Monitor blood pressure regularly and maintain healthy levels",
    "• Engage in regular moderate exercise as approved by your physician",
    "• Avoid NSAIDs and other medications that may harm kidney function",
    "• Schedule regular follow-up appointments with your nephrologist",
    "• Consider dietary consultation for personalized nutrition planning",
    "• Monitor protein intake according to your doctor's recommendations",
  ];

  return recommendations.slice(0, Math.floor(Math.random() * 3) + 4).join('\n');
}