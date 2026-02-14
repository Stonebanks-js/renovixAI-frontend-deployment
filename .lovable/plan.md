

# Plan: Enhanced Medical Chatbot with Medicine Suggestions and Home Remedies

## Overview

Upgrade the Renovix AI chat system so that when users ask about their medical report findings, the AI can:
1. Suggest **emergency medicines** relevant to the diagnosed condition
2. Recommend **home remedies** backed by general medical knowledge
3. Always include a clear **medical disclaimer** that medicines should only be taken as prescribed by a physician

This will be achieved by updating the **system prompt** in the `scan-chat-stream` edge function and adding quick-action buttons in the chat UI. No external API integration is needed -- Gemini's built-in medical knowledge is sufficient for general suggestions with proper disclaimers.

---

## Changes

### 1. Update `scan-chat-stream` Edge Function System Prompt

**File:** `supabase/functions/scan-chat-stream/index.ts`

Enhance the system prompt (lines 41-42) to instruct Gemini to:
- When asked about treatment or emergencies, suggest commonly used medicines with dosage ranges
- Suggest relevant home remedies (dietary changes, hydration, lifestyle tips)
- Always append a disclaimer: medicines must be taken only as prescribed by a licensed physician
- Format medicine suggestions clearly with name, typical use, and dosage range
- Never claim to replace a doctor's prescription

### 2. Add Quick-Action Buttons for Medicine and Remedy Queries

**File:** `src/components/ScanChatInterface.tsx`

Add two new quick-action buttons in the empty state (alongside existing ones):
- **"Suggest emergency medicines for my condition"**
- **"What home remedies can help?"**

These pre-fill the input so users can quickly ask these questions.

### 3. Update Chat Message Rendering for Markdown

**File:** `src/components/ScanChatInterface.tsx`

The AI will return formatted responses with headers, bullet points, and bold text for medicine names and disclaimers. Update the assistant message rendering to use basic markdown formatting (bold, lists) via `whitespace-pre-wrap` and `dangerouslySetInnerHTML` with a simple markdown-to-HTML converter, or simply keep `whitespace-pre-wrap` since Gemini formats well with plain text.

---

## Technical Details

### Updated System Prompt (scan-chat-stream)

The new system context will be:

```
You are a helpful medical AI assistant helping patients understand their medical reports and scan results.
Provide clear, concise answers grounded in the provided report.

MEDICINE SUGGESTIONS:
- When the user asks about medicines, treatment, or emergency care, suggest commonly used medicines relevant to the diagnosed condition.
- Format each medicine suggestion with: Medicine Name, Typical Use, Common Dosage Range.
- Include both prescription and OTC options where appropriate.

HOME REMEDIES:
- When asked, suggest evidence-based home remedies including dietary changes, hydration tips, herbal supplements, and lifestyle modifications relevant to the condition.

DISCLAIMER (MANDATORY):
- ALWAYS end medicine or treatment suggestions with this disclaimer:
  "Disclaimer: These suggestions are for informational purposes only. All medicines should be taken strictly as prescribed by a licensed physician. Do not self-medicate. Please consult your doctor before taking any medication."

If unsure about a condition, say so and recommend consulting a clinician immediately.
```

### New Quick-Action Buttons

Two additional buttons added to the empty chat state:
- "Suggest emergency medicines for my condition"
- "Recommend home remedies for my findings"

---

## What This Does NOT Do

- Does not integrate any external drug database API (Gemini's knowledge is sufficient for general suggestions)
- Does not store medicine recommendations in the database
- Does not replace professional medical advice (enforced by mandatory disclaimer)

