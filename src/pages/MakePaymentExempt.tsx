
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/components/subscription/SubscriptionContext";

const MakePaymentExempt = () => {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();
  const { refreshSubscription } = useSubscription();

  useEffect(() => {
    const makeExempt = async () => {
      setStatus("loading");
      
      try {
        const { data, error } = await supabase.functions.invoke("make-payment-exempt");
        
        if (error) {
          throw new Error(error.message);
        }
        
        setStatus("success");
        setMessage("Your account has been successfully marked as payment exempt!");
        
        // Refresh subscription status after making payment exempt
        await refreshSubscription();
      } catch (error) {
        console.error("Error making payment exempt:", error);
        setStatus("error");
        setMessage(`Failed to make account payment exempt: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    // Execute automatically on page load
    makeExempt();
  }, [refreshSubscription]);

  const handleNavigateHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Exemption Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <p>Setting up payment exemption...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <p className="text-green-700 font-medium">{message}</p>
              <p>Your account is now payment exempt. You can use all features without any payment requirements.</p>
              <Button onClick={handleNavigateHome} className="w-full mt-4">
                Continue to Home
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <p className="text-red-700">{message}</p>
              <Button onClick={handleNavigateHome} variant="outline" className="w-full mt-4">
                Return Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MakePaymentExempt;
