import { useSubscription } from './SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import TopBar from '@/components/TopBar';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

const SubscriptionGuard = ({ children }: SubscriptionGuardProps) => {
  const {
    hasAccess,
    isTrialActive,
    trialDaysLeft,
    subscribed,
    paymentExempt,
    loading,
    createCheckout,
    openCustomerPortal,
    refreshSubscription,
  } = useSubscription();
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Show minimal loading only on initial load
  if (loading && !hasAccess && !paymentExempt) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white shadow-lg rounded-lg p-3 flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Checking access...</span>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleSubscribe = async () => {
    if (isCheckingOut) return; // Prevent double clicks
    
    setIsCheckingOut(true);
    try {
      console.log('Starting checkout process...');
      await createCheckout();
      console.log('Checkout process completed');
      // Note: If successful, user should be redirected to Stripe
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Only reset loading state if still on page (not redirected)
      setTimeout(() => setIsCheckingOut(false), 2000);
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open customer portal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await refreshSubscription();
      // If access is granted after refresh, the component will automatically re-render
      // and show children instead of the subscription screen
      toast({
        title: "Status Updated",
        description: "Your subscription status has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh subscription status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold">Subscription Required</CardTitle>
            <CardDescription>
              {isTrialActive 
                ? `Your trial expires in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}`
                : 'Your trial has ended or subscription payment failed'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isTrialActive && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="w-4 h-4" />
                <AlertDescription className="text-yellow-800">
                  <strong>Trial ending soon!</strong> Subscribe now to continue using the app after your trial ends.
                </AlertDescription>
              </Alert>
            )}

            {!isTrialActive && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-red-800">
                  <strong>Access blocked!</strong> {subscribed 
                    ? 'Your payment method failed. Please update your payment information.'
                    : 'Please subscribe to continue using the app.'
                  }
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">WMS Monthly Subscription</h3>
              <div className="flex items-center justify-between mb-2">
                <span>Monthly Access</span>
                <Badge>$15.00/month</Badge>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Complete warehouse management system</li>
                <li>• Real-time inventory tracking</li>
                <li>• ERPNext integration</li>
                <li>• Mobile-friendly interface</li>
              </ul>
            </div>

            <div className="space-y-3">
              {subscribed ? (
                <Button onClick={handleManageSubscription} className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Update Payment Method
                </Button>
              ) : (
                <Button 
                  onClick={handleSubscribe} 
                  disabled={isCheckingOut}
                  className="w-full"
                >
                  {isCheckingOut ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {isCheckingOut ? 'Redirecting to Stripe...' : 'Subscribe Now - $15/month'}
                </Button>
              )}

              <Button variant="outline" onClick={handleRefreshStatus} className="w-full">
                Check Payment Status
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Secure payment processing by Stripe. Cancel anytime.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionGuard;