import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileImage, 
  Upload, 
  Activity,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Shield,
  Download
} from 'lucide-react';

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
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'from-emerald-500 to-green-600';
    if (confidence >= 0.8) return 'from-blue-500 to-cyan-600';
    if (confidence >= 0.7) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-orange-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Moderate';
    return 'Needs Review';
  };

  const getSeverityIcon = (diagnosis: string) => {
    const lower = diagnosis.toLowerCase();
    if (lower.includes('normal')) return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    if (lower.includes('tumor') || lower.includes('suspicious')) return <AlertCircle className="w-6 h-6 text-red-500" />;
    return <Activity className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-8 mb-1">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">
                AI Analysis Report
              </h2>
              <p className="text-muted-foreground">
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Card */}
      <Card className="border-x border-border/50 p-8">
        {/* Diagnosis Section */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="mt-1">
              {getSeverityIcon(results.diagnosis)}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Primary Diagnosis</h3>
              <p className="text-2xl font-bold text-foreground mb-4">
                {results.diagnosis}
              </p>
            </div>
          </div>

          {/* Confidence Meter */}
          <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Diagnostic Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getConfidenceColor(results.confidence)} text-white`}>
                  {getConfidenceLabel(results.confidence)}
                </span>
                <span className="text-2xl font-bold text-foreground">
                  {(results.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress 
              value={results.confidence * 100} 
              className="h-3"
            />
          </div>
        </div>

        {/* Clinical Findings Grid */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Clinical Findings & Observations
          </h3>
          <div className="space-y-3">
            {Object.entries(results.findings).map(([key, value], idx) => (
              <div 
                key={key}
                className="group relative overflow-hidden bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/40 rounded-xl p-5 border border-border/50 transition-all duration-300 hover-scale"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10" />
                <div className="relative">
                  <h4 className="text-sm font-bold text-primary mb-2 capitalize tracking-wide">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {String(value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Medical Recommendations
          </h3>
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-xl p-6 border border-primary/20">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {results.recommendations}
              </p>
            </div>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-amber-500/20 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
                Important Medical Disclaimer
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                This AI-powered analysis is designed to assist healthcare professionals and is for informational 
                purposes only. It should not be used as a substitute for professional medical advice, diagnosis, 
                or treatment. Always seek the guidance of qualified healthcare providers with any questions regarding 
                medical conditions. Never disregard professional medical advice or delay seeking it based on AI analysis results.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="nephro" 
            size="lg" 
            className="w-full hover-scale"
          >
            <Download className="h-5 w-5 mr-2" />
            Download Full Report
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full hover-scale" 
            onClick={onReset}
          >
            <Upload className="h-5 w-5 mr-2" />
            Analyze New Scan
          </Button>
        </div>
      </Card>

      {/* Footer Info */}
      <div className="rounded-b-2xl bg-muted/30 border-x border-b border-border/50 px-8 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>HIPAA Compliant • Data Encrypted</span>
          </div>
          <span>Report ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default ScanReport;
