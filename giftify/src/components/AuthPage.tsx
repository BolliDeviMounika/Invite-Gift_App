import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Check, RefreshCw, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  initialView?: 'login' | 'register' | 'forgot' | 'reset';
  tokenParam?: string | null;
  onAuthSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
  onNavigate: (view: string) => void;
}

export default function AuthPage({ initialView = 'login', tokenParam = null, onAuthSuccess, onNavigate }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialView);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [token, setToken] = useState(tokenParam || "");

  // Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [simulationLink, setSimulationLink] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) {
      setMode('reset');
      setToken(tokenParam);
    } else {
      setMode(initialView);
    }
  }, [initialView, tokenParam]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Try again.");
      } else {
        setSuccess("Account registered successfully!");
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 1000);
      }
    } catch (err) {
      setError("Network or server connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect email or password.");
      } else {
        setSuccess("Login successful! Entering dashboard...");
        if (rememberMe) {
          localStorage.setItem('giftify_remembered_email', email);
        } else {
          localStorage.removeItem('giftify_remembered_email');
        }
        setTimeout(() => {
          onAuthSuccess(data.token, data.user);
        }, 800);
      }
    } catch (err) {
      setError("Network error connecting to auth server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSimulationLink(null);

    if (!email) {
      setError("Email address is required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Forgot password processing failed.");
      } else {
        setSuccess("We have initialized a password reset. For easy testing in our Sandbox environment, click the simulator link below.");
        if (data.simulationLink) {
          setSimulationLink(data.simulationLink);
        }
      }
    } catch (err) {
      setError("Network error dispatching request.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed. Token might be invalid or expired.");
      } else {
        setSuccess("Your password was updated successfully. You can now login!");
        setTimeout(() => {
          setMode('login');
          // Clear query param
          window.history.pushState({}, document.title, window.location.pathname);
        }, 1500);
      }
    } catch (err) {
      setError("Network error resetting password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Populate email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem('giftify_remembered_email');
    if (savedEmail && mode === 'login') {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [mode]);

  return (
    <div className="min-h-[85vh] bg-gray-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans animate-fade-in">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          {mode === 'login' && "Sign in to your account"}
          {mode === 'register' && "Create your coordinator account"}
          {mode === 'forgot' && "Recover your password"}
          {mode === 'reset' && "Define a new password"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {mode === 'login' && (
            <>
              Or{' '}
              <button onClick={() => { setMode('register'); setError(null); }} className="font-semibold text-purple-600 hover:text-purple-500 cursor-pointer">
                register a new organizer profile
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              Or{' '}
              <button onClick={() => { setMode('login'); setError(null); }} className="font-semibold text-purple-600 hover:text-purple-500 cursor-pointer">
                sign in with existing credentials
              </button>
            </>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button onClick={() => { setMode('login'); setError(null); setSimulationLink(null); }} className="font-semibold text-purple-600 hover:text-purple-500 cursor-pointer">
              Return to standard login
            </button>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-100 rounded-3xl sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold border border-green-100">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* SIMULATION CONTAINER FOR TESTING FORGOT PASSWORD FOR EXCELLENT DEV EXP */}
          {simulationLink && (
            <div className="mb-6 bg-purple-50 border-2 border-dashed border-purple-200 p-4 rounded-2xl">
              <span className="text-xs font-bold text-purple-700 flex items-center space-x-1 mb-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Sandbox Email Dispatch Simulator</span>
              </span>
              <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                Giftify simulation mock-dispatched the reset link to {email}. Click below to mock opening the email reset link instantly:
              </p>
              <a
                href={simulationLink} // Will naturally trigger tokenParam load
                onClick={(e) => {
                  e.preventDefault();
                  const urlObj = new URL(simulationLink);
                  const tokenVal = urlObj.searchParams.get('token');
                  if (tokenVal) {
                    setToken(tokenVal);
                    setMode('reset');
                    setSimulationLink(null);
                    setSuccess(null);
                  }
                }}
                className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-xl cursor-pointer"
              >
                <span>Mock Click: Reset Link</span>
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* LOGIN MODULE */}
          {mode === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Email address</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-500 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-800 font-medium">
                    Remember me
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>
          )}

          {/* REGISTER MODULE */}
          {mode === 'register' && (
            <form className="space-y-4" onSubmit={handleRegister}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Full Name</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Alex Morgan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Email address</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Password</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Confirm Password</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoading ? "Creating Account..." : "Register Now"}
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD MODULE */}
          {mode === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <p className="text-gray-500 text-xs leading-relaxed text-center">
                Type your email, and we'll immediately dispatch a password reset token.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Email address</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoading ? "Requesting..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          )}

          {/* RESET PASSWORD MODULE */}
          {mode === 'reset' && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div className="p-3 bg-amber-50 rounded-xl mb-4 border border-amber-100 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 font-medium">
                  <strong>Active Session:</strong> Carrying valid reset token. Define your secure password credentials below.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">New Password</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 block w-full text-sm border border-gray-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isLoading ? "Updating Password..." : "Submit New Password"}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
