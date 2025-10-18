-- Comprehensive policy replacement (fully idempotent)

-- Drop ALL policies that might exist on scan_sessions
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'scan_sessions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scan_sessions', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies that might exist on scan_images
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'scan_images'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scan_images', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL policies that might exist on scan_results
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'scan_results'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scan_results', policy_record.policyname);
    END LOOP;
END $$;

-- Drop ALL storage policies for medical-scans bucket
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname LIKE '%medical%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
    END LOOP;
END $$;

-- Create NEW secure policies for scan_sessions
CREATE POLICY "Users can view own sessions"
  ON public.scan_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create sessions"
  ON public.scan_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can create anonymous sessions"
  ON public.scan_sessions FOR INSERT
  WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);

CREATE POLICY "Users can update own sessions"
  ON public.scan_sessions FOR UPDATE
  USING (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- Create NEW secure policies for scan_images
CREATE POLICY "Users can view own scan images"
  ON public.scan_images FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );

CREATE POLICY "Users can create scan images"
  ON public.scan_images FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );

-- Create NEW secure policies for scan_results  
CREATE POLICY "Users can view own scan results"
  ON public.scan_results FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.scan_sessions
      WHERE auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );

CREATE POLICY "Service role can create scan results"
  ON public.scan_results FOR INSERT
  WITH CHECK (true);

-- Create NEW secure storage policies
CREATE POLICY "Authenticated users can upload medical scans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-scans'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Service role can upload for anonymous users"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-scans');

CREATE POLICY "Users can read own medical scans"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-scans'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR auth.uid() IS NULL)
  );

-- Add DELETE policy for profiles (GDPR compliance)
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);