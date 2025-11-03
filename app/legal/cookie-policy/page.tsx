"use client";

import { PolicyPage } from "../../../src/components/PolicyPage";
import { AuthProvider, useAuth } from "../../../src/context/AuthContext";
import { ThemeProvider } from "next-themes";

function CookiePolicyWrapper() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center">
        <div className="text-[var(--text-primary)]">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex items-center justify-center">
        <div className="text-[var(--text-primary)]">Please log in to view this policy.</div>
      </div>
    );
  }

  return <PolicyPage title="Cookie Policy" slug="cookie-policy" />;
}

export default function CookiePolicyPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <CookiePolicyWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}

