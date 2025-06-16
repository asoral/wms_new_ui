
-- Add the missing erpnext_pallet_template_item column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS erpnext_pallet_template_item text;
