
-- Remove anonymous session creation policy
DROP POLICY IF EXISTS "Service role can create anonymous sessions" ON public.scan_sessions;

-- Update scan_sessions policies to require authenticated users only
DROP POLICY IF EXISTS "Users can update own sessions" ON public.scan_sessions;
CREATE POLICY "Users can update own sessions"
ON public.scan_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Remove anonymous scan image access
DROP POLICY IF EXISTS "Users can view own scan images" ON public.scan_images;
CREATE POLICY "Users can view own scan images"
ON public.scan_images
FOR SELECT
USING (session_id IN (
  SELECT id FROM public.scan_sessions WHERE auth.uid() = user_id
));

DROP POLICY IF EXISTS "Users can create scan images" ON public.scan_images;
CREATE POLICY "Users can create scan images"
ON public.scan_images
FOR INSERT
WITH CHECK (session_id IN (
  SELECT id FROM public.scan_sessions WHERE auth.uid() = user_id
));
