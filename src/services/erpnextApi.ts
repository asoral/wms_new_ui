
import { ERPNextAPI } from './erp/erpnext/index';
import { supabase } from '../integrations/supabase/client';

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('erpnext_url, erpnext_api_key, erpnext_api_secret')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.erpnext_url || !profile.erpnext_api_key || !profile.erpnext_api_secret) {
      console.error('ERPNext configuration not found or incomplete');
      return null;
    }

    const api = new ERPNextAPI(
      profile.erpnext_url,
      profile.erpnext_api_key,
      profile.erpnext_api_secret
    );

    return api;
  } catch (error) {
    console.error('Failed to create ERPNext API:', error);
    return null;
  }
};

export const getUserDefaultCompany = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('erpnext_default_company')
      .eq('id', user.id)
      .single();

    return profile?.erpnext_default_company || null;
  } catch (error) {
    console.error('Failed to get user default company:', error);
    return null;
  }
};
