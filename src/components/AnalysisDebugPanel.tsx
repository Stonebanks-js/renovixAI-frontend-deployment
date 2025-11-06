import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

export interface AnalysisDebug {
  steps: string[];
  pdfTextLength?: number;
  ocrUsed?: boolean;
  ocrPages?: number;
  aiMode?: 'pdfText' | 'image';
  aiModel?: string;
  sessionId?: string;
  storagePath?: string;
  error?: string;
}

export const AnalysisDebugPanel = ({
  debug,
  progress,
  isAnalyzing,
}: {
  debug: AnalysisDebug;
  progress: number;
  isAnalyzing: boolean;
}) => {
  const copyAll = async () => {
    const payload = JSON.stringify({ ...debug, progress, isAnalyzing }, null, 2);
    await navigator.clipboard.writeText(payload);
  };

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">Analysis Debug</h4>
          {isAnalyzing ? (
            <Badge variant="secondary">Running</Badge>
          ) : (
            <Badge variant="outline">Idle</Badge>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={copyAll}>
          <Copy className="w-4 h-4 mr-2" /> Copy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">Progress</div>
          <div className="font-medium">{progress}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Mode / Model</div>
          <div className="font-medium">{debug.aiMode || '—'} / {debug.aiModel || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">PDF Text Length</div>
          <div className="font-medium">{debug.pdfTextLength ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">OCR</div>
          <div className="font-medium">{debug.ocrUsed ? `Yes (${debug.ocrPages || 0} pages)` : 'No'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Session</div>
          <div className="font-medium break-all">{debug.sessionId || '—'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Storage Path</div>
          <div className="font-medium break-all">{debug.storagePath || '—'}</div>
        </div>
      </div>

      {debug.error && (
        <div className="mt-3 text-sm text-destructive">
          Error: {debug.error}
        </div>
      )}

      <Separator className="my-3" />

      <div>
        <div className="text-sm text-muted-foreground mb-1">Steps</div>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {debug.steps.length ? debug.steps.map((s, i) => (
            <li key={i}>{s}</li>
          )) : <li>No steps recorded yet.</li>}
        </ul>
      </div>
    </Card>
  );
};
