
export const getAccessToken = async (): Promise<string | null> => {
  // For ERPNext integration, we check if credentials are configured
  const baseURL = localStorage.getItem('erpnextBaseURL');
  const apiKey = localStorage.getItem('erpnextApiKey');
  const apiSecret = localStorage.getItem('erpnextApiSecret');
  
  if (baseURL && apiKey && apiSecret) {
    // Return a token that indicates ERPNext is configured
    return `${apiKey}:${apiSecret}`;
  }
  
  return null;
};
