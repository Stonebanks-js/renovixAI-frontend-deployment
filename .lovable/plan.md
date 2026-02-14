

# Plan: Chatbot UX Overhaul + Hindi Translation + Voice Narration + UI Fixes

## Overview

This plan addresses 5 focused areas: structured chatbot responses, Hindi translation, voice narration, Health Info modal fix, and Sign-In button visibility. Voice will use the browser's built-in SpeechSynthesis API (free, no API key needed, supports English and Hindi).

---

## 1. Structured Chatbot Response Format (Prompt Engineering)

**File:** `supabase/functions/scan-chat-stream/index.ts`

Update the system prompt to enforce a structured output format for every response:

```
RESPONSE FORMAT (MANDATORY):
Always structure your responses using these sections:
1. **Condition Summary** - 1-2 line overview
2. **Key Findings** - Bullet points only
3. **Risk Level** - State clearly: Low / Moderate / Severe
4. **Recommended Actions** - Bullet points
5. **Emergency Warning** - Only if applicable
6. **Disclaimer** - Short, readable

STRICT RULES:
- No long paragraphs. Use concise bullet points.
- Use simple, patient-friendly language.
- Keep medical accuracy intact.
```

---

## 2. "Translate to Hindi" Button on Each Response

**File:** `src/components/ScanChatInterface.tsx`

- Add a "Translate to Hindi" toggle button below each assistant message
- On click, call the same `scan-chat-stream` edge function with: `"Translate the following medical text to Hindi. Preserve bullet formatting and medical accuracy:\n\n{original_text}"`
- Store translated text per message in local state
- Toggle between English (original) and Hindi (translated) views
- Show a small language indicator badge on each message

---

## 3. Voice Narration (Browser SpeechSynthesis API)

**File:** `src/components/ScanChatInterface.tsx`

- Add a "Play Voice" button next to each assistant message
- Use `window.speechSynthesis` with:
  - English voice (female) when displaying English text
  - Hindi voice when displaying Hindi translation
- Include Play/Pause/Stop controls
- Auto-detect current language state per message
- No external API or key needed -- works natively in all modern browsers
- Select female voice from available system voices (`voice.name` containing "female" or "Google" Hindi/English voices)

---

## 4. Health Info Modal Fix

**File:** `src/components/HealthInfoModal.tsx`

- Add `max-h-[90vh] overflow-y-auto` to DialogContent so the form scrolls on small screens
- Ensure the "Submit Information" button is always visible by adding sticky positioning or reducing spacing
- Add a "Sign in first" button that links to `/auth` when user is not authenticated (instead of just disabling the submit button)

---

## 5. Sign-In Button Visibility

**File:** `src/components/Navigation.tsx`

- Change the Sign In button from `variant="hero"` to a more prominent style with explicit background color, larger padding, and a subtle glow/shadow effect
- Add `shadow-md` and increased contrast to ensure it never blends with the background

---

## Technical Details

### Translation State Model (ScanChatInterface)

```text
Per message state:
- translatedContent: string | null
- isTranslating: boolean
- showHindi: boolean
```

When "Translate to Hindi" is clicked:
1. If `translatedContent` is null, fetch translation via edge function
2. Toggle `showHindi` to swap displayed content
3. Voice button reads whichever language is currently shown

### Voice Narration Implementation

```text
- Uses window.speechSynthesis (Web Speech API)
- Selects female voice from speechSynthesis.getVoices()
- For Hindi: filters voices with lang="hi-IN"
- For English: filters voices with lang="en-US" or "en-IN"
- Provides Play/Pause toggle button per message
- Stops any currently playing speech before starting new one
```

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/scan-chat-stream/index.ts` | Update system prompt for structured format |
| `src/components/ScanChatInterface.tsx` | Add translate button, voice button, per-message state |
| `src/components/HealthInfoModal.tsx` | Fix scroll overflow, add sign-in redirect button |
| `src/components/Navigation.tsx` | Improve Sign In button visibility |

### What This Does NOT Include

- External TTS API integration (uses free browser API instead)
- Health Timeline Dashboard (separate feature, large scope)
- Clinician/Doctor Mode panel (separate feature)
- Personalized Health Advice Engine (separate feature)

These advanced features are best implemented as separate follow-up tasks.

