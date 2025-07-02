
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Warehouse, LogOut, Building2, Server, Key, Globe } from "lucide-react";
import { useAuth } from "@/components/auth/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getERPNextConfig, saveERPNextConfig } from "@/services/authService";
import DarkModeToggle from "@/components/DarkModeToggle";

const Profile = () => {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [erpNextConfig, setERPNextConfig] = useState({
    erpnext_url: '',
    erpnext_api_key: '',
    erpnext_api_secret: '',
    erpnext_default_company: '',
    erpnext_pallet_template_item: ''
  });
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    loadERPNextConfig();
  }, []);

  const loadERPNextConfig = async () => {
    try {
      setConfigLoading(true);
      const config = await getERPNextConfig();
      if (config) {
        setERPNextConfig({
          erpnext_url: config.erpnext_url || '',
          erpnext_api_key: config.erpnext_api_key || '',
          erpnext_api_secret: config.erpnext_api_secret || '',
          erpnext_default_company: config.erpnext_default_company || '',
          erpnext_pallet_template_item: config.erpnext_pallet_template_item || ''
        });
      }
    } catch (error) {
      console.error('Failed to load ERPNext config:', error);
      toast({
        title: "Error",
        description: "Failed to load ERPNext configuration",
        variant: "destructive"
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveERPNextConfig = async () => {
    try {
      setConfigLoading(true);
      const result = await saveERPNextConfig(erpNextConfig);
      if (result.success) {
        toast({
          title: "Success",
          description: "ERPNext configuration saved successfully",
        });
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to save ERPNext configuration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to save ERPNext config:', error);
      toast({
        title: "Error",
        description: "Failed to save ERPNext configuration",
        variant: "destructive"
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          </div>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300">
            Active
          </Badge>
        </div>

        {/* User Information */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <User className="w-5 h-5" />
              <span>User Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="dark:text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="userId" className="dark:text-gray-200">User ID</Label>
                <Input
                  id="userId"
                  value={user?.id || ""}
                  readOnly
                  className="bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ERPNext Configuration */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between dark:text-gray-100">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5" />
                <span>ERPNext Configuration</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={configLoading}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {configLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading configuration...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="erpnext_url" className="flex items-center space-x-2 dark:text-gray-200">
                    <Globe className="w-4 h-4" />
                    <span>ERPNext URL</span>
                  </Label>
                  <Input
                    id="erpnext_url"
                    type="url"
                    placeholder="https://your-site.erpnext.com"
                    value={erpNextConfig.erpnext_url}
                    onChange={(e) => setERPNextConfig({...erpNextConfig, erpnext_url: e.target.value})}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50 dark:bg-gray-700" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="erpnext_api_key" className="flex items-center space-x-2 dark:text-gray-200">
                    <Key className="w-4 h-4" />
                    <span>API Key</span>
                  </Label>
                  <Input
                    id="erpnext_api_key"
                    type="password"
                    placeholder="Enter your ERPNext API Key"
                    value={erpNextConfig.erpnext_api_key}
                    onChange={(e) => setERPNextConfig({...erpNextConfig, erpnext_api_key: e.target.value})}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50 dark:bg-gray-700" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="erpnext_api_secret" className="flex items-center space-x-2 dark:text-gray-200">
                    <Key className="w-4 h-4" />
                    <span>API Secret</span>
                  </Label>
                  <Input
                    id="erpnext_api_secret"
                    type="password"
                    placeholder="Enter your ERPNext API Secret"
                    value={erpNextConfig.erpnext_api_secret}
                    onChange={(e) => setERPNextConfig({...erpNextConfig, erpnext_api_secret: e.target.value})}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50 dark:bg-gray-700" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="erpnext_default_company" className="flex items-center space-x-2 dark:text-gray-200">
                    <Building2 className="w-4 h-4" />
                    <span>Default Company</span>
                  </Label>
                  <Input
                    id="erpnext_default_company"
                    placeholder="Enter your default company name"
                    value={erpNextConfig.erpnext_default_company}
                    onChange={(e) => setERPNextConfig({...erpNextConfig, erpnext_default_company: e.target.value})}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50 dark:bg-gray-700" : ""}
                  />
                </div>

                <div>
                  <Label htmlFor="erpnext_pallet_template_item" className="flex items-center space-x-2 dark:text-gray-200">
                    <Warehouse className="w-4 h-4" />
                    <span>Pallet Template Item</span>
                  </Label>
                  <Input
                    id="erpnext_pallet_template_item"
                    placeholder="Enter pallet template item code"
                    value={erpNextConfig.erpnext_pallet_template_item}
                    onChange={(e) => setERPNextConfig({...erpNextConfig, erpnext_pallet_template_item: e.target.value})}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-gray-50 dark:bg-gray-700" : ""}
                  />
                </div>

                {isEditing && (
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={handleSaveERPNextConfig}
                      disabled={configLoading}
                      className="flex-1"
                    >
                      {configLoading ? "Saving..." : "Save Configuration"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        loadERPNextConfig();
                      }}
                      disabled={configLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 dark:text-gray-100">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <DarkModeToggle />
              
              <Button variant="ghost" className="w-full justify-start dark:text-gray-200 dark:hover:bg-gray-700">
                <Warehouse className="h-4 w-4 mr-3" />
                Set Default Warehouse
              </Button>
              
              <Button variant="ghost" className="w-full justify-start dark:text-gray-200 dark:hover:bg-gray-700">
                <Building2 className="h-4 w-4 mr-3" />
                Company Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-100">Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Contact our support team at support@dexciss.io
            </p>
            <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
              Contact Support
            </Button>
          </CardContent>
        </Card>

        <Separator className="dark:border-gray-700" />

        {/* Logout */}
        <Card className="border-red-200 dark:border-red-800 dark:bg-gray-800">
          <CardContent className="pt-6">
            <Button
              onClick={handleSignOut}
              variant="destructive"
              className="w-full flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
