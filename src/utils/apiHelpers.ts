
// Utility functions for handling API responses consistently
export interface APIResponse<T = any> {
  data?: T;
  message?: string;
  status?: string;
}

export const handleAPIResponse = <T>(response: unknown): APIResponse<T> => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response as APIResponse<T>;
  }
  
  // If response doesn't have expected structure, wrap it
  return { data: response as T };
};

export const extractDataFromResponse = <T>(response: unknown): T[] => {
  const apiResponse = handleAPIResponse<T[]>(response);
  return apiResponse.data || [];
};

export const extractSingleFromResponse = <T>(response: unknown): T | null => {
  const apiResponse = handleAPIResponse<T>(response);
  return apiResponse.data || null;
};
