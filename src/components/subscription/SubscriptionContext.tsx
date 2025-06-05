
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

  const refreshSubscription = async () => {
    if (!user || !session) {
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
    } catch (error) {
      console.error('Error checking subscription:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
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

  // Only check subscription on login/user change
  useEffect(() => {
    refreshSubscription();
  }, [user, session]);

  // Remove the auto-refresh interval that was causing page refreshes

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
