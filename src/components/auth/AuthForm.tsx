import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Warehouse, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';
import OnboardingCarousel from '@/components/onboarding/OnboardingCarousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const AuthForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Check for password recovery or email verification
  useEffect(() => {
    const checkAuthCallback = async () => {
      const type = searchParams.get('type');
      const accessToken = searchParams.get('access_token');
      
      if (type === 'recovery' && accessToken) {
        // User clicked password reset link
        setIsPasswordRecovery(true);
      } else if (type === 'signup' || type === 'email_change') {
        // Email verification - Supabase handles this automatically
        setSuccess('Email verified successfully! You can now log in.');
        setActiveTab('login');
      }
    };
    
    checkAuthCallback();
  }, [searchParams]);

  // Initialize tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup') {
      setActiveTab('signup');
    } else if (tab === 'login') {
      setActiveTab('login');
    }
  }, [searchParams]);

  // Password reset state
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<{error?: string; success?: string} | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    erpnextUrl: '',
    erpnextApiKey: '',
    erpnextApiSecret: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      setError(error.message);
    } else {
      navigate('/app/home');
    }

    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!signupForm.erpnextUrl || !signupForm.erpnextApiKey || !signupForm.erpnextApiSecret) {
      setError('ERPNext credentials are required');
      setLoading(false);
      return;
    }

    // Sanitize credentials before sending
    const sanitizedCredentials = {
      erpnext_url: signupForm.erpnextUrl.trim(),
      erpnext_api_key: signupForm.erpnextApiKey.trim(),
      erpnext_api_secret: signupForm.erpnextApiSecret.trim()
    };

    const { error } = await signUp(
      signupForm.email.trim(), 
      signupForm.password, 
      signupForm.fullName.trim(),
      sanitizedCredentials
    );

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created successfully! Please check your email for verification.');
      setSignupForm({ 
        email: '', 
        password: '', 
        confirmPassword: '', 
        fullName: '',
        erpnextUrl: '',
        erpnextApiKey: '',
        erpnextApiSecret: ''
      });
    }

    setLoading(false);
  };

  const handleSignupClick = () => {
    setShowOnboarding(true);
  };

  const handleOpenResetDialog = () => {
    setShowResetDialog(true);
    setResetEmail('');
    setResetMessage(null);
  };

  const handleCloseResetDialog = () => {
    setShowResetDialog(false);
    setResetEmail('');
    setResetMessage(null);
    setResetLoading(false);
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setResetLoading(true);
    if (!resetEmail) {
      setResetMessage({ error: 'Please enter your email.' });
      setResetLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/auth?type=recovery"
      });
      if (error) {
        setResetMessage({ error: error.message || 'Failed to send reset email.' });
      } else {
        setResetMessage({ success: "Reset link sent. Please check your email." });
      }
    } catch (err: any) {
      setResetMessage({ error: err?.message || 'An error occurred.' });
    }
    setResetLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password updated successfully! You can now log in.');
        setIsPasswordRecovery(false);
        setNewPassword('');
        setConfirmNewPassword('');
        setActiveTab('login');
        // Clear URL parameters
        navigate('/auth', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update password');
    }
    
    setLoading(false);
  };

  // Show password recovery form
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-foreground">WMS</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show onboarding when requested
  if (showOnboarding) {
    return (
      <OnboardingCarousel 
        onComplete={() => {
          setShowOnboarding(false);
          setShowSignupForm(true);
        }} 
      />
    );
  }

  // Show signup form after onboarding
  if (showSignupForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl text-foreground">WMS</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Enter your details and ERPNext configuration to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Enter your password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">ERPNext Configuration</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="erpnext-url">ERPNext Server URL</Label>
                    <Input
                      id="erpnext-url"
                      type="url"
                      placeholder="https://your-domain.erpnext.com"
                      value={signupForm.erpnextUrl}
                      onChange={(e) => setSignupForm({ ...signupForm, erpnextUrl: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="erpnext-api-key">API Key</Label>
                    <Input
                      id="erpnext-api-key"
                      type="text"
                      placeholder="Your ERPNext API Key"
                      value={signupForm.erpnextApiKey}
                      onChange={(e) => setSignupForm({ ...signupForm, erpnextApiKey: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="erpnext-api-secret">API Secret</Label>
                    <div className="relative">
                      <Input
                        id="erpnext-api-secret"
                        type={showApiSecret ? "text" : "password"}
                        placeholder="Your ERPNext API Secret"
                        value={signupForm.erpnextApiSecret}
                        onChange={(e) => setSignupForm({ ...signupForm, erpnextApiSecret: e.target.value })}
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
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Account
                </Button>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowSignupForm(false)}
                >
                  Back to Login
                </Button>
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-foreground">WMS</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to WMS</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Sign In
                  </Button>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleOpenResetDialog}
                      className="text-sm text-blue-600 hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Discover how WMS can transform your warehouse operations
                  </p>
                  <Button onClick={handleSignupClick} size="lg" className="w-full">
                    Get Started - View Features
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

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
          </CardContent>
        </Card>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset</DialogTitle>
            <DialogDescription>
              Enter your email address to receive a password reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendReset} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="username"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Send Reset Link
            </Button>
            {resetMessage?.error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{resetMessage.error}</AlertDescription>
              </Alert>
            )}
            {resetMessage?.success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{resetMessage.success}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end">
              <Button type="button" variant="ghost" onClick={handleCloseResetDialog}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthForm;
