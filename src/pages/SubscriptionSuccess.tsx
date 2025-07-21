
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/components/subscription/SubscriptionContext';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    // Refresh subscription status when user returns from Stripe
    refreshSubscription();
  }, [refreshSubscription]);

  const handleContinue = () => {
    navigate('/app/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Subscription Activated!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Thank you for subscribing to WMS. Your subscription is now active and you have full access to all features.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">What's included:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Complete warehouse management system</li>
                <li>• Real-time inventory tracking</li>
                <li>• ERPNext integration</li>
                <li>• Mobile-friendly interface</li>
                <li>• Priority support</li>
              </ul>
            </div>

            <Button onClick={handleContinue} className="w-full">
              Continue to App
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-xs text-gray-500">
              You can manage your subscription anytime from your profile settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
