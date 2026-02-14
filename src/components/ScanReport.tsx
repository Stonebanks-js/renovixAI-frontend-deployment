import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Download } from 'lucide-react';

interface ScanResults {
  diagnosis: string;
  confidence: number;
  findings: Record<string, any>;
  recommendations: string;
}

interface ScanReportProps {
  results: ScanResults;
  onReset: () => void;
}

const ScanReport: React.FC<ScanReportProps> = ({ results, onReset }) => {
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Moderate';
    return 'Needs Review';
  };

  const getRiskLevel = (diagnosis: string) => {
    const lower = diagnosis.toLowerCase();
    if (lower.includes('normal')) return { label: 'Low Risk', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (lower.includes('tumor') || lower.includes('suspicious')) return { label: 'High Risk', className: 'text-red-700 bg-red-50 border-red-200' };
    return { label: 'Moderate Risk', className: 'text-amber-700 bg-amber-50 border-amber-200' };
  };

  const risk = getRiskLevel(results.diagnosis);

  // Clean text: strip markdown artifacts, emojis, decorative symbols
  const cleanText = (text: string): string => {
    return text
      .replace(/#{1,6}\s*/g, '')       // remove markdown headings
      .replace(/\*{1,3}/g, '')         // remove bold/italic markers
      .replace(/_{1,3}/g, '')          // remove underline markers
      .replace(/---+/g, '')            // remove horizontal rules
      .replace(/```[\s\S]*?```/g, '')  // remove code blocks
      .replace(/[^\w\s.,;:!?()\-–—•·/\\%°\n\r'"&@+=$<>[\]{}]/g, '') // remove emojis/decorative chars
      .replace(/\n{3,}/g, '\n\n')      // normalize spacing
      .trim();
  };

  // Parse findings into clean bullet points
  const renderFindings = () => {
    return Object.entries(results.findings).map(([key, value]) => {
      const title = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
      const content = cleanText(String(value));
      return (
        <div key={key} className="mb-5">
          <p className="font-semibold text-foreground mb-1 capitalize">{title}</p>
          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">{content}</p>
        </div>
      );
    });
  };

  // Parse recommendations into bullet points
  const renderRecommendations = () => {
    const cleaned = cleanText(results.recommendations);
    const lines = cleaned
      .split(/\n/)
      .map(l => l.replace(/^[\s\-*•·]+/, '').trim())
      .filter(l => l.length > 0);

    if (lines.length <= 1) {
      return <p className="text-muted-foreground leading-relaxed text-sm">{cleaned}</p>;
    }

    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
            <span className="mt-1 text-primary">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="animate-fade-in-up max-w-3xl mx-auto">
      <Card className="border border-border/60 shadow-sm overflow-hidden">
        {/* Report Title */}
        <div className="px-8 pt-8 pb-6 border-b border-border/40">
          <h2 className="text-2xl font-bold text-foreground mb-1">AI Analysis Report</h2>
          <p className="text-sm text-muted-foreground">
            Generated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Condition Summary */}
          <section>
            <p className="font-semibold text-foreground mb-2">Condition Summary</p>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {cleanText(results.diagnosis)}
            </p>
          </section>

          {/* Confidence */}
          <section>
            <p className="font-semibold text-foreground mb-3">Diagnostic Confidence</p>
            <div className="flex items-center gap-4 mb-2">
              <Progress value={results.confidence * 100} className="h-2 flex-1" />
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {(results.confidence * 100).toFixed(1)}% — {getConfidenceLabel(results.confidence)}
              </span>
            </div>
          </section>

          {/* Key Findings */}
          <section>
            <p className="font-semibold text-foreground mb-3">Key Findings</p>
            <div className="pl-1">{renderFindings()}</div>
          </section>

          {/* Risk Level */}
          <section>
            <p className="font-semibold text-foreground mb-2">Risk Level</p>
            <span className={`inline-block px-3 py-1 rounded-md text-sm font-medium border ${risk.className}`}>
              {risk.label}
            </span>
          </section>

          {/* Recommendations */}
          <section>
            <p className="font-semibold text-foreground mb-3">Recommendations</p>
            <div className="pl-1">{renderRecommendations()}</div>
          </section>

          {/* Disclaimer */}
          <section className="bg-muted/40 rounded-lg p-5 border border-border/40">
            <p className="font-semibold text-foreground mb-2">Disclaimer</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This AI-powered analysis is for informational purposes only and should not replace
              professional medical advice, diagnosis, or treatment. Always consult a qualified
              healthcare provider for medical guidance. Do not delay seeking professional care
              based on AI analysis results.
            </p>
          </section>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="nephro" size="lg" className="w-full">
            <Download className="h-5 w-5 mr-2" />
            Download Full Report
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={onReset}>
            <Upload className="h-5 w-5 mr-2" />
            Analyze New Scan
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ScanReport;
