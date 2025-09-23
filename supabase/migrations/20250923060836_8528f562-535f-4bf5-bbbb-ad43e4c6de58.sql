-- Create scan sessions table
CREATE TABLE public.scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scan images table
CREATE TABLE public.scan_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scan results table
CREATE TABLE public.scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
  diagnosis TEXT NOT NULL,
  confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  findings JSONB NOT NULL DEFAULT '{}',
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health reports table
CREATE TABLE public.health_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL DEFAULT '{}',
  pdf_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scan_sessions
CREATE POLICY "Users can view their own scan sessions" 
ON public.scan_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scan sessions" 
ON public.scan_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan sessions" 
ON public.scan_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for scan_images
CREATE POLICY "Users can view their own scan images" 
ON public.scan_images 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM scan_sessions WHERE id = session_id));

CREATE POLICY "Users can create their own scan images" 
ON public.scan_images 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM scan_sessions WHERE id = session_id));

-- Create RLS policies for scan_results
CREATE POLICY "Users can view their own scan results" 
ON public.scan_results 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM scan_sessions WHERE id = session_id));

CREATE POLICY "Users can create their own scan results" 
ON public.scan_results 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM scan_sessions WHERE id = session_id));

-- Create RLS policies for health_reports
CREATE POLICY "Users can view their own health reports" 
ON public.health_reports 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM scan_sessions WHERE id = session_id));

CREATE POLICY "Users can create their own health reports" 
ON public.health_reports 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM scan_sessions WHERE id = session_id));

-- Create storage buckets for medical images
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-scans', 'medical-scans', false);

-- Create storage policies for medical scans
CREATE POLICY "Users can upload their own scans" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own scans" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own scans" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medical-scans' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_scan_sessions_updated_at
BEFORE UPDATE ON public.scan_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_scan_sessions_user_id ON public.scan_sessions(user_id);
CREATE INDEX idx_scan_sessions_status ON public.scan_sessions(status);
CREATE INDEX idx_scan_images_session_id ON public.scan_images(session_id);
CREATE INDEX idx_scan_results_session_id ON public.scan_results(session_id);
CREATE INDEX idx_health_reports_session_id ON public.health_reports(session_id);