/*
  # Add profiles table for user onboarding and authentication

  1. New Tables
    - `profiles` - Store user profile information and onboarding status
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `username` (text, unique)
      - `display_name` (text)
      - `onboarding_complete` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to manage their own profile
    - Add trigger to automatically create profile when user signs up

  3. Functions
    - Create function to handle new user signup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  display_name text,
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;

-- Update existing user_preferences and user_stats to reference auth.users
DO $$
BEGIN
  -- Update user_preferences to use uuid and reference profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    -- For existing demo data, we'll keep user_id as text for now
  END IF;

  -- Update user_stats to use uuid and reference profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_stats' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE user_stats ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    -- For existing demo data, we'll keep user_id as text for now
  END IF;

  -- Update user_ratings to use uuid and reference profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_ratings' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE user_ratings ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    -- For existing demo data, we'll keep user_id as text for now
  END IF;

  -- Update user_badges to use uuid and reference profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_badges' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE user_badges ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
    -- For existing demo data, we'll keep user_id as text for now
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_complete);