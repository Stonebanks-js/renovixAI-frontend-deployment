import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, pdfText, diagnosis, history } = await req.json();
    console.log("scan-chat-stream start", {
      sessionId,
      hasPdfText: !!pdfText,
      diagnosisLen: diagnosis?.length || 0,
      historyCount: Array.isArray(history) ? history.length : 0,
      messageLen: message?.length || 0
    });

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

    // Build system context with optional diagnosis and truncated report text
    let systemContext = `You are a professional medical AI assistant helping patients understand their medical reports and scan results.
Provide clear, concise answers grounded in the provided report.

RESPONSE FORMAT (MANDATORY):
Always structure your responses using these sections where applicable:
1. **Condition Summary** — 1-2 line overview of the condition
2. **Key Findings** — Bullet points only
3. **Risk Level** — State clearly: Low / Moderate / Severe
4. **Recommended Actions** — Bullet points
5. **Emergency Warning** — Only include if applicable
6. **Medicine Suggestions** — Only when user asks about medicines/treatment/emergency care
7. **Home Remedies** — Only when user asks about home remedies or natural treatments
8. **Disclaimer** — Short, readable (always include)

MEDICINE SUGGESTIONS RULES:
- When the user asks about medicines, treatment, or emergency care, suggest commonly used medicines relevant to the diagnosed condition.
- Format each medicine as: **Medicine Name** — Typical Use — Common Dosage Range
- Include both prescription and OTC options where appropriate.
- For emergency situations, prioritize immediate-action medicines first.

HOME REMEDIES RULES:
- When asked, suggest evidence-based home remedies including dietary changes, hydration tips, herbal supplements, and lifestyle modifications relevant to the condition.
- Format remedies clearly with bullet points.

STRICT FORMATTING RULES:
- DO NOT use any emojis or icons in your response. No 🩺 🔍 ⚠️ ✅ 🚨 💊 🌿 or any other emoji characters.
- Use clean, professional medical document formatting only.
- No long paragraphs. Use concise bullet points.
- Use simple, patient-friendly language.
- Keep medical accuracy intact.
- Use markdown formatting (bold, headers, bullet points).
- Use ## for section headings (e.g., ## Condition Summary).
- Add a horizontal rule (---) between each major section for visual separation.
- Add an empty line before and after each section heading.
- Keep each bullet point on its own line with proper spacing.

DISCLAIMER (MANDATORY — ALWAYS INCLUDE AT END):
"**Disclaimer:** These suggestions are for informational purposes only. All medicines should be taken strictly as prescribed by a licensed physician. Do not self-medicate. Please consult your doctor before taking any medication."

If unsure about a condition, say so and recommend consulting a clinician immediately.`;

    if (diagnosis) {
      systemContext += `\n\nDiagnosis from the analysis: ${diagnosis}`;
    }
    if (pdfText && typeof pdfText === "string" && pdfText.length > 0) {
      const clipped = pdfText.slice(0, 16000); // keep generous context but below typical limits
      systemContext += `\n\nExtracted report content:\n${clipped}`;
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
      // Surface rate limit and payment errors clearly
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the SSE stream directly
    console.log("scan-chat-stream: streaming start");
    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("scan-chat-stream error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
