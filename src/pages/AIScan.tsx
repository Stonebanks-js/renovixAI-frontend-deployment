import React, { useState, useRef } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, Brain, CheckCircle, AlertCircle, Loader2, Sparkles, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScanAnalysis } from '@/hooks/useScanAnalysis';

const AIScan = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  
  const {
    isAnalyzing,
    analysisProgress,
    analysisResults,
    uploadImageAndAnalyze,
    resetAnalysis
  } = useScanAnalysis();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        setSelectedFile(file);
        
        if (file.type === 'application/pdf') {
          setPreviewUrl(''); // No preview for PDF
        } else {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
        resetAnalysis();
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, DICOM) or PDF pathology report",
          variant: "destructive"
        });
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    
    try {
      await uploadImageAndAnalyze(selectedFile);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    resetAnalysis();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
        <div className="container-medical relative">
          <div className="text-center max-w-3xl mx-auto animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6 border border-white/20">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">AI-Powered Diagnostics</span>
            </div>
            <h1 className="heading-nephro mb-6">
              AI-Powered 
              <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
                {" "}Kidney Scan Analysis
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Upload your kidney scan images and receive instant AI-powered diagnostic insights. 
              Our advanced algorithms analyze medical imaging with 97.5% accuracy.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding bg-gradient-to-b from-background to-muted/30">
        <div className="container-medical">
          <div className="max-w-4xl mx-auto">
            
            {/* Upload Section */}
            <Card className="card-nephro p-8 mb-8 hover-scale animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">Upload Medical Scan</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Area */}
                <div>
                  <div 
                    className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 hover-scale"
                    onClick={handleUploadClick}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.dcm,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {selectedFile ? (
                      <div className="space-y-4">
                        {selectedFile.type === 'application/pdf' ? (
                          <div className="flex flex-col items-center space-y-3">
                            <FileImage className="h-16 w-16 text-primary" />
                            <div className="text-center">
                              <p className="font-medium text-foreground">PDF Pathology Report</p>
                              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <img 
                              src={previewUrl} 
                              alt="Scan preview" 
                              className="max-w-full h-48 object-contain mx-auto rounded-lg"
                            />
                            <p className="text-sm text-muted-foreground">
                              File: {selectedFile?.name}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <FileImage className="h-16 w-16 text-primary/50 mx-auto" />
                        <div>
                          <p className="text-lg font-medium text-foreground mb-2">
                            Drop your scan or pathology report here
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Supports JPG, PNG, DICOM images or PDF pathology reports up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedFile && !isAnalyzing && !analysisResults && (
                    <Button 
                      variant="nephro" 
                      size="lg" 
                      className="w-full mt-4 hover-scale"
                      onClick={handleAnalyze}
                    >
                      <Brain className="h-5 w-5 mr-2" />
                      Analyze Scan
                    </Button>
                  )}
                </div>

                {/* Instructions */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Upload Guidelines</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        High-quality kidney scan images (CT, MRI, Ultrasound)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        PDF pathology reports from laboratories
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        DICOM format preferred for medical images
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        Ensure patient information is de-identified
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        File size should not exceed 10MB
                      </li>
                    </ul>
                  </div>

                  <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Privacy & Security</h4>
                        <p className="text-sm text-muted-foreground">
                          All uploaded images are processed securely and automatically deleted 
                          after analysis. We maintain HIPAA compliance standards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <Card className="p-8 mb-8">
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <h3 className="text-xl font-semibold text-foreground">
                      Analyzing Scan...
                    </h3>
                  </div>
                  
                  <div className="max-w-md mx-auto space-y-2">
                    <Progress value={analysisProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {analysisProgress < 30 && "Processing image..."}
                      {analysisProgress >= 30 && analysisProgress < 60 && "Extracting features..."}
                      {analysisProgress >= 60 && analysisProgress < 90 && "Running AI analysis..."}
                      {analysisProgress >= 90 && "Generating report..."}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Analysis Results */}
            {analysisResults && (
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl p-8 border border-blue-100">
                <div className="flex items-center mb-6">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Medical Analysis Report
                  </h2>
                </div>
                
                <div className="space-y-8">
                  {/* Diagnosis Section */}
                  <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Primary Diagnosis
                    </h3>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-3">
                      <p className="text-xl font-semibold text-blue-700">{analysisResults.diagnosis}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600">Diagnostic Confidence:</span>
                      <div className="ml-3 flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${analysisResults.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {(analysisResults.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Findings */}
                  <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Clinical Findings
                    </h3>
                    <div className="grid gap-4">
                      {Object.entries(analysisResults.findings).map(([key, value]) => (
                        <div key={key} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="font-semibold text-gray-700 mb-2 capitalize text-sm tracking-wide">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <p className="text-gray-800 leading-relaxed">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Health Recommendations */}
                  <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-purple-500">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Health Recommendations & Next Steps
                    </h3>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                      <div className="prose prose-lg max-w-none">
                        <p className="text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                          {analysisResults.recommendations}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Important Notice */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                    <div className="flex items-start">
                      <div className="w-6 h-6 text-amber-600 mr-3 mt-1">⚠️</div>
                      <div>
                        <h4 className="font-bold text-amber-800 mb-2">Important Medical Disclaimer</h4>
                        <p className="text-amber-700 text-sm leading-relaxed">
                          This AI analysis is for informational purposes only and should not replace professional medical consultation. 
                          Always consult with qualified healthcare professionals for proper diagnosis and treatment planning.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="nephro" size="lg" className="w-full hover-scale">
                      <FileImage className="h-5 w-5 mr-2" />
                      Download Report
                    </Button>
                    <Button variant="outline" size="lg" className="w-full hover-scale" onClick={handleReset}>
                      <Upload className="h-5 w-5 mr-2" />
                      Analyze Another Scan
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIScan;