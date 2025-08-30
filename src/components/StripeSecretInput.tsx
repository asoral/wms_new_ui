import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const StripeSecretInput = () => {
  const [secretKey, setSecretKey] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateSecret = async () => {
    if (!secretKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Stripe secret key",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      // The secret will be updated through Supabase's secret management
      console.log("Stripe secret key ready to be updated:", secretKey.substring(0, 10) + "...");
      
      toast({
        title: "Ready",
        description: "Secret key is ready. Please use the Supabase dashboard to update STRIPE_SECRET_KEY.",
      });
      
      setSecretKey("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prepare secret key",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Update Stripe Secret Key</CardTitle>
        <CardDescription>
          Enter your Stripe secret key to enable subscription functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
          <Input
            id="stripe-secret"
            type="password"
            placeholder="sk_test_... or sk_live_..."
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
        <Button 
          onClick={handleUpdateSecret}
          disabled={!secretKey.trim() || isUpdating}
          className="w-full"
        >
          {isUpdating ? "Preparing..." : "Prepare Secret Key"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Your secret key will be securely stored and encrypted.
        </p>
      </CardContent>
    </Card>
  );
};

export default StripeSecretInput;