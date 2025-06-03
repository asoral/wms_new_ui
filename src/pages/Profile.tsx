import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ERPNextAPI } from '@/services/erpnextApi';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    erpnextUrl: '',
    erpnextApiKey: '',
    erpnextApiSecret: '',
    erpnextDefaultCompany: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          fullName: data.full_name || '',
          email: data.email || '',
          erpnextUrl: data.erpnext_url || '',
          erpnextApiKey: data.erpnext_api_key || '',
          erpnextApiSecret: data.erpnext_api_secret || '',
          erpnextDefaultCompany: data.erpnext_default_company || ''
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setConnectionStatus('idle');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.fullName,
          erpnext_url: profile.erpnextUrl,
          erpnext_api_key: profile.erpnextApiKey,
          erpnext_api_secret: profile.erpnextApiSecret,
          erpnext_default_company: profile.erpnextDefaultCompany
        })
        .eq('id', user?.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const testERPNextConnection = async () => {
    if (!profile.erpnextUrl || !profile.erpnextApiKey || !profile.erpnextApiSecret) {
      setError('Please fill in all ERPNext credentials before testing');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');
    setError(null);

    try {
      const erpnextAPI = new ERPNextAPI({
        url: profile.erpnextUrl,
        apiKey: profile.erpnextApiKey,
        apiSecret: profile.erpnextApiSecret
      });

      const result = await erpnextAPI.testConnection();
      
      if (result.success) {
        setConnectionStatus('success');
        setSuccess('Connection successful! You can now load companies.');
      } else {
        setConnectionStatus('error');
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to connect to ERPNext');
    } finally {
      setTestingConnection(false);
    }
  };

  const loadCompanies = async () => {
    if (!profile.erpnextUrl || !profile.erpnextApiKey || !profile.erpnextApiSecret) {
      setError('Please test connection first');
      return;
    }

    setLoadingCompanies(true);
    setError(null);

    try {
      const erpnextAPI = new ERPNextAPI({
        url: profile.erpnextUrl,
        apiKey: profile.erpnextApiKey,
        apiSecret: profile.erpnextApiSecret
      });

      const result = await erpnextAPI.getCompanies();
      setCompanies(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  if (loading && !profile.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-gray-600">Manage your account and ERPNext connection settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Your basic account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-sm text-gray-500">Email cannot be changed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ERPNext Configuration</CardTitle>
            <CardDescription>
              Configure your ERPNext server connection for WMS integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="erpnextUrl">ERPNext Server URL</Label>
              <Input
                id="erpnextUrl"
                type="url"
                value={profile.erpnextUrl}
                onChange={(e) => setProfile({ ...profile, erpnextUrl: e.target.value })}
                placeholder="https://your-domain.erpnext.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="erpnextApiKey">API Key</Label>
              <Input
                id="erpnextApiKey"
                type="text"
                value={profile.erpnextApiKey}
                onChange={(e) => setProfile({ ...profile, erpnextApiKey: e.target.value })}
                placeholder="Your ERPNext API Key"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="erpnextApiSecret">API Secret</Label>
              <div className="relative">
                <Input
                  id="erpnextApiSecret"
                  type={showApiSecret ? "text" : "password"}
                  value={profile.erpnextApiSecret}
                  onChange={(e) => setProfile({ ...profile, erpnextApiSecret: e.target.value })}
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

            <div className="pt-4 border-t">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testERPNextConnection}
                  disabled={testingConnection}
                >
                  {testingConnection && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Test Connection
                </Button>
                
                {connectionStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">Connection successful</span>
                  </div>
                )}
                
                {connectionStatus === 'error' && (
                  <div className="flex items-center text-red-600">
                    <XCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">Connection failed</span>
                  </div>
                )}
              </div>

              {connectionStatus === 'success' && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={loadCompanies}
                      disabled={loadingCompanies}
                    >
                      {loadingCompanies && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Building2 className="w-4 h-4 mr-2" />
                      Load Companies
                    </Button>
                  </div>

                  {companies.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="defaultCompany">Default Company</Label>
                      <Select
                        value={profile.erpnextDefaultCompany}
                        onValueChange={(value) => setProfile({ ...profile, erpnextDefaultCompany: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a default company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.name} value={company.name}>
                              {company.company_name || company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-500">
                        This company will be used as default for all WMS operations
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>

      {error && (
        <Alert className="mt-4 border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Profile;
