
DROP POLICY "Service role can create scan results" ON public.scan_results;

CREATE POLICY "Validated insert for scan results"
ON public.scan_results
FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.scan_sessions WHERE user_id IS NOT NULL
  )
);
