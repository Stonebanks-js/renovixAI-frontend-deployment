import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Loader2, Send, MessageCircle, Bot, User, Pill, Leaf, Languages, Volume2, VolumeX, Pause, Play, FileDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageMeta {
  translatedContent: string | null;
  isTranslating: boolean;
  showHindi: boolean;
}

const CHAT_STREAM_URL = 'https://oaqukfylwosrslltqtws.functions.supabase.co/functions/v1/scan-chat-stream';

interface ScanChatInterfaceProps {
  sessionId: string;
  pdfText?: string;
  diagnosis?: string;
}

// Split text into chunks at sentence boundaries (max ~200 chars) to avoid Chrome TTS cutoff
const splitIntoChunks = (text: string, maxLen = 200): string[] => {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Find last sentence boundary within maxLen
    let splitAt = -1;
    for (const sep of ['. ', '। ', '? ', '! ', '\n']) {
      const idx = remaining.lastIndexOf(sep, maxLen);
      if (idx > 0 && idx > splitAt) splitAt = idx + sep.length;
    }
    if (splitAt <= 0) {
      // fallback: split at last space
      splitAt = remaining.lastIndexOf(' ', maxLen);
      if (splitAt <= 0) splitAt = maxLen;
    }
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  return chunks;
};

// Voice helpers
const getVoice = (lang: 'en' | 'hi'): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  if (lang === 'hi') {
    const female = voices.find(v => v.lang.startsWith('hi') && /female|Google.*Hindi/i.test(v.name));
    if (female) return female;
    return voices.find(v => v.lang.startsWith('hi')) || null;
  }
  const female = voices.find(v => v.lang.startsWith('en') && /female|Google.*English/i.test(v.name));
  if (female) return female;
  return voices.find(v => v.lang.startsWith('en')) || null;
};

// Strip emojis from text
const stripEmojis = (text: string): string =>
  text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{2700}-\u{27BF}\u{E000}-\u{F8FF}]/gu, '').replace(/\s{2,}/g, ' ');

// Convert markdown to clean HTML for PDF (no emojis, no raw symbols)
const markdownToCleanHTML = (md: string): string => {
  let html = stripEmojis(md);
  // Headers
  html = html.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // List items
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');
  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr/>');
  // Line breaks for remaining newlines
  html = html.replace(/\n{2,}/g, '<br/><br/>');
  html = html.replace(/\n/g, '<br/>');
  return html;
};

// PDF report helper — professional medical report layout
const downloadReportPDF = (content: string) => {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const htmlContent = markdownToCleanHTML(content);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const patientId = `RNX-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const referralId = `REF-${Math.random().toString(36).slice(2,9).toUpperCase()}`;

  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
    <title>Renovix_AI_Health_Report</title>
    <style>
      @page { size: A4; margin: 20mm 18mm 25mm 18mm; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; line-height: 1.7; font-size: 13px; padding: 0; }
      .page { max-width: 100%; padding: 0 10px; }
      .header { border-bottom: 3px solid #0c4a6e; padding-bottom: 16px; margin-bottom: 20px; }
      .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
      .brand { font-size: 26px; font-weight: 800; color: #0c4a6e; letter-spacing: -0.5px; }
      .brand-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
      .report-type { text-align: right; }
      .report-type span { display: block; font-size: 11px; color: #64748b; }
      .report-type strong { color: #0c4a6e; font-size: 13px; }
      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-top: 12px; font-size: 12px; color: #334155; }
      .meta-grid .label { font-weight: 600; color: #0c4a6e; }
      .content { margin-bottom: 30px; }
      .content h1 { font-size: 18px; color: #0c4a6e; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
      .content h2 { font-size: 16px; color: #0c4a6e; margin: 18px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
      .content h3 { font-size: 14px; color: #1e3a5f; margin: 14px 0 6px; }
      .content ul { padding-left: 20px; margin: 8px 0; }
      .content li { margin: 4px 0; line-height: 1.6; }
      .content hr { border: none; border-top: 1px solid #cbd5e1; margin: 16px 0; }
      .content strong { color: #0f172a; }
      .content p, .content br+br { margin: 6px 0; }
      .footer { margin-top: 30px; padding-top: 12px; border-top: 2px solid #0c4a6e; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
      .disclaimer { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; margin-top: 20px; font-size: 11px; color: #475569; line-height: 1.5; }
      .disclaimer strong { color: #b91c1c; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
  </head><body>
    <div class="page">
      <div class="header">
        <div class="header-top">
          <div>
            <div class="brand">Renovix AI</div>
            <div class="brand-sub">Advanced Medical Report Analysis System</div>
          </div>
          <div class="report-type">
            <strong>AI Medical Analysis Report</strong>
            <span>Auto-Generated Clinical Summary</span>
          </div>
        </div>
        <div class="meta-grid">
          <div><span class="label">Patient ID:</span> ${patientId}</div>
          <div><span class="label">Referral ID:</span> ${referralId}</div>
          <div><span class="label">Report Date:</span> ${dateStr}</div>
          <div><span class="label">Report Time:</span> ${timeStr}</div>
        </div>
      </div>
      <div class="content">${htmlContent}</div>
      <div class="disclaimer">
        <strong>Disclaimer:</strong> This report is AI-generated for informational purposes only. It does not constitute medical advice. All findings and suggestions should be reviewed and validated by a licensed healthcare professional. Do not self-medicate based on this report.
      </div>
      <div class="footer">
        <span>Powered by Renovix AI</span>
        <span>Confidential — For Patient Use Only</span>
      </div>
    </div>
  </body></html>`);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 500);
};

