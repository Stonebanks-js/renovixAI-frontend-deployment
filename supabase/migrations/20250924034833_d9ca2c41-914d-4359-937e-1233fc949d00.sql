-- Remove existing foreign key constraint if it exists
ALTER TABLE scan_sessions DROP CONSTRAINT IF EXISTS scan_sessions_user_id_fkey;

-- Add proper foreign key constraint to profiles table instead of auth.users
ALTER TABLE scan_sessions 
ADD CONSTRAINT scan_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Ensure we have a function to create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    gender,
    marital_status,
    date_of_birth
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'User'),
    'Not specified',
    'Not specified',
    CURRENT_DATE - INTERVAL '25 years'
  );
  RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();