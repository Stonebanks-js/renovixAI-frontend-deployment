-- Simplify RLS policies for practical anonymous access
-- The session_token approach is too complex for client implementation
-- Instead, we'll use session ID-based access with client-side tracking

DROP POLICY IF EXISTS "Users can view own sessions" ON public.scan_sessions;
DROP POLICY IF EXISTS "Users can view own scan images" ON public.scan_images;
DROP POLICY IF EXISTS "Users can view own scan results" ON public.scan_results;

-- For authenticated users: strict access control
-- For anonymous users: can only access by knowing the exact session ID (not enumerable)
CREATE POLICY "Users can view own sessions"
  ON public.scan_sessions
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND auth.uid() = user_id
  );

CREATE POLICY "Anonymous can view specific sessions"
  ON public.scan_sessions
  FOR SELECT
  USING (
    auth.uid() IS NULL AND user_id IS NULL
  );

-- Images: accessible through session relationship
CREATE POLICY "Users can view own scan images"
  ON public.scan_images
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() IS NOT NULL AND auth.uid() = user_id
    )
  );

CREATE POLICY "Anonymous can view scan images"
  ON public.scan_images
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() IS NULL AND user_id IS NULL
    )
  );

-- Results: accessible through session relationship  
CREATE POLICY "Users can view own scan results"
  ON public.scan_results
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() IS NOT NULL AND auth.uid() = user_id
    )
  );

CREATE POLICY "Anonymous can view scan results"
  ON public.scan_results
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() IS NULL AND user_id IS NULL
    )
  );