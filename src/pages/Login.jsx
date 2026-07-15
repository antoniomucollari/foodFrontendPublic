import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const DEMO_ACCOUNTS = [
  { role: "Customer", email: "customer0@emaildomain.com", desc: "Browse menu & order food" },
  { role: "Delivery Rider", email: "argjendkaika@gmail.com", desc: "Accept & deliver orders" },
  { role: "Branch Manager", email: "ardit.hoxha@kfc.al", desc: "Manage branch orders & menus" },
  { role: "Restaurant Owner", email: "kehej55584@soppat.com", desc: "Manage branches & stats" },
  { role: "System Admin", email: "mucollariantonio@gmail.com", desc: "Full control & analytics" },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data);
      showSuccess('Login successful! Welcome back.');
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email) => {
    setIsLoading(true);
    try {
      await login({ email, password: 'Toni145@!' });
      showSuccess('Quick-logged in successfully!');
      navigate('/');
    } catch (err) {
      console.error('Quick login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-lg border-muted/50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Access the Flavor Fusion Demo platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  Or{' '}
                  <Link
                    to="/register"
                    className="font-medium text-primary hover:text-primary/80"
                  >
                    create a new account
                  </Link>
                </p>
              </div>

              <div className="relative my-6 pt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted/80" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold">
                  <span className="bg-card px-3 text-muted-foreground">
                    Demo Quick Login
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-2">
                {DEMO_ACCOUNTS.map((acc) => {
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin(acc.email)}
                      className="p-2.5 rounded-lg border border-muted/50 bg-muted/20 hover:bg-primary/5 hover:border-primary/30 text-left transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground leading-none group-hover:text-primary transition-colors">
                          {acc.role}
                        </p>
                        <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to Login
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">{acc.desc}</p>
                    </button>
                  );
                })}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
