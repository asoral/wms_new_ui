
-- Add columns to store ERPNext credentials in the profiles table if they don't exist
-- First check if columns exist and add them if missing
DO $$ 
BEGIN
    -- Add erpnext_url if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'erpnext_url') THEN
        ALTER TABLE public.profiles ADD COLUMN erpnext_url text;
    END IF;
    
    -- Add erpnext_api_key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'erpnext_api_key') THEN
        ALTER TABLE public.profiles ADD COLUMN erpnext_api_key text;
    END IF;
    
    -- Add erpnext_api_secret if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'erpnext_api_secret') THEN
        ALTER TABLE public.profiles ADD COLUMN erpnext_api_secret text;
    END IF;
    
    -- Add erpnext_default_company if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'erpnext_default_company') THEN
        ALTER TABLE public.profiles ADD COLUMN erpnext_default_company text;
    END IF;
END $$;

-- Enable RLS on profiles table if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles table
-- Policy for users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy for users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy for users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
