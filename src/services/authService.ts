
import { supabase } from '@/integrations/supabase/client';

export const getAccessToken = async (): Promise<string | null> => {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get ERPNext credentials using the secure function
    const { data: credentials, error } = await supabase.rpc('get_user_erpnext_credentials');
    
    if (error) {
      console.error('Error getting ERPNext credentials:', error);
      return null;
    }

    const profile = credentials?.[0];
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

    // Use the secure function to get decrypted credentials
    const { data: credentials, error } = await supabase.rpc('get_user_erpnext_credentials');
    
    if (error) {
      console.error('Error getting ERPNext credentials:', error);
      return null;
    }

    return credentials?.[0] || null;
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

    // Use the secure function to update encrypted credentials with audit logging
    const { error } = await supabase.rpc('update_user_erpnext_credentials', {
      p_erpnext_url: config.erpnext_url,
      p_erpnext_api_key: config.erpnext_api_key,
      p_erpnext_api_secret: config.erpnext_api_secret,
      p_erpnext_default_company: config.erpnext_default_company,
      p_erpnext_pallet_template_item: config.erpnext_pallet_template_item
    });

    if (error) throw error;

    // Security: All credentials are now encrypted and stored securely with audit logging
    // No sensitive data is stored in localStorage or plaintext in the database

    return { success: true };
  } catch (error) {
    console.error('Error saving ERPNext config:', error);
    return { success: false, error };
  }
};
