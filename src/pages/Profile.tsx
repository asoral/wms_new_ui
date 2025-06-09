import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Settings, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ERPNextAPI, { configureERPNextAPI, createERPNextAPI, getUserDefaultCompany } from '@/services/erpnextApi';
import { useUser } from '@clerk/clerk-react';

const Profile = () => {
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "error">("idle");
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    const loadConfiguration = async () => {
      if (user) {
        const metadata = user.unsafeMetadata;
        setBaseURL(metadata.erpnextBaseURL as string || '');
        setApiKey(metadata.erpnextApiKey as string || '');
        setApiSecret(metadata.erpnextApiSecret as string || '');
      }
    };

    loadConfiguration();
  }, [user]);

  const handleTestConnection = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      toast({
        title: "Error",
        description: "Please fill in all ERPNext configuration fields",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const testAPI = new ERPNextAPI(baseURL, apiKey, apiSecret);
      const isConnected = await testAPI.testConnection();
      
      if (isConnected) {
        toast({
          title: "Success",
          description: "Successfully connected to ERPNext!",
        });
        setConnectionStatus('connected');
      } else {
        toast({
          title: "Connection Failed",
          description: "Unable to connect to ERPNext. Please check your credentials.",
          variant: "destructive",
        });
        setConnectionStatus('error');
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

    setIsSaving(true);
    try {
      const testAPI = new ERPNextAPI(baseURL, apiKey, apiSecret);
      const companies = await testAPI.getCompanies();
      
      configureERPNextAPI({
        baseURL,
        apiKey,
        apiSecret
      });

      if (user) {
        await user.update({
          unsafeMetadata: {
            erpnextBaseURL: baseURL,
            erpnextApiKey: apiKey,
            erpnextApiSecret: apiSecret,
          },
        });
      }

      toast({
        title: "Success",
        description: "ERPNext configuration saved successfully!",
      });
      setConnectionStatus('connected');
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

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>ERPNext Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="https://your-erpnext-site.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="api-secret">API Secret</Label>
            <Input
              id="api-secret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-between">
        <Button variant="secondary" onClick={handleTestConnection} disabled={isTestingConnection || isSaving}>
          {isTestingConnection ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>
        <Button onClick={handleSaveConfiguration} disabled={isTestingConnection || isSaving}>
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

      {connectionStatus !== "idle" && (
        <div className="mt-6">
          {connectionStatus === "connected" ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully connected to ERPNext!
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to connect to ERPNext. Please check your settings.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
