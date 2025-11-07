import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageCircle, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CHAT_STREAM_URL = 'https://oaqukfylwosrslltqtws.functions.supabase.co/functions/v1/scan-chat-stream';

interface ScanChatInterfaceProps {
  sessionId: string;
  pdfText?: string;
  diagnosis?: string;
}

export const ScanChatInterface = ({ sessionId, pdfText, diagnosis }: ScanChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    const upsertAssistant = (delta: string) => {
      assistantSoFar += delta;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          const updated = prev.slice();
          updated[updated.length - 1] = { ...last, content: assistantSoFar } as Message;
          return updated;
        }
        return [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: assistantSoFar, timestamp: new Date() }
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
        const errMsg = await resp.text();
        setLastError(errMsg || 'Failed to start stream');
        toast({ title: 'Chat Error', description: 'Unable to start AI stream.', variant: 'destructive' });
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
            // partial JSON, put back and wait for more
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush for remaining lines without trailing newline
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
      toast({
        title: 'Chat Error',
        description: 'Failed during AI streaming. Please try again.',
        variant: 'destructive',
      });
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue("What do my test results mean?")}
                >
                  What do my test results mean?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue("What should I do next?")}
                >
                  What should I do next?
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue("Explain the findings in simple terms")}
                >
                  Explain the findings in simple terms
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
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
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            variant="nephro"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
