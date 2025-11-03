import { useState } from "react";
import { LogIn, User, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase/client";

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || !password.trim()) {
      setError(isSignupMode 
        ? "Please enter both email and password to sign up" 
        : "Please enter both email and password");
      return;
    }

    if (isSignupMode) {
      if (!verifyPassword.trim()) {
        setError("Please verify your password");
        return;
      }
      if (password !== verifyPassword) {
        setError("Passwords do not match");
        return;
      }
      
      try {
        // Call the API route which creates both auth user and users table record
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: username,
            password: password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Show the actual error message from the API
          throw new Error(data.error || 'Signup failed');
        }

        // Try to sign in after successful signup (only works if email verification is disabled)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (signInError) {
          // If sign-in fails, it might be because email verification is required
          setError("Account created successfully! Please check your email to verify your account before logging in.");
          return;
        }

        // Force a full page reload after signup/login to refresh app state
        window.location.reload();
      } catch (err: any) {
        setError(err.message || 'Database error saving new user');
      }
    } else {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (error) {
          throw new Error(error.message);
        }

        // Force a full page reload after login is complete and the full session is stored
        // When the app reloads, the onAuthStateChange listener will fire with the complete session, including the access_token
        window.location.reload();
      } catch (err: any) {
        setError(err.message || 'Login failed');
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoadingGoogle(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }
      // The user will be redirected to Google, then back to your app
      // The AuthContext will handle the session update
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[var(--app-bg)] flex flex-row overflow-hidden">
      {/* Left Side - Form (40%) */}
      <div className="w-[40%] flex-shrink-0 flex items-center justify-start px-12 py-8">
        <div className="w-full max-w-md">
          {/* Petros Logo */}
          <div className="mb-8 flex items-center gap-2">
            <img 
              src="/favicon.png" 
              alt="Petros AI" 
              className="h-8 w-auto"
              onError={(e) => {
                // Hide logo if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <span 
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              Petros AI
            </span>
          </div>

          {/* Animated Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignupMode ? "signup" : "login"}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Content Container with Border Padding */}
              <div 
                style={{
                  padding: '32px 40px',
                  paddingTop: '40px',
                  paddingBottom: '40px',
                  width: '100%',
                  maxWidth: '100%'
                }}
              >
              {/* Main Heading */}
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <h1 style={{ 
                  fontSize: '3rem', 
                  fontWeight: 600,
                  lineHeight: '1.2',
                  marginBottom: '8px',
                  color: 'var(--text-primary)',
                  fontFamily: 'serif'
                }}>
                  Think It.
                  <br />
                  Solve It.
                </h1>
                <p style={{ 
                  fontSize: '1.125rem',
                  marginTop: '12px',
                  color: 'var(--text-secondary)'
                }}>
                  Learn Faster Achieve More.
                </p>
              </div>

              {/* Google Login Button */}
              <div className="mt-8 mb-6">
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoadingGoogle}
                  className="w-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 h-11 text-base font-medium flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all duration-200 rounded-lg"
                >
                  {isLoadingGoogle ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--card-border)]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[var(--app-bg)] px-2 text-[var(--text-secondary)]">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 w-full bg-[var(--app-bg)] border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[#5A5BEF] rounded-lg h-11"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={isSignupMode ? "Create password" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 w-full bg-[var(--app-bg)] border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[#5A5BEF] rounded-lg h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Verify Password Field (Signup only) */}
                {isSignupMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                      <Input
                        type={showVerifyPassword ? "text" : "password"}
                        placeholder="Verify password"
                        value={verifyPassword}
                        onChange={(e) => setVerifyPassword(e.target.value)}
                        className="pl-10 pr-10 w-full bg-[var(--app-bg)] border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[#5A5BEF] rounded-lg h-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showVerifyPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg text-sm ${
                      error.includes("successful") 
                        ? "bg-green-500/10 border border-green-500/20 text-green-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white h-11 text-base font-medium rounded-lg"
                >
                  {isSignupMode ? (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Log In
                    </>
                  )}
                </Button>

                {/* Toggle Link */}
                <div className="mt-4 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignupMode(!isSignupMode);
                      setError("");
                      setVerifyPassword("");
                    }}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {isSignupMode 
                      ? "Already have an account? Log in" 
                      : "Don't have an account? Create one"}
                  </button>
                </div>
              </form>

              {/* Demo Info */}
              <div className="mt-8 p-4 bg-[#5A5BEF]/10 border border-[#5A5BEF]/20 rounded-lg">
                <p className="text-xs text-[var(--text-secondary)] text-left">
                  <strong className="text-[#5A5BEF]">Demo Mode:</strong> Any email and password will work for testing
                </p>
              </div>
              </div>
              {/* End Content Container */}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Side - Image (60%) */}
      <div className="flex-1 w-[60%] bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center overflow-hidden p-8">
        <img 
          src="/doodle.png" 
          alt="Petros" 
          className="w-auto h-auto object-contain"
          style={{ 
            maxWidth: '48vw', 
            maxHeight: '80vh',
            width: 'auto',
            height: 'auto'
          }}
          onError={(e) => {
            // Fallback to gradient if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    </div>
  );
}