export const ScanChatInterface = ({ sessionId, pdfText, diagnosis }: ScanChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const [messageMeta, setMessageMeta] = useState<Record<string, MessageMeta>>({});
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparingVoice, setIsPreparingVoice] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const { toast } = useToast();

  // Load voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handleVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', handleVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handleVoices);
  }, []);

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getMeta = (id: string): MessageMeta => messageMeta[id] || { translatedContent: null, isTranslating: false, showHindi: false };

  const setMeta = (id: string, update: Partial<MessageMeta>) => {
    setMessageMeta(prev => ({ ...prev, [id]: { ...getMeta(id), ...update } }));
  };

  // Translation
  const translateToHindi = useCallback(async (msg: Message) => {
    const meta = getMeta(msg.id);
    if (meta.translatedContent) {
      setMeta(msg.id, { showHindi: !meta.showHindi });
      return;
    }
    setMeta(msg.id, { isTranslating: true });
    try {
      const resp = await fetch(CHAT_STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: `Translate the following medical text to Hindi. Preserve all bullet formatting, markdown, and medical accuracy. Only return the translation, nothing else:\n\n${msg.content}`,
          history: [],
        })
      });
      if (!resp.ok || !resp.body) throw new Error('Translation failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let translated = '';

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nlIdx: number;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || !line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) translated += delta;
          } catch { /* partial */ }
        }
      }
      setMeta(msg.id, { translatedContent: translated, showHindi: true, isTranslating: false });
    } catch {
      toast({ title: 'Translation Error', description: 'Could not translate. Please try again.', variant: 'destructive' });
      setMeta(msg.id, { isTranslating: false });
    }
  }, [sessionId, messageMeta, toast]);

  // Unlock AudioContext on first user interaction (browser autoplay policy)
  const unlockAudio = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      console.log('[Voice] AudioContext unlocked');
    } catch (e) {
      console.warn('[Voice] AudioContext unlock failed:', e);
    }
  }, []);

  // Voice narration with chunking
  const speakNextChunk = useCallback((lang: 'en' | 'hi', vol: number) => {
    if (chunkIndexRef.current >= chunksRef.current.length) {
      console.log('[Voice] All chunks spoken, done.');
      setSpeakingId(null);
      setIsPaused(false);
      setIsPreparingVoice(false);
      return;
    }
    const text = chunksRef.current[chunkIndexRef.current];
    console.log(`[Voice] Speaking chunk ${chunkIndexRef.current + 1}/${chunksRef.current.length}, len=${text.length}, vol=${vol}`);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    const voice = getVoice(lang);
    if (voice) {
      utterance.voice = voice;
      console.log(`[Voice] Using voice: ${voice.name} (${voice.lang})`);
    } else {
      console.warn('[Voice] No matching voice found for', lang);
    }
    utterance.volume = Math.max(0.1, vol / 100);
    utterance.rate = 0.75;
    utterance.pitch = 1.0;
    utterance.onend = () => {
      console.log(`[Voice] Chunk ${chunkIndexRef.current + 1} finished`);
      chunkIndexRef.current += 1;
      speakNextChunk(lang, vol);
    };
    utterance.onerror = (e) => {
      console.error('[Voice] Utterance error:', e);
      setSpeakingId(null);
      setIsPaused(false);
    };
    // Chrome bug: cancel before speak to ensure queue is clear
    window.speechSynthesis.cancel();
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
      console.log('[Voice] speechSynthesis.speak() called');
    }, 50);
  }, []);

  const speak = useCallback((msg: Message) => {
    const meta = getMeta(msg.id);
    if (speakingId === msg.id) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        console.log('[Voice] Resumed');
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
        console.log('[Voice] Paused');
      }
      return;
    }

    // Unlock audio context on user interaction
    unlockAudio();

    window.speechSynthesis.cancel();
    setIsPreparingVoice(true);

    const text = meta.showHindi && meta.translatedContent ? meta.translatedContent : msg.content;
    // Strip markdown symbols and emojis for clean speech
    const plainText = stripEmojis(
      text.replace(/[#*_~`>|-]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    ).trim();
    const lang: 'en' | 'hi' = meta.showHindi && meta.translatedContent ? 'hi' : 'en';

    console.log(`[Voice] Starting narration, lang=${lang}, textLen=${plainText.length}, volume=${voiceVolume}`);

    chunksRef.current = splitIntoChunks(plainText);
    chunkIndexRef.current = 0;

    setSpeakingId(msg.id);
    setIsPaused(false);

    // Small delay to allow "preparing" indicator to show & voices to load
    setTimeout(() => {
      setIsPreparingVoice(false);
      speakNextChunk(lang, voiceVolume);
    }, 400);
  }, [speakingId, isPaused, messageMeta, voiceVolume, speakNextChunk, unlockAudio]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    chunkIndexRef.current = 0;
    setSpeakingId(null);
    setIsPaused(false);
    setIsPreparingVoice(false);
  }, []);

  const sendMessage = async (override?: string) => {
    const text = (override ?? inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLastPrompt(text);
    setLastError(null);
    setInputValue('');
    setIsLoading(true);

    let assistantSoFar = '';
    const assistantId = (Date.now() + 1).toString();
    const upsertAssistant = (delta: string) => {
      assistantSoFar += delta;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.id === assistantId) {
          const updated = prev.slice();
          updated[updated.length - 1] = { ...last, content: assistantSoFar } as Message;
          return updated;
        }
        return [
          ...prev,
          { id: assistantId, role: 'assistant', content: assistantSoFar, timestamp: new Date() }
        ];
      });
    };

    try {
      const resp = await fetch(CHAT_STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          pdfText,
          diagnosis,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!resp.ok || !resp.body) {
        const contentType = resp.headers.get('content-type') || '';
        let errMsg = '';
        if (contentType.includes('application/json')) {
          try { const j = await resp.json(); errMsg = j?.error || JSON.stringify(j); } catch { errMsg = await resp.text(); }
        } else { errMsg = await resp.text(); }

        setLastError(errMsg || 'Failed to start stream');
        const desc = resp.status === 429
          ? 'Rate limit exceeded. Please wait a bit and try again.'
          : resp.status === 402
          ? 'AI credits exhausted. Please add credits to your Lovable workspace.'
          : 'Unable to start AI stream.';
        toast({ title: 'Chat Error', description: desc, variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (readerDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { done = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(delta);
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) upsertAssistant(delta);
          } catch { /* ignore */ }
        }
      }

    } catch (error) {
      console.error('Chat stream error:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error');
      toast({ title: 'Chat Error', description: 'Failed during AI streaming. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card className="card-nephro p-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-4">
        <MessageCircle className="w-6 h-6 text-primary" />
        <h3 className="text-xl font-semibold text-foreground">Ask Questions About Your Report</h3>
      </div>

      <div className="space-y-4">
        <ScrollArea ref={scrollRef} className="h-[400px] pr-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <Bot className="w-12 h-12 text-primary/50" />
              <div>
                <p className="font-medium text-foreground">Start a Conversation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask me anything about your medical report, diagnosis, or recommendations
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4 w-full max-w-md">
                <Button variant="outline" size="sm" onClick={() => setInputValue("What do my test results mean?")}>
                  What do my test results mean?
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInputValue("What should I do next?")}>
                  What should I do next?
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInputValue("Explain the findings in simple terms")}>
                  Explain the findings in simple terms
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInputValue("Suggest emergency medicines for my condition")} className="border-destructive/30 text-destructive hover:bg-destructive/5">
                  <Pill className="w-4 h-4 mr-1" /> Suggest emergency medicines
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInputValue("Recommend home remedies for my findings")} className="border-accent/50 text-accent-foreground hover:bg-accent/10">
                  <Leaf className="w-4 h-4 mr-1" /> Recommend home remedies
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const meta = getMeta(message.id);
                const displayContent = message.role === 'assistant' && meta.showHindi && meta.translatedContent
                  ? meta.translatedContent
                  : message.content;

                return (
                  <div key={message.id}>
                    <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className={`rounded-lg ${
                        message.role === 'user'
                          ? 'max-w-[80%] p-3 bg-primary text-primary-foreground'
                          : 'max-w-[85%] p-5 bg-muted text-foreground border-l-4 border-primary/20'
                      }`}>
                        {message.role === 'assistant' ? (
                          <>
                            {meta.showHindi && meta.translatedContent && (
                              <Badge variant="secondary" className="mb-2 text-xs">हिंदी</Badge>
                            )}
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-[15px] prose-h2:mt-5 prose-h2:mb-2 prose-h3:text-[14px] prose-h3:mt-4 prose-h3:mb-1.5 prose-li:my-1.5 prose-p:my-2.5 prose-p:leading-relaxed prose-ul:my-2 prose-hr:border-border/40 prose-hr:my-5 prose-strong:text-foreground">
                              <ReactMarkdown>{displayContent}</ReactMarkdown>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}
                        <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Action buttons for assistant messages */}
                    {message.role === 'assistant' && !isLoading && (
                      <div className="flex flex-wrap items-center gap-2 ml-11 mt-1.5">
                        {/* Translate button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                          onClick={() => translateToHindi(message)}
                          disabled={meta.isTranslating}
                        >
                          {meta.isTranslating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Languages className="w-3.5 h-3.5" />
                          )}
                          {meta.showHindi ? 'Show English' : 'Translate to Hindi'}
                        </Button>

                        {/* Voice button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                          onClick={() => speak(message)}
                          disabled={isPreparingVoice}
                        >
                          {isPreparingVoice && speakingId === message.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : speakingId === message.id ? (
                            isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          {isPreparingVoice && speakingId === message.id
                            ? 'Preparing voice...'
                            : speakingId === message.id
                            ? (isPaused ? 'Resume' : 'Pause')
                            : 'Play Voice'}
                        </Button>

                        {speakingId === message.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                            onClick={stopSpeaking}
                          >
                            <VolumeX className="w-3.5 h-3.5" /> Stop
                          </Button>
                        )}

                        {/* PDF download button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
                          onClick={() => downloadReportPDF(displayContent)}
                        >
                          <FileDown className="w-3.5 h-3.5" /> Download PDF
                        </Button>

                        {/* Volume slider when speaking */}
                        {speakingId === message.id && (
                          <div className="flex items-center gap-2 ml-2">
                            <Volume2 className="w-3 h-3 text-muted-foreground" />
                            <Slider
                              value={[voiceVolume]}
                              onValueChange={(val) => setVoiceVolume(val[0])}
                              min={0}
                              max={100}
                              step={10}
                              className="w-20"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {lastError && !isLoading && (
          <div className="text-sm text-destructive mb-2">
            Chat failed: {typeof lastError === 'string' ? lastError : 'Unknown error'}
            {lastPrompt && (
              <Button variant="outline" size="sm" className="ml-2" onClick={() => sendMessage(lastPrompt!)}>
                Retry
              </Button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your report..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={isLoading || !inputValue.trim()} size="icon" variant="nephro">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
};
