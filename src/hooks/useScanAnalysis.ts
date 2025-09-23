import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Create scan session
      const { data: session, error: sessionError } = await supabase
        .from('scan_sessions')
        .insert({
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error('Failed to create scan session');
      }

      setCurrentSession(session as ScanSession);

      // Upload image to storage
      const fileName = `${user.id}/${session.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('medical-scans')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error('Failed to upload image');
      }

      // Store image metadata
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
        throw new Error('Failed to store image metadata');
      }

      // Start analysis via edge function
      const { error: analysisError } = await supabase.functions.invoke('analyze-scan', {
        body: { sessionId: session.id }
      });

      if (analysisError) {
        throw new Error('Failed to start analysis');
      }

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
            setAnalysisProgress(updatedSession.progress);
            
            if (updatedSession.status === 'completed') {
              fetchResults(session.id);
            } else if (updatedSession.status === 'failed') {
              setIsAnalyzing(false);
              toast({
                title: "Analysis Failed",
                description: "The scan analysis could not be completed. Please try again.",
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
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
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