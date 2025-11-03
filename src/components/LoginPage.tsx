import { useState } from "react";
import { LogIn, User, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase/client";

interface LoginPageProps {
  onLogin: (username: string, password: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

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
  };

  const handleSignup = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please enter both email and password to sign up");
      return;
    }
    try {
      const { error } = await supabase.auth.signUp({
        email: username,
        password: password,
      });

      if (error) {
        throw new Error(error.message);
      }

      // You should also tell the user to check their email for confirmation
      setError("Signup successful! Please check your email to verify.");
    } catch (err: any) {
      setError(err.message || 'Signup failed');
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
    <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[12px] p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5A5BEF]/10 mb-4">
              <LogIn className="w-8 h-8 text-[#5A5BEF]" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
              Welcome Back
            </h1>
            <p className="text-[var(--text-secondary)]">
              Sign in to your Private Teacher account
            </p>
          </div>

          {/* Google Login Button */}
          <div className="mb-6">
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
              className="w-full bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 h-11 text-base font-medium flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all duration-200"
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
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--card-bg)] px-2 text-[var(--text-secondary)]">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-[var(--app-bg)] border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[#5A5BEF]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-[var(--app-bg)] border-[var(--card-border)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[#5A5BEF]"
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

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white h-11 text-base font-medium"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Button>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={handleSignup}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Create an account
            </button>
          </div>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-[#5A5BEF]/10 border border-[#5A5BEF]/20 rounded-lg">
            <p className="text-xs text-[var(--text-secondary)] text-center">
              <strong className="text-[#5A5BEF]">Demo Mode:</strong> Any username and password will work for testing
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

