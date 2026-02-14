import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Download } from 'lucide-react';
import { cleanText, valueToString, getRiskLevel, sanitizeForPdf } from '@/lib/sanitizeText';

interface KeyFinding {
  finding: string;
  value: string;
  significance: string;
}

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

  const risk = getRiskLevel(results.diagnosis, results.confidence);

  // Render structured key_findings array
  const renderKeyFindings = () => {
    const findings = results.findings;
    if (!findings || typeof findings !== 'object') {
      return <p className="text-muted-foreground text-sm italic">Key findings are being processed. Please re-analyze the report.</p>;
    }

    // Handle structured key_findings array
    const keyFindings: KeyFinding[] = findings.key_findings;
    if (Array.isArray(keyFindings) && keyFindings.length > 0) {
      return (
        <div className="space-y-4">
          {keyFindings.map((item, idx) => (
            <div key={idx} className="pl-4 border-l-2 border-primary/20">
              <p className="font-semibold text-foreground text-sm">{cleanText(item.finding)}</p>
              <p className="text-xs text-primary/80 mt-0.5">{cleanText(item.value)}</p>
              <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{cleanText(item.significance)}</p>
            </div>
          ))}
        </div>
      );
    }

    // Fallback: render findings as key-value pairs
    return Object.entries(findings).map(([key, value]) => {
      if (key === 'key_findings' || key === 'summary' || key === 'prognosis_and_implications') return null;
      const title = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
      const content = valueToString(value);
      return (
        <div key={key} className="mb-4">
          <p className="font-semibold text-foreground mb-1 capitalize text-sm">{title}</p>
          <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">{content}</p>
        </div>
      );
    }).filter(Boolean);
  };

  // Parse recommendations into bullet points
  const renderRecommendations = () => {
    if (!results.recommendations) {
      return <p className="text-muted-foreground text-sm italic">No recommendations available.</p>;
    }
    const cleaned = sanitizeForPdf(results.recommendations);
    const lines = cleaned
      .split(/\n/)
      .map(l => l.replace(/^[\s\-*•·\d.]+/, '').trim())
      .filter(l => l.length > 3);

    if (lines.length <= 1) {
      return <p className="text-muted-foreground leading-relaxed text-sm">{cleaned}</p>;
    }

    return (
      <ul className="space-y-2">
        {lines.map((line, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
            <span className="mt-1 text-primary font-bold">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );
  };

  // PDF Download handler
  const handleDownloadPdf = () => {
    const summary = results.findings?.summary ? sanitizeForPdf(valueToString(results.findings.summary)) : '';
    const keyFindings: KeyFinding[] = results.findings?.key_findings || [];
    const prognosis = results.findings?.prognosis_and_implications ? sanitizeForPdf(valueToString(results.findings.prognosis_and_implications)) : '';
    const recommendations = results.recommendations ? sanitizeForPdf(results.recommendations) : '';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const findingsText = keyFindings.map((f: KeyFinding) =>
      `  ${sanitizeForPdf(f.finding)}\n  Value: ${sanitizeForPdf(f.value)}\n  ${sanitizeForPdf(f.significance)}`
    ).join('\n\n');

    const content = [
      `RENOVIX AI - MEDICAL ANALYSIS REPORT`,
      `Generated: ${date}`,
      ``,
      `CONDITION SUMMARY`,
      sanitizeForPdf(results.diagnosis),
      summary ? `\n${summary}` : '',
      ``,
      `DIAGNOSTIC CONFIDENCE: ${(results.confidence * 100).toFixed(1)}% - ${getConfidenceLabel(results.confidence)}`,
      ``,
      `RISK LEVEL: ${risk.label}`,
      ``,
      `KEY FINDINGS`,
      findingsText || 'No significant findings detected',
      prognosis ? `\nPROGNOSIS\n${prognosis}` : '',
      ``,
      `RECOMMENDATIONS`,
      recommendations || 'No recommendations available.',
      ``,
      `DISCLAIMER`,
      `This AI-powered analysis is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical guidance.`,
    ].filter(Boolean).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Renovix-AI-Report-${date.replace(/\s/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in-up max-w-3xl mx-auto">
      <Card className="border border-border/60 shadow-sm overflow-hidden">
        {/* Report Title */}
        <div className="px-8 pt-8 pb-6 border-b border-border/40">
          <h2 className="text-2xl font-bold text-foreground mb-1">AI Analysis Report</h2>
          <p className="text-sm text-muted-foreground">
            Generated on {new Date().toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
            {results.findings?.summary && (
              <p className="text-muted-foreground leading-relaxed text-sm mt-2">
                {cleanText(valueToString(results.findings.summary))}
              </p>
            )}
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
            <div className="pl-1">{renderKeyFindings()}</div>
          </section>

          {/* Prognosis */}
          {results.findings?.prognosis_and_implications && (
            <section>
              <p className="font-semibold text-foreground mb-2">Prognosis</p>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {cleanText(valueToString(results.findings.prognosis_and_implications))}
              </p>
            </section>
          )}

          {/* Risk Level */}
          <section>
            <p className="font-semibold text-foreground mb-2">Risk Level</p>
            <span className={`inline-block px-3 py-1 rounded-md text-sm font-medium border ${risk.color}`}>
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
              healthcare provider for medical guidance.
            </p>
          </section>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button variant="nephro" size="lg" className="w-full" onClick={handleDownloadPdf}>
            <Download className="h-5 w-5 mr-2" />
            Download Report
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
