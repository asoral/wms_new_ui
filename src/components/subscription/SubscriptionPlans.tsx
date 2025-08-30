import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";

const SubscriptionPlans = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        throw error;
      }

      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Complete your subscription in the new tab",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Start with a 15-day free trial, no credit card required
        </p>
      </div>

      <Card className="relative">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <CardTitle className="text-2xl">WMS Premium</CardTitle>
            <Badge variant="secondary">Popular</Badge>
          </div>
          <div className="flex justify-center items-baseline gap-1">
            <span className="text-4xl font-bold">$15</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <CardDescription className="text-lg">
            Full access to all warehouse management features
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium text-center">
              🎉 Start with 15 days FREE - No credit card required!
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">What's included:</h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                "Unlimited item management",
                "Multi-warehouse support",
                "Real-time stock tracking",
                "Pick list management",
                "Delivery tracking",
                "Quality control workflows",
                "Advanced reporting & analytics",
                "Material request workflows",
                "Bin enquiry & location tracking",
                "Stock counting & reconciliation",
                "ERPNext integration",
                "Mobile-first design"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start 15-Day Free Trial
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your trial starts immediately. After 15 days, you'll be charged $15/month. 
            Cancel anytime during your trial period.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionPlans;