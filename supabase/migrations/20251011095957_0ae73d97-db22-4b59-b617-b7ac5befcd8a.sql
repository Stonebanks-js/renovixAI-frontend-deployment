-- Create storage policies for medical-scans bucket if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can upload their own medical scans'
  ) THEN
    CREATE POLICY "Users can upload their own medical scans"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'medical-scans'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Users can read their own medical scans'
  ) THEN
    CREATE POLICY "Users can read their own medical scans"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'medical-scans'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;