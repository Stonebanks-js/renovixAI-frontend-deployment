import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getDocument } from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

interface ScanResults {
  diagnosis: string;
  confidence: number;
  findings: Record<string, any>;
  recommendations: string;
}

interface ScanSession {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

const extractPdfText = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const loadingTask = getDocument({ data: buffer, disableWorker: true } as any);
  const pdf = await (loadingTask as any).promise;
  let fullText = '';
  const maxPages = Math.min(pdf.numPages || 0, 20);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = (content.items as any[]).map((it: any) => (it.str ? it.str : '')).join(' ');
    fullText += `\n\nPage ${i}:\n${strings}`;
  }
  return fullText.trim();
};

// OCR fallback for scanned PDFs using Tesseract.js (first 3 pages)
const ocrPdfToText = async (file: File, maxPages = 3): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const loadingTask = getDocument({ data: buffer, disableWorker: true } as any);
    const pdf = await (loadingTask as any).promise;
    let ocrText = '';
    const pages = Math.min(pdf.numPages || 0, maxPages);

    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(viewport.width, viewport.height)
        : (() => {
            const c = document.createElement('canvas');
            c.width = viewport.width;
            c.height = viewport.height;
            return c;
          })();
      const ctx = (canvas as any).getContext('2d');
      await page.render({ canvasContext: ctx, viewport } as any).promise;
      const dataUrl = (canvas as any).toDataURL('image/png');
      const { data } = await Tesseract.recognize(dataUrl, 'eng');
      if (data?.text) ocrText += `\n\nPage ${i} OCR:\n${data.text}`;
    }
    return ocrText.trim();
  } catch (e) {
    console.error('OCR extraction failed:', e);
    return '';
  }
};

