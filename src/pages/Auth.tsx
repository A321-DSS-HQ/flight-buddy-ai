import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { PasswordStrength } from '@/components/ui/password-strength';
import { toast } from 'sonner';
import { Plane, Mail, Shield } from 'lucide-react';
import { signUpSchema, signInSchema, sanitizeInput, createRateLimiter } from '@/lib/validation';

// Rate limiter: 5 attempts per 15 minutes per IP
const authRateLimiter = createRateLimiter(5, 15 * 60 * 1000);

const Auth = () => {
  const { user, loading, signUp, signIn, signInWithGoogle, signInWithTwitter, signInWithFacebook } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-cockpit-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Rate limiting check
    const clientId = 'signup-' + (navigator.userAgent + Date.now()).slice(0, 20);
    if (!authRateLimiter(clientId)) {
      toast.error('Too many signup attempts. Please wait 15 minutes before trying again.');
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedFullName = sanitizeInput(fullName);
    
    // Validate inputs
    const validation = signUpSchema.safeParse({
      email: sanitizedEmail,
      password,
      fullName: sanitizedFullName,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          errors[error.path[0] as string] = error.message;
        }
      });
      setValidationErrors(errors);
      toast.error('Please fix the validation errors');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await signUp(sanitizedEmail, password, sanitizedFullName);
      
      if (error) {
        // Generic error message for security
        toast.error('Registration failed. Please check your information and try again.');
      } else {
        toast.success('Check your email to confirm your account');
        // Clear form on success
        setEmail('');
        setPassword('');
        setFullName('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Rate limiting check
    const clientId = 'signin-' + (navigator.userAgent + Date.now()).slice(0, 20);
    if (!authRateLimiter(clientId)) {
      toast.error('Too many login attempts. Please wait 15 minutes before trying again.');
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);
    
    // Validate inputs
    const validation = signInSchema.safeParse({
      email: sanitizedEmail,
      password,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          errors[error.path[0] as string] = error.message;
        }
      });
      setValidationErrors(errors);
      toast.error('Please check your login credentials');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await signIn(sanitizedEmail, password);
      
      if (error) {
        // Generic error message for security
        toast.error('Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'twitter' | 'facebook') => {
    setIsLoading(true);
    let error;
    
    switch (provider) {
      case 'google':
        ({ error } = await signInWithGoogle());
        break;
      case 'twitter':
        ({ error } = await signInWithTwitter());
        break;
      case 'facebook':
        ({ error } = await signInWithFacebook());
        break;
    }
    
    setIsLoading(false);
    
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-cockpit-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-cockpit bg-display-gradient border-border">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Plane className="h-8 w-8 text-primary mr-2" />
            <CardTitle className="text-2xl text-foreground">DSS Pilot Assistant</CardTitle>
          </div>
          <CardDescription className="text-muted-foreground">
            Sign in to access your A321 flight guidance system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="pilot@airline.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={validationErrors.email ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Captain John Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={validationErrors.fullName ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.fullName && (
                    <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="pilot@airline.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={validationErrors.email ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-red-500">{validationErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    <div className="flex items-center gap-2">
                      Password
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setShowPasswordStrength(e.target.value.length > 0);
                    }}
                    className={validationErrors.password ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.password && (
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  )}
                  {showPasswordStrength && (
                    <PasswordStrength password={password} className="mt-3" />
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <Separator className="my-4" />
            <p className="text-center text-sm text-muted-foreground mb-4">
              Or continue with
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('twitter')}
                disabled={isLoading}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;