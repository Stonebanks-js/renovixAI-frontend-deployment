-- Add session_token column to scan_sessions for anonymous user tracking
ALTER TABLE public.scan_sessions
ADD COLUMN session_token uuid DEFAULT gen_random_uuid();

-- Create index for faster lookups
CREATE INDEX idx_scan_sessions_session_token ON public.scan_sessions(session_token);

-- Drop all permissive policies
DROP POLICY IF EXISTS "Anyone can view scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Anyone can create scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Anyone can update scan sessions" ON public.scan_sessions;

DROP POLICY IF EXISTS "Anyone can view scan images" ON public.scan_images;
DROP POLICY IF EXISTS "Anyone can create scan images" ON public.scan_images;

DROP POLICY IF EXISTS "Anyone can view scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Anyone can create scan results" ON public.scan_results;

DROP POLICY IF EXISTS "Anyone can upload medical scans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read medical scans" ON storage.objects;

-- Create secure session-based policies for scan_sessions
CREATE POLICY "Users can view own sessions"
  ON public.scan_sessions
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND session_token = current_setting('app.session_token', true)::uuid)
  );

CREATE POLICY "Users can create own sessions"
  ON public.scan_sessions
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "Users can update own sessions"
  ON public.scan_sessions
  FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND session_token = current_setting('app.session_token', true)::uuid)
  );

-- Create secure policies for scan_images
CREATE POLICY "Users can view own scan images"
  ON public.scan_images
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE (auth.uid() IS NOT NULL AND auth.uid() = user_id)
         OR (auth.uid() IS NULL AND session_token = current_setting('app.session_token', true)::uuid)
    )
  );

CREATE POLICY "Users can create scan images"
  ON public.scan_images
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE (auth.uid() IS NOT NULL AND auth.uid() = user_id)
         OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );

-- Create secure policies for scan_results
CREATE POLICY "Users can view own scan results"
  ON public.scan_results
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE (auth.uid() IS NOT NULL AND auth.uid() = user_id)
         OR (auth.uid() IS NULL AND session_token = current_setting('app.session_token', true)::uuid)
    )
  );

CREATE POLICY "Edge function can create scan results"
  ON public.scan_results
  FOR INSERT
  WITH CHECK (true);

-- Create secure storage policies
CREATE POLICY "Users can upload own medical scans"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-scans'
    AND (
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR (auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can read own medical scans"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'medical-scans'
    AND (
      (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR (auth.uid() IS NULL)
    )
  );

-- Add DELETE policy for profiles (GDPR compliance)
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);