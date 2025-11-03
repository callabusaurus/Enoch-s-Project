"use client";

import { PricingPage } from "@/components/PricingPage";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

function PricingPageWrapper() {
  const { user, isLoading } = useAuth();

  // Ensure body doesn't have overflow hidden on this page
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-gray-900">Please log in to view pricing plans.</div>
      </div>
    );
  }

  return <PricingPage />;
}

export default function PricingRoute() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <PricingPageWrapper />
      </AuthProvider>
    </ThemeProvider>
  );
}
