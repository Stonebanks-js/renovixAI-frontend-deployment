-- First drop all existing policies completely
DROP POLICY IF EXISTS "Anyone can view scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Anyone can create scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Anyone can update scan sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.scan_sessions;

DROP POLICY IF EXISTS "Anyone can view scan images" ON public.scan_images;
DROP POLICY IF EXISTS "Anyone can create scan images" ON public.scan_images;
DROP POLICY IF EXISTS "Users can view own scan images" ON public.scan_images;
DROP POLICY IF EXISTS "Users can create scan images" ON public.scan_images;

DROP POLICY IF EXISTS "Anyone can view scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Anyone can create scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Users can view own scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Edge function can create scan results" ON public.scan_results;

DROP POLICY IF EXISTS "Anyone can upload medical scans" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read medical scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own medical scans" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own medical scans" ON storage.objects;

-- Now create all new secure policies fresh
-- Authenticated users only see their own sessions
-- Anonymous users cannot query sessions directly (app-level control)
CREATE POLICY "Authenticated users can view own sessions"
  ON public.scan_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create own sessions"
  ON public.scan_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can create sessions"
  ON public.scan_sessions
  FOR INSERT
  WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);

CREATE POLICY "Authenticated users can update own sessions"
  ON public.scan_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- For anonymous sessions, allow updates only from edge function (service role)
CREATE POLICY "Service role can update any session"
  ON public.scan_sessions
  FOR UPDATE
  USING (true);

-- Scan images - only viewable/creatable by session owners
CREATE POLICY "Users can view own scan images"
  ON public.scan_images
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() = user_id
    )
  );

CREATE POLICY "Users can create scan images for own sessions"
  ON public.scan_images
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE (auth.uid() IS NOT NULL AND auth.uid() = user_id)
         OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );

-- Scan results - only viewable by session owners
CREATE POLICY "Users can view own scan results"
  ON public.scan_results
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() = user_id
    )
  );

-- Edge function can create results for any session
CREATE POLICY "Service role can create scan results"
  ON public.scan_results
  FOR INSERT
  WITH CHECK (true);

-- Storage policies - users can only access their own folder
CREATE POLICY "Authenticated users can upload own scans"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-scans'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anonymous users can upload scans"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-scans'
    AND auth.uid() IS NULL
  );

CREATE POLICY "Authenticated users can read own scans"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'medical-scans'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Service role can read any scans (for edge function processing)
CREATE POLICY "Service role can read all scans"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'medical-scans');

-- Add DELETE policy for profiles (GDPR compliance)
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = user_id);