import DOMPurify from 'dompurify';

/**
 * Secure HTML sanitization using DOMPurify
 * Prevents XSS attacks by sanitizing HTML content
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Sanitize user input for safe storage and display
 * Removes potentially dangerous characters and scripts
 */
export const sanitizeUserInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and sanitize
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  return sanitized.trim();
};

/**
 * Validate and sanitize URL input
 * Ensures URL is safe and properly formatted
 */
export const validateAndSanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const sanitized = sanitizeUserInput(url);
    const urlObj = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
};

/**
 * Sanitize ERPNext credentials
 * Removes potentially dangerous characters from API credentials
 */
export const sanitizeCredentials = (credentials: {
  url?: string;
  apiKey?: string;
  apiSecret?: string;
  company?: string;
}) => {
  return {
    url: credentials.url ? validateAndSanitizeUrl(credentials.url) : null,
    apiKey: credentials.apiKey ? sanitizeUserInput(credentials.apiKey) : null,
    apiSecret: credentials.apiSecret ? sanitizeUserInput(credentials.apiSecret) : null,
    company: credentials.company ? sanitizeUserInput(credentials.company) : null,
  };
};