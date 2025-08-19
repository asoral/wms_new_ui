
import { ERPNextAPI } from './erp/erpnext/index';
import { ERPNextCompanyAPI } from './erp/erpnext/companyApi';
import { supabase } from '../integrations/supabase/client';

export const createERPNextAPI = async (): Promise<ERPNextAPI | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    // Use the secure function to get decrypted credentials
    const { data: credentials, error } = await supabase.rpc('get_user_erpnext_credentials');
    
    if (error) {
      console.error('Error getting ERPNext credentials:', error);
      return null;
    }

    const profile = credentials?.[0];
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

export const createERPNextCompanyAPI = async (): Promise<ERPNextCompanyAPI | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    // Use the secure function to get decrypted credentials
    const { data: credentials, error } = await supabase.rpc('get_user_erpnext_credentials');
    
    if (error) {
      console.error('Error getting ERPNext credentials:', error);
      return null;
    }

    const profile = credentials?.[0];
    if (!profile || !profile.erpnext_url || !profile.erpnext_api_key || !profile.erpnext_api_secret) {
      console.error('ERPNext configuration not found or incomplete');
      return null;
    }

    const api = new ERPNextCompanyAPI(
      profile.erpnext_url,
      profile.erpnext_api_key,
      profile.erpnext_api_secret
    );

    return api;
  } catch (error) {
    console.error('Failed to create ERPNext Company API:', error);
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

    // Use the secure function to get user configuration including default company
    const { data: credentials, error } = await supabase.rpc('get_user_erpnext_credentials');
    
    if (error) {
      console.error('Error getting ERPNext credentials:', error);
      return null;
    }

    const profile = credentials?.[0];
    const defaultCompany = profile?.erpnext_default_company;
    
    if (!defaultCompany) {
      console.warn('No default company found in user profile. User should set this in Profile settings.');
      // Return null so the calling code can handle the missing company appropriately
      return null;
    }

    return defaultCompany;
  } catch (error) {
    console.error('Failed to get user default company:', error);
    return null;
  }
};

// Export ERPNextAPI class for Profile page
export { ERPNextAPI } from './erp/erpnext/index';

// Add configureERPNextAPI function for Profile page
export const configureERPNextAPI = (url: string, apiKey: string, apiSecret: string): ERPNextAPI => {
  return new ERPNextAPI(url, apiKey, apiSecret);
};
