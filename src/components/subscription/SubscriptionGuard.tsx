
import { useSubscription } from './SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleSubscribe = async () => {
    try {
      await createCheckout();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle>Subscription Required</CardTitle>
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
                <Button onClick={handleSubscribe} className="w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscribe Now - $15/month
                </Button>
              )}

              <Button variant="outline" onClick={refreshSubscription} className="w-full">
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
