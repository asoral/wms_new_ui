
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthContext';

interface SubscriptionContextType {
  hasAccess: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  subscribed: boolean;
  paymentExempt: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  createCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, session } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [paymentExempt, setPaymentExempt] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  const refreshSubscription = async () => {
    // Don't check subscription for unauthenticated users
    if (!user || !session) {
      setHasAccess(true); // Allow access to public routes
      setLoading(false);
      return;
    }

    // Check subscription every 30 minutes for regular license validation
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    if (now - lastCheckTime < thirtyMinutes && hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      setHasAccess(data.hasAccess || false);
      setIsTrialActive(data.isTrialActive || false);
      setTrialDaysLeft(data.trialDaysLeft || 0);
      setSubscribed(data.subscribed || false);
      setPaymentExempt(data.paymentExempt || false);
      setSubscriptionEnd(data.subscriptionEnd || null);
      setLastCheckTime(now);
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Security: Deny access on subscription check errors for authenticated users
      setHasAccess(false);
      setIsTrialActive(false);
      setSubscribed(false);
      setPaymentExempt(false);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    try {
      console.log('Invoking create-checkout function...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const checkoutPromise = supabase.functions.invoke('create-checkout');
      
      const result = await Promise.race([checkoutPromise, timeoutPromise]);
      const { data, error } = result;
      
      console.log('Checkout response:', { data, error });
      
      if (error) {
        console.error('Checkout function error:', error);
        throw error;
      }
      
      // Use window.location.href instead of window.open to avoid popup blockers
      if (data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No checkout URL received:', data);
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      // If timeout, try direct fetch as fallback
      if (error.message === 'Request timeout') {
        console.log('Trying direct fetch as fallback...');
        try {
          const response = await fetch(`https://wqsyuqzrxntuwcohoycl.supabase.co/functions/v1/create-checkout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxc3l1cXpyeG50dXdjb2hveWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NDM0OTcsImV4cCI6MjA2NDQxOTQ5N30.YhIJqqe_n2aYQeed7pl1LVx7yTYGFN3y0X--2oFuer8',
              'Content-Type': 'application/json'
            }
          });
          const fallbackData = await response.json();
          if (fallbackData?.url) {
            console.log('Fallback redirect to:', fallbackData.url);
            window.location.href = fallbackData.url;
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  // Only check subscription on initial load and user login/logout
  useEffect(() => {
    let mounted = true;
    
    const checkSubscription = async () => {
      if (mounted) {
        await refreshSubscription();
      }
    };

    // For unauthenticated users, just set loading to false and allow access
    if (!user) {
      setHasAccess(true);
      setLoading(false);
      return;
    }

    // Only run subscription check for authenticated users
    if (!hasAccess || lastCheckTime === 0) {
      checkSubscription();
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [user?.id]); // Only trigger on user ID change, not on every session change

  // Regular license checking every 30 minutes when app is active
  useEffect(() => {
    if (!user || !session) return;

    const licenseCheckInterval = setInterval(() => {
      console.log('Regular license check triggered');
      refreshSubscription();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(licenseCheckInterval);
  }, [user?.id, session]);

  // Handle window focus to refresh subscription only if it's been a while
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      if (now - lastCheckTime > thirtyMinutes) {
        refreshSubscription();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [lastCheckTime]);

  const value = {
    hasAccess,
    isTrialActive,
    trialDaysLeft,
    subscribed,
    paymentExempt,
    subscriptionEnd,
    loading,
    refreshSubscription,
    createCheckout,
    openCustomerPortal,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
