
import { supabase } from '@/integrations/supabase/client';

export const getAccessToken = async (): Promise<string | null> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get ERPNext credentials from the database
    const { data: profile } = await supabase
      .from('profiles')
      .select('erpnext_url, erpnext_api_key, erpnext_api_secret')
      .eq('id', user.id)
      .single();

    if (profile?.erpnext_url && profile?.erpnext_api_key && profile?.erpnext_api_secret) {
      // Return a token that indicates ERPNext is configured
      return `${profile.erpnext_api_key}:${profile.erpnext_api_secret}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

export const getERPNextConfig = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('erpnext_url, erpnext_api_key, erpnext_api_secret, erpnext_default_company, erpnext_pallet_template_item')
      .eq('id', user.id)
      .single();

    return profile;
  } catch (error) {
    console.error('Error getting ERPNext config:', error);
    return null;
  }
};

export const saveERPNextConfig = async (config: {
  erpnext_url: string;
  erpnext_api_key: string;
  erpnext_api_secret: string;
  erpnext_default_company?: string;
  erpnext_pallet_template_item?: string;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        erpnext_url: config.erpnext_url,
        erpnext_api_key: config.erpnext_api_key,
        erpnext_api_secret: config.erpnext_api_secret,
        erpnext_default_company: config.erpnext_default_company,
        erpnext_pallet_template_item: config.erpnext_pallet_template_item,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    // Security: Do not store sensitive credentials in localStorage
    // All credentials are now securely stored in the database with RLS protection

    return { success: true };
  } catch (error) {
    console.error('Error saving ERPNext config:', error);
    return { success: false, error };
  }
};
