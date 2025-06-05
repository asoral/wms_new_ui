
import { useSubscription } from './SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Clock, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SubscriptionStatus = () => {
  const {
    hasAccess,
    isTrialActive,
    trialDaysLeft,
    subscribed,
    paymentExempt,
    subscriptionEnd,
    loading,
    createCheckout,
    openCustomerPortal,
    refreshSubscription,
  } = useSubscription();
  const { toast } = useToast();

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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="text-center text-gray-500">Loading subscription status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Subscription Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Current Status:</span>
          {paymentExempt ? (
            <Badge className="bg-blue-100 text-blue-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Payment Exempt
            </Badge>
          ) : subscribed ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active Subscription
            </Badge>
          ) : isTrialActive ? (
            <Badge className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              Free Trial
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">
              Subscription Required
            </Badge>
          )}
        </div>

        {isTrialActive && !paymentExempt && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Trial ends in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Subscribe now to continue using the app after your trial ends.
            </p>
          </div>
        )}

        {subscribed && subscriptionEnd && (
          <div className="text-sm text-gray-600">
            <strong>Next billing:</strong> {new Date(subscriptionEnd).toLocaleDateString()}
          </div>
        )}

        <div className="space-y-2">
          {!subscribed && !paymentExempt && (
            <Button onClick={handleSubscribe} className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscribe - $15/month
            </Button>
          )}

          {subscribed && (
            <Button variant="outline" onClick={handleManageSubscription} className="w-full">
              <Settings className="w-4 h-4 mr-2" />
              Manage Subscription
            </Button>
          )}

          <Button variant="outline" onClick={refreshSubscription} className="w-full" size="sm">
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;
