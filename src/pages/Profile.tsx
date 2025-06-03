
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, TestTube, Save, Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ERPNextAPI } from "@/services/erpnextApi";

interface UserProfile {
  erpnext_url: string;
  erpnext_api_key: string;
  erpnext_api_secret: string;
  erpnext_default_company: string;
}

interface Company {
  name: string;
  company_name: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    erpnext_url: "",
    erpnext_api_key: "",
    erpnext_api_secret: "",
    erpnext_default_company: ""
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  const [connectionError, setConnectionError] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('erpnext_url, erpnext_api_key, erpnext_api_secret, erpnext_default_company')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          erpnext_url: data.erpnext_url || "",
          erpnext_api_key: data.erpnext_api_key || "",
          erpnext_api_secret: data.erpnext_api_secret || "",
          erpnext_default_company: data.erpnext_default_company || ""
        });

        // Auto-load companies if credentials exist
        if (data.erpnext_url && data.erpnext_api_key && data.erpnext_api_secret) {
          await loadCompanies({
            url: data.erpnext_url,
            apiKey: data.erpnext_api_key,
            apiSecret: data.erpnext_api_secret
          });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!profile.erpnext_url || !profile.erpnext_api_key || !profile.erpnext_api_secret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all ERPNext connection details",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setConnectionStatus('none');
    setConnectionError('');

    try {
      console.log('Testing connection with Basic Auth:', {
        url: profile.erpnext_url,
        authFormat: 'Basic base64(api_key:api_secret)',
        apiKey: profile.erpnext_api_key ? 'Set' : 'Not set',
        apiSecret: profile.erpnext_api_secret ? 'Set' : 'Not set'
      });

      const erpnextAPI = new ERPNextAPI({
        url: profile.erpnext_url,
        apiKey: profile.erpnext_api_key,
        apiSecret: profile.erpnext_api_secret
      });

      const result = await erpnextAPI.testConnection();
      
      if (result.success) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: "ERPNext connection is working correctly",
        });
        
        // Load companies after successful connection
        await loadCompanies({
          url: profile.erpnext_url,
          apiKey: profile.erpnext_api_key,
          apiSecret: profile.erpnext_api_secret
        });
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Unknown error');
        toast({
          title: "Connection Failed",
          description: result.error || "Unable to connect to ERPNext. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const loadCompanies = async (config: { url: string; apiKey: string; apiSecret: string }) => {
    setLoadingCompanies(true);
    try {
      const erpnextAPI = new ERPNextAPI(config);
      const result = await erpnextAPI.getCompanies();
      
      if (result?.data) {
        setCompanies(result.data);
        console.log('Loaded companies:', result.data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies from ERPNext",
        variant: "destructive"
      });
    } finally {
      setLoadingCompanies(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          erpnext_url: profile.erpnext_url,
          erpnext_api_key: profile.erpnext_api_key,
          erpnext_api_secret: profile.erpnext_api_secret,
          erpnext_default_company: profile.erpnext_default_company
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "ERPNext configuration has been saved successfully",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>

        {/* ERPNext Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>ERPNext Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Authentication Format Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Authentication Format:</strong> This app uses Basic Authentication with base64 encoded credentials
                <br />
                <br />
                <strong>To create API keys in ERPNext:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to User Settings in ERPNext</li>
                  <li>Click on "API Access"</li>
                  <li>Generate API Key and Secret</li>
                  <li>Ensure the user has proper permissions for warehouse operations</li>
                  <li>Make sure CORS is enabled on your ERPNext server</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="erpnext_url">ERPNext Server URL</Label>
              <Input
                id="erpnext_url"
                value={profile.erpnext_url}
                onChange={(e) => setProfile(prev => ({ ...prev, erpnext_url: e.target.value }))}
                placeholder="https://your-erpnext-site.com"
              />
            </div>

            <div>
              <Label htmlFor="erpnext_api_key">API Key</Label>
              <div className="relative">
                <Input
                  id="erpnext_api_key"
                  type={showApiKey ? "text" : "password"}
                  value={profile.erpnext_api_key}
                  onChange={(e) => setProfile(prev => ({ ...prev, erpnext_api_key: e.target.value }))}
                  placeholder="Your ERPNext API Key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="erpnext_api_secret">API Secret</Label>
              <div className="relative">
                <Input
                  id="erpnext_api_secret"
                  type={showApiSecret ? "text" : "password"}
                  value={profile.erpnext_api_secret}
                  onChange={(e) => setProfile(prev => ({ ...prev, erpnext_api_secret: e.target.value }))}
                  placeholder="Your ERPNext API Secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                >
                  {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Connection Test */}
            <div className="flex items-center space-x-3 pt-2">
              <Button onClick={testConnection} disabled={testing} variant="outline">
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              
              {connectionStatus === 'success' && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              )}
              
              {connectionStatus === 'error' && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Failed
                </Badge>
              )}
            </div>

            {/* Connection Error Details */}
            {connectionStatus === 'error' && connectionError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  <strong>Connection Error:</strong> {connectionError}
                  <br />
                  <br />
                  <strong>Troubleshooting Steps:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Verify your ERPNext URL is accessible and correct</li>
                    <li>Check your API Key and Secret are correct (from User Settings → API Access)</li>
                    <li>Ensure the API user has System Manager or appropriate permissions</li>
                    <li>Enable CORS in your ERPNext site_config.json: <code>"allow_cors": "*"</code></li>
                    <li>If using ngrok, make sure to click "Visit Site" when prompted</li>
                    <li>Test with Postman using Basic Auth: base64(api_key:api_secret)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Default Company Selection */}
            {companies.length > 0 && (
              <div>
                <Label htmlFor="default_company">Default Company</Label>
                <Select
                  value={profile.erpnext_default_company}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, erpnext_default_company: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.name} value={company.name}>
                        {company.company_name || company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingCompanies && (
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Loading companies...
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4">
              <Button onClick={saveProfile} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
