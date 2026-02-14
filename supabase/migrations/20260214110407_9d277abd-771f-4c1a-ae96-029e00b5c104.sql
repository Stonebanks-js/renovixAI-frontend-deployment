
-- Remove anonymous storage upload policy
DROP POLICY IF EXISTS "Anonymous users can upload scans" ON storage.objects;
