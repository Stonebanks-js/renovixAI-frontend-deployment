/**
 * Shared text sanitization utilities for Renovix AI
 * Used by ScanReport, PDF export, and Dashboard
 */

// Clean text: strip markdown artifacts, emojis, decorative symbols
export const cleanText = (text: string): string => {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,3}/g, '')
    .replace(/_{1,3}/g, '')
    .replace(/---+/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[^\w\s.,;:!?()\-–—•·/\\%°\n\r'"&@+=$<>[\]{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// Safely convert any value to readable string (prevents [object Object])
export const valueToString = (val: unknown): string => {
  if (val === null || val === undefined) return 'No significant findings detected';
  if (typeof val === 'string') return cleanText(val);
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(item => valueToString(item)).filter(Boolean).join('\n');
  }
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
        const text = valueToString(v);
        return text ? `${label}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return String(val);
};

// Generate unique Report ID
export const generateReportId = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RNX-${date}-${rand}`;
};

// Generate unique Referral ID
export const generateReferralId = (): string => {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REF-${rand}`;
};

// Determine risk level from diagnosis and confidence
export const getRiskLevel = (diagnosis: string, confidence: number): { label: string; level: 'low' | 'moderate' | 'high'; color: string } => {
  const lower = diagnosis.toLowerCase();
  const isHealthy = lower.includes('normal') || lower.includes('healthy') || lower.includes('no significant');
  const isSevere = lower.includes('stage 5') || lower.includes('stage 4') || lower.includes('failure') || lower.includes('end-stage') || lower.includes('cancer') || lower.includes('malignant');
  const isModerate = lower.includes('stage 3') || lower.includes('stage 2') || lower.includes('moderate') || lower.includes('mild');

  if (isHealthy) {
    return { label: 'Low Risk', level: 'low', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (isSevere) {
    return { label: 'High Risk', level: 'high', color: 'text-red-700 bg-red-50 border-red-200' };
  }
  if (isModerate) {
    return { label: 'Moderate Risk', level: 'moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  // Fallback: use confidence
  if (confidence > 0.75) {
    return { label: 'High Risk', level: 'high', color: 'text-red-700 bg-red-50 border-red-200' };
  }
  if (confidence > 0.4) {
    return { label: 'Moderate Risk', level: 'moderate', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { label: 'Low Risk', level: 'low', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
};

// Extract patient name from PDF text or diagnosis
export const extractPatientName = (pdfText?: string): string | null => {
  if (!pdfText) return null;
  // Try to match common patterns like "Mr. UMESH KUMAR" or "Name: John Doe"
  const patterns = [
    /(?:Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][A-Z\s]+)/,
    /Name\s*:\s*([A-Za-z\s]+?)(?:\s*:|\s*$|\n)/,
    /Patient\s*(?:Name)?\s*:\s*([A-Za-z\s]+?)(?:\s*:|\s*$|\n)/,
  ];
  for (const pattern of patterns) {
    const match = pdfText.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }
  return null;
};

// Sanitize text for PDF export (no markdown, no hashtags, no emojis)
export const sanitizeForPdf = (text: string): string => {
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
    .replace(/_{1,3}(.*?)_{1,3}/g, '$1')
    .replace(/---+/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[^\w\s.,;:!?()\-–—•·/\\%°\n\r'"&@+=$<>[\]{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};
