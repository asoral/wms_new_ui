// Utility functions to replace common hardcoded colors with semantic tokens

export const replaceCommonColors = (className: string): string => {
  return className
    // Text colors
    .replace(/text-gray-900/g, 'text-foreground')
    .replace(/text-gray-800/g, 'text-foreground')
    .replace(/text-gray-700/g, 'text-foreground')
    .replace(/text-gray-600/g, 'text-muted-foreground')
    .replace(/text-gray-500/g, 'text-muted-foreground')
    .replace(/text-gray-400/g, 'text-muted-foreground')
    
    // Background colors
    .replace(/bg-gray-50/g, 'bg-muted')
    .replace(/bg-gray-100/g, 'bg-muted')
    .replace(/bg-gray-200/g, 'bg-muted')
    .replace(/bg-white(?![/-])/g, 'bg-card')
    
    // Border colors
    .replace(/border-gray-200/g, 'border-border')
    .replace(/border-gray-300/g, 'border-border')
    
    // Hover states
    .replace(/hover:bg-gray-50/g, 'hover:bg-accent')
    .replace(/hover:bg-gray-100/g, 'hover:bg-accent');
};

// Common semantic class mappings
export const semanticColors = {
  text: {
    primary: 'text-foreground',
    secondary: 'text-muted-foreground',
    muted: 'text-muted-foreground',
  },
  background: {
    primary: 'bg-background',
    card: 'bg-card',
    muted: 'bg-muted',
    accent: 'bg-accent',
  },
  border: {
    default: 'border-border',
    muted: 'border-border',
  },
  hover: {
    accent: 'hover:bg-accent',
    muted: 'hover:bg-muted',
  }
};