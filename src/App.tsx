import { useState, useEffect } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { ChatArea } from "./components/ChatArea";
import { AtlasArea } from "./components/AtlasArea";
import { ExploreArea } from "./components/ExploreArea";
import { SettingsModal } from "./components/SettingsModal";
import { SearchChatsDialog } from "./components/SearchChatsDialog";
import { LibraryDialog } from "./components/LibraryDialog";
import { HelpDialog } from "./components/HelpDialog";
import { ProjectsArea } from "./components/ProjectsArea";
import { LoginPage } from "./components/LoginPage";
import { LegalPageContent } from "./components/LegalPageContent";
import { PolicyPage } from "./components/PolicyPage";
import { RefundPolicyPage } from "./components/RefundPolicyPage";
import { CookiePolicyPage } from "./components/CookiePolicyPage";
import { UserConductPolicyPage } from "./components/UserConductPolicyPage";
import { DMCATakedownPolicyPage } from "./components/DMCATakedownPolicyPage";
import { LiabilityDisclaimerPage } from "./components/LiabilityDisclaimerPage";
import { ContactSupportPage } from "./components/ContactSupportPage";
import { toast, Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";

function MainApp() {
  const { user, isLoading, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [activeChat, setActiveChat] = useState("new-chat");
  const [activeAtlasChat, setActiveAtlasChat] = useState("new-chat");
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "atlas" | "explore" | "projects">("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Listen for URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);
    
    // Check pathname periodically for window.location.href changes
    const interval = setInterval(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    }, 100);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [currentPath]);

  // Listen for help event - must be before any conditional returns
  useEffect(() => {
    const handleOpenHelp = () => setHelpOpen(true);
    window.addEventListener('openHelp', handleOpenHelp);
    return () => window.removeEventListener('openHelp', handleOpenHelp);
  }, []);

  if (isLoading) return null;
  if (!user) {
    return (
      <>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
            },
          }}
        />
        <LoginPage onLogin={() => {}} />
      </>
    );
  }

  // If on /legal route, show standalone legal page
  if (currentPath === '/legal') {
    return (
      <>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
            },
          }}
        />
        <LegalPageContent />
      </>
    );
  }

  // If on /contact-support route, show contact support page
  if (currentPath === '/contact-support') {
    return (
      <>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
            },
          }}
        />
        <ContactSupportPage />
      </>
    );
  }

  // Handle individual policy pages
  const policyRoutes: { [key: string]: string } = {
    '/legal/refund-and-cancellation': 'Refund and Cancellation Policy',
    '/legal/cookie-policy': 'Cookie Policy',
    '/legal/user-conduct': 'User Conduct and Content Policy',
    '/legal/dmca-takedown': 'DMCA and Content Takedown Policy',
    '/legal/liability-disclaimer': 'Liability Disclaimer',
  };

  if (policyRoutes[currentPath]) {
    const slug = currentPath.replace('/legal/', '');
    
    // Special handling for refund policy with full content
    if (currentPath === '/legal/refund-and-cancellation') {
      return (
        <>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
              },
            }}
          />
          <RefundPolicyPage />
        </>
      );
    }
    
    // Special handling for cookie policy with full content
    if (currentPath === '/legal/cookie-policy') {
      return (
        <>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
              },
            }}
          />
          <CookiePolicyPage />
        </>
      );
    }
    
    // Special handling for user conduct policy with full content
    if (currentPath === '/legal/user-conduct') {
      return (
        <>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
              },
            }}
          />
          <UserConductPolicyPage />
        </>
      );
    }
    
    // Special handling for DMCA takedown policy with full content
    if (currentPath === '/legal/dmca-takedown') {
      return (
        <>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
              },
            }}
          />
          <DMCATakedownPolicyPage />
        </>
      );
    }
    
    // Special handling for liability disclaimer with full content
    if (currentPath === '/legal/liability-disclaimer') {
      return (
        <>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-primary)',
              },
            }}
          />
          <LiabilityDisclaimerPage />
        </>
      );
    }
    
    // Other policies still use generic PolicyPage
    return (
      <>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              color: 'var(--text-primary)',
            },
          }}
        />
        <PolicyPage title={policyRoutes[currentPath]} slug={slug} />
      </>
    );
  }

  const handleOpenPersonalization = () => {
    setActiveTab("personalization");
    setSettingsOpen(true);
  };

  const handleNewChat = () => {
    setActiveChat("new-chat");
    setActiveTeacherId(null); // Clear teacher when starting new regular chat
    setActiveView("chat");
    toast.success("Started a new chat");
  };

  const handleSelectChat = (chatId: string) => {
    // If currently in Atlas view, set Atlas chat; otherwise set regular chat
    if (activeView === "atlas") {
      setActiveAtlasChat(chatId);
      setActiveView("atlas");
    } else {
      setActiveChat(chatId);
      setActiveTeacherId(null); // Clear teacher when selecting existing chat (will be loaded from DB if it has one)
      setActiveView("chat");
    }
    toast.info("Loaded chat history");
  };

  const handleSelectTeacher = (teacherId: string) => {
    setActiveChat("new-chat"); // Use "new-chat" instead of composite ID
    setActiveTeacherId(teacherId); // Store teacher ID separately
    setActiveView("chat");
    toast.success("Started tutor chat");
  };

  const handleChatIdUpdate = (newChatId: string) => {
    setActiveChat(newChatId);
  };

  const handleOpenAtlas = () => {
    setActiveAtlasChat("new-chat"); // Reset to new chat when opening Atlas
    setActiveView("atlas");
  };

  const handleAtlasChatIdUpdate = (newChatId: string) => {
    setActiveAtlasChat(newChatId);
  };

  const handleOpenExplore = () => {
    setActiveView("explore");
  };

  const handleOpenProjects = () => {
    setActiveView("projects");
  };

  return (
    <div className="flex h-screen bg-[var(--app-bg)] overflow-hidden">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            color: 'var(--text-primary)',
          },
        }}
      />
      
      <AppSidebar 
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => {
          setActiveTab("general");
          setSettingsOpen(true);
        }}
        onOpenPersonalization={handleOpenPersonalization}
        onNewChat={handleNewChat}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenExplore={handleOpenExplore}
        onOpenAtlas={handleOpenAtlas}
        onOpenProjects={handleOpenProjects}
        onSelectChat={handleSelectChat}
        onLogout={logout}
        activeChat={activeChat}
        activeView={activeView}
        user={user}
      />
      
      {activeView === "chat" ? (
        <ChatArea 
          chatId={activeChat} 
          teacherId={activeTeacherId || undefined}
          onReset={handleNewChat} 
          onChatIdUpdate={handleChatIdUpdate} 
        />
      ) : activeView === "atlas" ? (
        <AtlasArea 
          chatId={activeAtlasChat}
          onChatIdUpdate={handleAtlasChatIdUpdate}
        />
      ) : activeView === "explore" ? (
        <ExploreArea onSelectTeacher={handleSelectTeacher} />
      ) : activeView === "projects" ? (
        <ProjectsArea />
      ) : null}
      
      <SettingsModal 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)}
        initialTab={activeTab}
      />
      
      <SearchChatsDialog 
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectChat={handleSelectChat}
      />
      
      <LibraryDialog 
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelectChat={handleSelectChat}
      />
      
      <HelpDialog 
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
