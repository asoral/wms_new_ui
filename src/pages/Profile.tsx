import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { configureERPNextAPI } from "@/services/erpnextApi";
import { AlertCircle, CheckCircle, Settings, Database, Key } from "lucide-react";

const Profile = () => {
  const [erpnextUrl, setErpnextUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [defaultCompany, setDefaultCompany] = useState("");
  const [availableCompanies, setAvailableCompanies] = useState<{ name: string }[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('erpnext_url, erpnext_api_key, erpnext_api_secret, erpnext_default_company')
          .eq('id', user.id)
          .single();

        if (profile) {
          setErpnextUrl(profile.erpnext_url || "");
          setApiKey(profile.erpnext_api_key || "");
          setApiSecret(profile.erpnext_api_secret || "");
          setDefaultCompany(profile.erpnext_default_company || "");
        }
      }
    };

    fetchProfile();
  }, []);

  const testConnection = async () => {
    if (!erpnextUrl || !apiKey || !apiSecret) {
      toast({
        title: "Missing Configuration",
        description: "Please fill in all ERPNext configuration fields",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const api = configureERPNextAPI(erpnextUrl, apiKey, apiSecret);
      
      // Test with simple API call
      const result = await api.getItems();
      
      if (result && result.data) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: `Connected to ERPNext successfully. Found ${result.data.length} items.`,
        });
      } else {
        throw new Error('No data returned from API');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "Failed to connect to ERPNext. Please check your configuration.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const fetchCompanies = async () => {
    if (!erpnextUrl || !apiKey || !apiSecret) {
      toast({
        title: "Missing Configuration",
        description: "Please configure ERPNext connection first",
        variant: "destructive"
      });
      return;
    }

    setLoadingCompanies(true);
    try {
      const api = configureERPNextAPI(erpnextUrl, apiKey, apiSecret);
      const result = await api.getCompanies();
      
      if (result && result.data) {
        setAvailableCompanies(result.data);
        toast({
          title: "Companies Loaded",
          description: `Found ${result.data.length} companies`,
        });
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const saveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          erpnext_url: erpnextUrl,
          erpnext_api_key: apiKey,
          erpnext_api_secret: apiSecret,
          erpnext_default_company: defaultCompany
        })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "ERPNext configuration updated successfully",
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>ERPNext Configuration</span>
          </CardTitle>
          <CardDescription>
            Configure your ERPNext instance to connect with this application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="connection" className="flex items-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Connection</span>
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Company</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="connection" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="erpnext_url">ERPNext URL</Label>
                <Input
                  id="erpnext_url"
                  placeholder="https://your-erpnext-instance.com"
                  value={erpnextUrl}
                  onChange={(e) => setErpnextUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  placeholder="Your ERPNext API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  type="password"
                  placeholder="Your ERPNext API Secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />
              </div>
              <Button onClick={testConnection} disabled={testing} className="w-full">
                {testing ? "Testing..." : "Test Connection"}
              </Button>

              {connectionStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>Connection successful</span>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Connection failed. Check your configuration.</span>
                </div>
              )}
            </TabsContent>
            <TabsContent value="company" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_company">Default Company</Label>
                <Input
                  id="default_company"
                  placeholder="Your Default Company"
                  value={defaultCompany}
                  onChange={(e) => setDefaultCompany(e.target.value)}
                />
              </div>

              <Button onClick={fetchCompanies} disabled={loadingCompanies} className="w-full">
                {loadingCompanies ? "Loading Companies..." : "Load Available Companies"}
              </Button>

              {availableCompanies.length > 0 && (
                <div className="mt-4">
                  <Label>Available Companies:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableCompanies.map(company => (
                      <Badge key={company.name} variant="secondary">{company.name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          <Button onClick={saveProfile} className="w-full">
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
