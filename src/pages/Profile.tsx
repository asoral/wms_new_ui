import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Database, 
  Eye, 
  EyeOff, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  LogOut,
  Key
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createERPNextAPI } from '@/services/erpnextApi';

interface CompanyInfo {
  companyName: string;
  abbr: string;
  currency: string;
}

interface Item {
  itemCode: string;
  itemName: string;
  qty: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    erpnextUrl: '',
    erpnextApiKey: '',
    erpnextApiSecret: '',
    erpnextDefaultCompany: '',
    erpnextPalletTemplateItem: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [showApiSecret, setShowApiSecret] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Type guard to ensure profile data exists
      if (profile) {
        setFormData({
          erpnextUrl: profile.erpnext_url || '',
          erpnextApiKey: profile.erpnext_api_key || '',
          erpnextApiSecret: profile.erpnext_api_secret || '',
          erpnextDefaultCompany: profile.erpnext_default_company || '',
          erpnextPalletTemplateItem: profile.erpnext_pallet_template_item || ''
        });

        const hasConfig = profile.erpnext_url && profile.erpnext_api_key && profile.erpnext_api_secret;
        setIsConfigured(hasConfig);
        if (hasConfig) {
          await testConnection(profile.erpnext_url, profile.erpnext_api_key, profile.erpnext_api_secret);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const testConnection = async (url: string, apiKey: string, apiSecret: string) => {
    setTesting(true);
    setMessage(null);
    try {
      const erpnextAPI = await createERPNextAPI(url, apiKey, apiSecret);
      if (!erpnextAPI) {
        setConnectionStatus('disconnected');
        setMessage({ type: 'error', content: 'Failed to create ERPNext API instance.' });
        return;
      }
      
      // Test with a simple API call, e.g., fetching company info
      const company = await erpnextAPI.getCompany('default');
      if (company.success && company.data) {
        setCompanyInfo({
          companyName: company.data.company_name,
          abbr: company.data.abbr,
          currency: company.data.default_currency
        });
        setConnectionStatus('connected');
        setMessage({ type: 'success', content: 'Connection successful!' });
      } else {
        setConnectionStatus('disconnected');
        setMessage({ type: 'error', content: 'Failed to fetch company information. Check your credentials.' });
      }
    } catch (error: any) {
      console.error('Connection test error:', error);
      setConnectionStatus('disconnected');
      setMessage({ type: 'error', content: error.message || 'An error occurred during the connection test.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('profiles')
        .update({
          erpnext_url: formData.erpnextUrl,
          erpnext_api_key: formData.erpnextApiKey,
          erpnext_api_secret: formData.erpnextApiSecret,
          erpnext_default_company: formData.erpnextDefaultCompany,
          erpnext_pallet_template_item: formData.erpnextPalletTemplateItem
        })
        .eq('id', user.id);

      if (error) {
        console.error('Update error:', error);
        setMessage({ type: 'error', content: 'Failed to update profile.' });
      } else {
        setMessage({ type: 'success', content: 'Profile updated successfully!' });
        setIsConfigured(true);
        await testConnection(formData.erpnextUrl, formData.erpnextApiKey, formData.erpnextApiSecret);
      }
    } catch (error: any) {
      console.error('Error during save:', error);
      setMessage({ type: 'error', content: error.message || 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    await testConnection(formData.erpnextUrl, formData.erpnextApiKey, formData.erpnextApiSecret);
  };

  const handlePasswordChange = async () => {
    setPasswordLoading(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', content: 'New passwords do not match.' });
      setPasswordLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) {
        console.error('Password update error:', error);
        setMessage({ type: 'error', content: error.message || 'Failed to update password.' });
      } else {
        setMessage({ type: 'success', content: 'Password updated successfully!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error: any) {
      console.error('Unexpected error during password update:', error);
      setMessage({ type: 'error', content: error.message || 'An unexpected error occurred.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const loadItems = async () => {
    try {
      const erpnextAPI = await createERPNextAPI(formData.erpnextUrl, formData.erpnextApiKey, formData.erpnextApiSecret);
      if (!erpnextAPI) {
        toast({
          title: "ERPNext Not Configured",
          description: "Please configure your ERPNext settings.",
          variant: "destructive"
        });
        return;
      }

      // Fetch items from ERPNext
      const itemsResult = await erpnextAPI.getAllItems();
      if (itemsResult.data) {
        setItems(itemsResult.data.map((item: any) => ({
          itemCode: item.item_code,
          itemName: item.item_name,
          qty: item.qty || 1
        })));
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch items from ERPNext",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch items from ERPNext",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-gray-100"
              />
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <span>Change Password</span>
              </h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={passwordLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="w-full"
                >
                  {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ERPNext Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>ERPNext Configuration</span>
              </div>
              {isConfigured && (
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
                  {connectionStatus === 'connected' ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="erpnext-url">ERPNext URL</Label>
                <Input
                  id="erpnext-url"
                  type="url"
                  placeholder="https://your-domain.erpnext.com"
                  value={formData.erpnextUrl}
                  onChange={(e) => setFormData({ ...formData, erpnextUrl: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="erpnext-api-key">ERPNext API Key</Label>
                <Input
                  id="erpnext-api-key"
                  type="text"
                  placeholder="Your ERPNext API Key"
                  value={formData.erpnextApiKey}
                  onChange={(e) => setFormData({ ...formData, erpnextApiKey: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="erpnext-api-secret">ERPNext API Secret</Label>
                <div className="relative">
                  <Input
                    id="erpnext-api-secret"
                    type={showApiSecret ? "text" : "password"}
                    placeholder="Your ERPNext API Secret"
                    value={formData.erpnextApiSecret}
                    onChange={(e) => setFormData({ ...formData, erpnextApiSecret: e.target.value })}
                    required
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
              <div>
                <Label htmlFor="erpnext-default-company">Default Company</Label>
                <Input
                  id="erpnext-default-company"
                  type="text"
                  placeholder="Your Default Company Name"
                  value={formData.erpnextDefaultCompany}
                  onChange={(e) => setFormData({ ...formData, erpnextDefaultCompany: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="erpnext-pallet-template-item">Pallet Template Item</Label>
                <Input
                  id="erpnext-pallet-template-item"
                  type="text"
                  placeholder="Pallet Template Item"
                  value={formData.erpnextPalletTemplateItem}
                  onChange={(e) => setFormData({ ...formData, erpnextPalletTemplateItem: e.target.value })}
                />
              </div>
              
              <div className="flex space-x-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Save className="w-4 h-4 mr-2" />
                  Save Configuration
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !formData.erpnextUrl || !formData.erpnextApiKey || !formData.erpnextApiSecret}
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </div>
            </form>

            {message && (
              <Alert className={`mt-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                  {message.content}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Company & Items Information */}
        {(companyInfo || items.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>System Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {companyInfo && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Company Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label>Company Name</Label>
                      <p className="font-medium">{companyInfo.companyName}</p>
                    </div>
                    <div>
                      <Label>Abbreviation</Label>
                      <p className="font-medium">{companyInfo.abbr}</p>
                    </div>
                    <div>
                      <Label>Currency</Label>
                      <p className="font-medium">{companyInfo.currency}</p>
                    </div>
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Item Code</th>
                          <th className="text-left p-2">Item Name</th>
                          <th className="text-right p-2">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.itemCode} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{item.itemCode}</td>
                            <td className="p-2">{item.itemName}</td>
                            <td className="p-2 text-right">{item.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {!companyInfo && items.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No system information available. Test your ERPNext connection to load data.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
