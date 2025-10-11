-- Drop existing restrictive RLS policies
DROP POLICY IF EXISTS "Users can create their own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can view their own scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can update their own scan sessions" ON public.scan_sessions;

DROP POLICY IF EXISTS "Users can create their own scan images" ON public.scan_images;
DROP POLICY IF EXISTS "Users can view their own scan images" ON public.scan_images;

DROP POLICY IF EXISTS "Users can create their own scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Users can view their own scan results" ON public.scan_results;

-- Create new permissive policies for anonymous access

-- Allow anyone to create scan sessions (anonymous or authenticated)
CREATE POLICY "Anyone can create scan sessions"
  ON public.scan_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view their own sessions (matched by session ID in the app)
CREATE POLICY "Anyone can view scan sessions"
  ON public.scan_sessions
  FOR SELECT
  USING (true);

-- Allow anyone to update scan sessions (for progress tracking)
CREATE POLICY "Anyone can update scan sessions"
  ON public.scan_sessions
  FOR UPDATE
  USING (true);

-- Allow anyone to create scan images
CREATE POLICY "Anyone can create scan images"
  ON public.scan_images
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view scan images
CREATE POLICY "Anyone can view scan images"
  ON public.scan_images
  FOR SELECT
  USING (true);

-- Allow anyone to create scan results
CREATE POLICY "Anyone can create scan results"
  ON public.scan_results
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to view scan results
CREATE POLICY "Anyone can view scan results"
  ON public.scan_results
  FOR SELECT
  USING (true);

-- Update storage policies to allow anonymous uploads
DROP POLICY IF EXISTS "Users can upload their own medical scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own medical scans" ON storage.objects;

-- Allow anyone to upload to medical-scans bucket
CREATE POLICY "Anyone can upload medical scans"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'medical-scans');

-- Allow anyone to read from medical-scans bucket
CREATE POLICY "Anyone can read medical scans"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'medical-scans');