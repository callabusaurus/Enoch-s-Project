"use client";

import { PolicyPage } from "../../../src/components/PolicyPage";
import { AuthProvider, useAuth } from "../../../src/context/AuthContext";
import { ThemeProvider } from "next-themes";

function LiabilityDisclaimerWrapper() {
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

  return <PolicyPage title="Liability Disclaimer" slug="liability-disclaimer" />;
}

export default function LiabilityDisclaimerPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <LiabilityDisclaimerWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}

