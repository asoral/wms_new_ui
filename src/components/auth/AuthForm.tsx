
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Warehouse, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from './AuthContext';

const AuthForm = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

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

  if (showOnboarding) {
    const OnboardingCarousel = require('../onboarding/OnboardingCarousel').default;
    return <OnboardingCarousel onComplete={() => setShowOnboarding(false)} />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(loginForm.email, loginForm.password);

    if (error) {
      setError(error.message);
    } else {
      navigate('/');
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

    const { error } = await signUp(
      signupForm.email, 
      signupForm.password, 
      signupForm.fullName,
      {
        erpnext_url: signupForm.erpnextUrl,
        erpnext_api_key: signupForm.erpnextApiKey,
        erpnext_api_secret: signupForm.erpnextApiSecret
      }
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl text-gray-900">WMS</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to WMS</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one to get started
            </CardDescription>
            <Button 
              variant="outline" 
              onClick={() => setShowOnboarding(true)}
              className="mt-2"
            >
              View App Features
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
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
                </form>
              </TabsContent>

              <TabsContent value="signup">
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
                </form>
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
    </div>
  );
};

export default AuthForm;
