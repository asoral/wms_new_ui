
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle, Settings, User, Building2, CreditCard, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";
import { ERPNextAPI, configureERPNextAPI, createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { getERPNextConfig, saveERPNextConfig } from '@/services/authService';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';

const Profile = () => {
  const { user } = useAuth();
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [companies, setCompanies] = useState<Array<{ name: string; company_name: string }>>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "error">("idle");
  const { toast } = useToast();

  useEffect(() => {
    const loadConfiguration = async () => {
      if (!user) return;
      
      setIsLoadingConfig(true);
      try {
        console.log('Loading ERPNext configuration from database...');
        const config = await getERPNextConfig();
        
        if (config) {
          console.log('Found ERPNext config in database:', config);
          setBaseURL(config.erpnext_url || '');
          setApiKey(config.erpnext_api_key || '');
          setApiSecret(config.erpnext_api_secret || '');
          setSelectedCompany(config.erpnext_default_company || '');

          // Auto-test connection and load companies if all credentials exist
          if (config.erpnext_url && config.erpnext_api_key && config.erpnext_api_secret) {
            console.log('Found existing credentials, testing connection...');
            await testConnectionAndLoadCompanies(config.erpnext_url, config.erpnext_api_key, config.erpnext_api_secret);
          }
        } else {
          console.log('No ERPNext config found in database, checking localStorage...');
          // Fallback to localStorage for migration
          const storedBaseURL = localStorage.getItem('erpnextBaseURL') || '';
          const storedApiKey = localStorage.getItem('erpnextApiKey') || '';
          const storedApiSecret = localStorage.getItem('erpnextApiSecret') || '';
          const storedCompany = localStorage.getItem('erpnextDefaultCompany') || '';
          
          if (storedBaseURL || storedApiKey || storedApiSecret) {
            console.log('Found credentials in localStorage, migrating to database...');
            setBaseURL(storedBaseURL);
            setApiKey(storedApiKey);
            setApiSecret(storedApiSecret);
            setSelectedCompany(storedCompany);
            
            // Save to database
            if (storedBaseURL && storedApiKey && storedApiSecret) {
              await saveERPNextConfig({
                erpnext_url: storedBaseURL,
                erpnext_api_key: storedApiKey,
                erpnext_api_secret: storedApiSecret,
                erpnext_default_company: storedCompany
              });
              
              await testConnectionAndLoadCompanies(storedBaseURL, storedApiKey, storedApiSecret);
            }
          }
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        toast({
          title: "Error",
          description: "Failed to load ERPNext configuration",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfiguration();
  }, [user]);

  const testConnectionAndLoadCompanies = async (url: string, key: string, secret: string) => {
    try {
      const testAPI = new ERPNextAPI(url, key, secret);
      const isConnected = await testAPI.testConnection();
      
      if (isConnected) {
        console.log('Connection successful, loading companies...');
        setConnectionStatus('connected');
        
        // Load companies
        setIsLoadingCompanies(true);
        const companiesResult = await testAPI.getCompanies();
        console.log('Companies loaded:', companiesResult);
        setCompanies(companiesResult.data || []);
        setIsLoadingCompanies(false);
        
        // Configure the global API instance
        configureERPNextAPI({
          baseURL: url,
          apiKey: key,
          apiSecret: secret
        });
        
        return true;
      } else {
        console.log('Connection failed');
        setConnectionStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Error during connection test:', error);
      setConnectionStatus('error');
      setIsLoadingCompanies(false);
      return false;
    }
  };

  const handleTestConnection = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      toast({
        title: "Error",
        description: "Please fill in all ERPNext configuration fields",
        variant: "destructive",
      });
      return;
    }

    // Clean the base URL (remove trailing slash if present)
    const cleanBaseURL = baseURL.replace(/\/+$/, '');
    
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      console.log('Testing connection with:', { baseURL: cleanBaseURL, apiKey });
      const success = await testConnectionAndLoadCompanies(cleanBaseURL, apiKey, apiSecret);
      
      if (success) {
        toast({
          title: "Success",
          description: "Successfully connected to ERPNext!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to ERPNext. Please check your credentials and URL.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      toast({
        title: "Error",
        description: "Please fill in all ERPNext configuration fields",
        variant: "destructive",
      });
      return;
    }

    const cleanBaseURL = baseURL.replace(/\/+$/, '');
    
    setIsSaving(true);
    try {
      // Test connection first
      const success = await testConnectionAndLoadCompanies(cleanBaseURL, apiKey, apiSecret);
      
      if (success) {
        // Save to database
        const result = await saveERPNextConfig({
          erpnext_url: cleanBaseURL,
          erpnext_api_key: apiKey,
          erpnext_api_secret: apiSecret,
          erpnext_default_company: selectedCompany
        });

        if (result.success) {
          toast({
            title: "Success",
            description: "ERPNext configuration saved successfully!",
          });
        } else {
          throw new Error('Failed to save to database');
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to save configuration. Connection test failed.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration. Please check your settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompanyChange = async (company: string) => {
    setSelectedCompany(company);
    
    // Save the updated company to database
    if (baseURL && apiKey && apiSecret) {
      try {
        await saveERPNextConfig({
          erpnext_url: baseURL,
          erpnext_api_key: apiKey,
          erpnext_api_secret: apiSecret,
          erpnext_default_company: company
        });
        
        toast({
          title: "Company Updated",
          description: `Default company set to ${company}`,
        });
      } catch (error) {
        console.error('Failed to save company selection:', error);
        toast({
          title: "Error",
          description: "Failed to save company selection",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email || 'Not available'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label className="text-sm text-muted-foreground">User ID</Label>
                <p className="font-mono text-sm">{user?.id || 'Not available'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status Card */}
        <SubscriptionStatus />
      </div>

      {/* ERPNext Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>ERPNext Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span className="text-muted-foreground">Loading configuration...</span>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="base-url">Base URL</Label>
                  <Input
                    id="base-url"
                    value={baseURL}
                    onChange={(e) => setBaseURL(e.target.value)}
                    placeholder="https://your-erpnext-site.com"
                    disabled={isSaving || isTestingConnection}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    disabled={isSaving || isTestingConnection}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-secret">API Secret</Label>
                <Input
                  id="api-secret"
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  disabled={isSaving || isTestingConnection}
                />
              </div>

              {/* Company Selector */}
              {connectionStatus === 'connected' && companies.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="default-company">Default Company</Label>
                    <Select value={selectedCompany} onValueChange={handleCompanyChange}>
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
                    {selectedCompany && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {companies.find(c => c.name === selectedCompany)?.company_name || selectedCompany}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection} 
                  disabled={isTestingConnection || isSaving || isLoadingCompanies}
                  className="flex-1"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
                <Button 
                  onClick={handleSaveConfiguration} 
                  disabled={isTestingConnection || isSaving || isLoadingCompanies}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </div>

              {isLoadingCompanies && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Loading companies...</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Connection Status Alert */}
      {connectionStatus !== "idle" && (
        <Alert variant={connectionStatus === "connected" ? "default" : "destructive"}>
          {connectionStatus === "connected" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {connectionStatus === "connected" 
              ? "Successfully connected to ERPNext!" 
              : "Failed to connect to ERPNext. Please check your settings."
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Profile;
