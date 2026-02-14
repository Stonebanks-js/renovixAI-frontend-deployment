

# Plan: Voice Narration Fix + Clean Response UI + PDF Report Export

## 1. Voice Narration Fix (High Priority)

**File:** `src/components/ScanChatInterface.tsx`

The current `speak()` function uses `SpeechSynthesisUtterance` but likely fails silently because:
- Volume is not explicitly set (defaults can vary)
- Long text causes Chrome to cut off speech silently (known browser bug)
- No "preparing" indicator is shown

**Changes:**
- Set `utterance.volume = 1.0` explicitly
- Set `utterance.pitch = 1.0` for clarity
- Reduce `utterance.rate` from 0.9 to 0.85 for calmer pace
- **Split long text into chunks** (max ~200 chars at sentence boundaries) to avoid Chrome's silent-cutoff bug on long utterances. Queue chunks sequentially.
- Add a "Preparing voice..." loading state via a new `isPreparingVoice` state
- Add a volume slider using the existing `Slider` component (stored in state, applied to utterance)
- Improve `getVoice()` to also match `lang` codes like `hi-IN` and prefer voices with "female" in the name more broadly

## 2. Clean Response Card UI (Visual Refinement)

**File:** `src/components/ScanChatInterface.tsx`

The assistant message bubble currently uses `bg-muted rounded-lg p-3` which is too compact.

**Changes:**
- Increase padding on assistant messages from `p-3` to `p-5`
- Add custom prose spacing CSS: `prose-headings:mt-4 prose-headings:mb-2 prose-li:my-1 prose-p:my-2`
- Add subtle section dividers via `prose-hr:border-border/50 prose-hr:my-4`
- Increase max-width from `max-w-[80%]` to `max-w-[85%]` for assistant messages
- Add a subtle left border accent: `border-l-4 border-primary/20` on assistant messages for medical report feel

## 3. PDF Report Download

**File:** `src/components/ScanChatInterface.tsx`

Add a "Download Report as PDF" button in the action bar below each assistant message.

**Implementation approach:** Use the browser's native `window.print()` with a hidden iframe containing styled HTML, or generate a PDF purely client-side using basic DOM-to-print. Since we want to avoid adding heavy PDF libraries, we will:

- Create a helper function `downloadReportPDF(content: string)` that:
  1. Creates a hidden iframe
  2. Writes styled HTML into it (with Renovix AI header, formatted content sections, disclaimer)
  3. Calls `iframe.contentWindow.print()` which opens the browser's print dialog (user can "Save as PDF")
  4. Removes the iframe after printing
- Add a `FileDown` (or `Download`) icon button in the action row
- The PDF will include: "Renovix AI Health Report" header, date, formatted content, and disclaimer footer

**File name note:** Since this uses print-to-PDF, the browser controls the filename. We will set the document title to "Renovix_AI_Health_Report" so it defaults correctly.

## 4. Updated System Prompt for Better Spacing

**File:** `supabase/functions/scan-chat-stream/index.ts`

Add to the formatting rules:
- "Add a horizontal rule (---) between each major section"
- "Add an empty line before and after each section heading"
- This ensures the markdown has natural spacing that the prose CSS can render cleanly

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/components/ScanChatInterface.tsx` | Fix voice (volume, chunking, slider), improve message card styling, add PDF download button |
| `supabase/functions/scan-chat-stream/index.ts` | Add spacing rules to system prompt (horizontal rules between sections) |

