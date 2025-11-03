export const dynamic = "force-dynamic";
"use client";

import { LegalPageContent } from "@/components/LegalPageContent";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";

function LegalPageWrapper() {
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
        <div className="text-[var(--text-primary)]">Please log in to view legal policies.</div>
      </div>
    );
  }

  return <LegalPageContent />;
}

export default function LegalPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <LegalPageWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}

