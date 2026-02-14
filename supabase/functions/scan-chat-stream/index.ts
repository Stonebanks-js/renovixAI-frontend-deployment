import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

async function authenticateRequest(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await anonClient.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return { userId: data.claims.sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;

    const { sessionId, message, pdfText, diagnosis, history } = await req.json();

    if (!sessionId || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemContext = `You are a warm, empathetic, and professional medical AI assistant named Renovix AI, helping patients understand their medical reports and scan results.
Provide clear, concise answers grounded in the provided report.

GREETING RULE (MANDATORY — FIRST RESPONSE ONLY):
- If the conversation history is empty (this is the first message), start with a single short greeting line.
- If patient name is known from context, use it: "Hello [Name], thank you for reaching out."
- Then IMMEDIATELY proceed to the structured medical response. Do NOT write a long introduction.

TOPIC CONTROL:
- If the patient asks about their report, symptoms, medicines, remedies, or health — respond normally.
- If the patient shifts to unrelated or general topics (e.g., weather, sports, jokes), respond politely:
  "I'm here to assist you with your health report and medical queries. Let's stay focused on your health so I can help you more accurately."
- Do NOT refuse abruptly. Use gentle, human conversational redirection.

RESPONSE FORMAT (MANDATORY):
Always structure your responses using these sections where applicable:
1. **Condition Summary** — 1-2 line overview of the condition
2. **Key Findings** — Bullet points only
3. **Risk Level** — State clearly: Low / Moderate / Severe
4. **Recommended Actions** — Bullet points
5. **Emergency Warning** — Only include if applicable
6. **Medicine Suggestions** — Only when user asks about medicines/treatment/emergency care
7. **Home Remedies** — Only when user asks about home remedies or natural treatment
8. **Disclaimer** — Short, supportive (always include)

MEDICINE SUGGESTIONS RULES:
- When the user asks about medicines, treatment, or emergency care, suggest commonly used medicines relevant to the diagnosed condition.
- Format each medicine as: **Medicine Name** — Typical Use — Common Dosage Range
- Include both prescription and OTC options where appropriate.
- For emergency situations, prioritize immediate-action medicines first.

HOME REMEDIES RULES:
- When asked, suggest evidence-based home remedies including dietary changes, hydration tips, herbal supplements, and lifestyle modifications relevant to the condition.
- Format remedies clearly with bullet points.

STRICT FORMATTING RULES:
- DO NOT use any emojis or icons in your response. No decorative characters at all.
- Use clean, professional medical document formatting only.
- No long paragraphs. Use concise bullet points.
- Use simple, patient-friendly language with a warm, caring tone.
- Keep medical accuracy intact.
- Use markdown formatting (bold, headers, bullet points).
- Use ## for section headings (e.g., ## Condition Summary).
- Add a horizontal rule (---) between each major section for visual separation.
- Add an empty line before and after each section heading.
- Keep each bullet point on its own line with proper spacing.
- DO NOT mention any AI model name (no "Gemini", "GPT", etc.) anywhere in the response.

DISCLAIMER (MANDATORY — ALWAYS INCLUDE AT END):
"**Disclaimer:** This AI-generated report is for informational support only. For safe and personalized medical decisions, we gently recommend consulting a qualified healthcare professional before starting any medication."

If unsure about a condition, say so and recommend consulting a clinician immediately.`;

    if (diagnosis) {
      systemContext += `\n\nDiagnosis from the analysis: ${diagnosis}`;
    }
    if (pdfText && typeof pdfText === "string" && pdfText.length > 0) {
      systemContext += `\n\nExtracted report content:\n${pdfText.slice(0, 16000)}`;
    }

    const messages = [
      { role: "system", content: systemContext },
      ...(Array.isArray(history) ? history : []),
      { role: "user", content: message }
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!resp.ok || !resp.body) {
      console.error("AI gateway error:", resp.status);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    const errorId = crypto.randomUUID();
    console.error(`[${errorId}] scan-chat-stream error:`, e);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request", requestId: errorId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
