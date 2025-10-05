import React, { useState, useRef } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, Brain, CheckCircle, Loader2, Sparkles, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScanAnalysis } from '@/hooks/useScanAnalysis';
import ScanReport from '@/components/ScanReport';

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
              <ScanReport results={analysisResults} onReset={handleReset} />
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AIScan;