/*
  # Fix username availability check

  1. New Functions
    - `check_username_availability` - Function to check if username exists without RLS restrictions
  
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only returns boolean, no sensitive data exposed
*/

-- Create function to check username availability without RLS restrictions
CREATE OR REPLACE FUNCTION public.check_username_availability(username_to_check text)
RETURNS boolean AS $$
DECLARE
  username_exists boolean;
BEGIN
  -- Check if username exists (case-insensitive)
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE LOWER(username) = LOWER(username_to_check)
  ) INTO username_exists;
  
  -- Return true if available (not exists), false if taken
  RETURN NOT username_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_username_availability(text) TO authenticated;