export const useScanAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<ScanResults | null>(null);
  const [currentSession, setCurrentSession] = useState<ScanSession | null>(null);
  const { toast } = useToast();

  const uploadImageAndAnalyze = useCallback(async (file: File) => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisResults(null);

      // Validation: File size check (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('file_too_large');
      }

      // Validation: File type check
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/dicom'];
      const validDocTypes = ['application/pdf'];
      const isValidImage = validImageTypes.includes(file.type);
      const isValidDoc = validDocTypes.includes(file.type);
      
      if (!isValidImage && !isValidDoc) {
        throw new Error('invalid_file_type');
      }

      console.log('Starting upload and analysis for file:', file.name, 'Type:', file.type, 'Size:', file.size);

      // Get current user (optional - can be null for anonymous uploads)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;
      
      console.log('Upload initiated by:', userId ? `user ${userId}` : 'anonymous user');

      // Step 1: Create scan session
      console.log('Step 1: Creating scan session...');
      setAnalysisProgress(5);
      
      const { data: session, error: sessionError } = await supabase
        .from('scan_sessions')
        .insert({
          user_id: userId,
          status: 'pending'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        throw new Error(`create_session_failed: ${sessionError.message}`);
      }

      console.log('Session created successfully:', session.id);
      setCurrentSession(session as ScanSession);
      setAnalysisProgress(10);

      // Step 2: Upload image to storage
      console.log('Step 2: Uploading file to storage...');
      const uploadPath = userId ? `${userId}/${session.id}` : `anonymous/${session.id}`;
      const fileName = `${uploadPath}/${Date.now()}-${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medical-scans')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`upload_failed: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', uploadData.path);
      setAnalysisProgress(15);

      // Step 3: Store image metadata
      console.log('Step 3: Storing image metadata...');
      const { error: imageError } = await supabase
        .from('scan_images')
        .insert({
          session_id: session.id,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          storage_path: fileName
        });

      if (imageError) {
        console.error('Image metadata error:', imageError);
        throw new Error(`metadata_failed: ${imageError.message}`);
      }

      console.log('Image metadata stored successfully');
      setAnalysisProgress(20);

// Step 3.5: If PDF, extract text client-side for better AI analysis (with OCR fallback)
let extractedPdfText: string | undefined;
if (isValidDoc) {
  console.log('Extracting text from PDF for AI analysis...');
  setAnalysisProgress(25);
  try {
    const rawText = await extractPdfText(file);
    let finalText = rawText;

    if (!finalText || finalText.trim().length < 50) {
      console.warn('PDF appears to be scanned or has minimal text. Running OCR fallback...');
      setAnalysisProgress(28);
      const ocrText = await ocrPdfToText(file);
      if (ocrText && ocrText.trim().length > 0) {
        finalText = (finalText ? finalText + '\n\n' : '') + ocrText;
      }
    }

    if (finalText && finalText.trim().length > 0) {
      extractedPdfText = finalText;
      console.log('PDF text prepared, length:', extractedPdfText.length);
      setAnalysisProgress(30);
    } else {
      throw new Error('pdf_text_unreadable');
    }
  } catch (e) {
    console.error('PDF text extraction failed (including OCR):', e);
    throw e instanceof Error ? e : new Error('pdf_text_unreadable');
  }
}

// Step 4: Start analysis via edge function
console.log('Step 4: Starting AI analysis...');
const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-scan', {
  body: { sessionId: session.id, ...(extractedPdfText ? { pdfText: extractedPdfText } : {}) }
});

      if (analysisError) {
        console.error('Analysis invocation error:', analysisError);
        throw new Error(`analysis_start_failed: ${analysisError.message}`);
      }

      console.log('Analysis started successfully:', analysisData);

      // Set up real-time subscription to track progress
      const channel = supabase
        .channel(`scan-session-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'scan_sessions',
            filter: `id=eq.${session.id}`
          },
          (payload) => {
            const updatedSession = payload.new as any;
            console.log('Session update:', updatedSession);
            setAnalysisProgress(updatedSession.progress);
            
            if (updatedSession.status === 'completed') {
              fetchResults(session.id);
            } else if (updatedSession.status === 'failed') {
              setIsAnalyzing(false);
              toast({
                title: "Analysis Failed",
                description: "The AI analysis encountered an error. Please try again with a different image.",
                variant: "destructive",
              });
            }
          }
        )
        .subscribe();

      // Clean up subscription after analysis
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error('Error during scan analysis:', error);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      
      // Specific error messages based on error codes
      let errorMessage = "Failed to upload and start the analysis.";
      let errorTitle = "Upload Failed";
      
      if (error instanceof Error) {
        console.log('Caught error:', error.message);
        
        // Check for specific error codes
        if (error.message === 'file_too_large') {
          errorTitle = "File Too Large";
          errorMessage = "The selected file exceeds 10MB. Please choose a smaller file.";
        } else if (error.message === 'invalid_file_type') {
          errorTitle = "Invalid File Type";
          errorMessage = "Please upload a valid medical scan (JPG, PNG, DICOM) or PDF pathology report.";
        } else if (error.message.includes('create_session_failed')) {
          errorTitle = "Session Creation Failed";
          errorMessage = "Unable to create a scan session. Please try again or contact support.";
        } else if (error.message.includes('upload_failed')) {
          errorTitle = "Upload Failed";
          errorMessage = "File upload failed. Please check your connection and try again.";
        } else if (error.message.includes('metadata_failed')) {
          errorTitle = "Metadata Error";
          errorMessage = "Failed to store file information. Please try again.";
        } else if (error.message.includes('pdf_text_unreadable')) {
          errorTitle = "Unreadable PDF";
          errorMessage = "Your PDF is scanned or image-only. Please upload a text-based PDF or a clear image/photo of the report.";
        } else if (error.message.includes('pdf_text_missing')) {
          errorTitle = "PDF Text Missing";
          errorMessage = "We couldn't extract text from the PDF. Try another file or upload as image (JPG/PNG).";
        } else if (error.message.includes('analysis_start_failed')) {
          errorTitle = "Analysis Error";
          errorMessage = "Unable to start AI analysis. The service may be temporarily unavailable.";
        } else {
          errorMessage = (error as any)?.message || errorMessage;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchResults = useCallback(async (sessionId: string) => {
    try {
      const { data: results, error } = await supabase
        .from('scan_results')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        throw new Error('Failed to fetch results');
      }

        setAnalysisResults({
          diagnosis: results.diagnosis,
          confidence: results.confidence,
          findings: results.findings as Record<string, any>,
          recommendations: results.recommendations
        });

      setIsAnalyzing(false);
      setAnalysisProgress(100);

      toast({
        title: "Analysis Complete",
        description: "Your scan has been successfully analyzed.",
      });

    } catch (error) {
      console.error('Error fetching results:', error);
      setIsAnalyzing(false);
      toast({
        title: "Error",
        description: "Failed to retrieve analysis results.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const resetAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    setAnalysisResults(null);
    setCurrentSession(null);
  }, []);

  return {
    isAnalyzing,
    analysisProgress,
    analysisResults,
    currentSession,
    uploadImageAndAnalyze,
    resetAnalysis
  };
};