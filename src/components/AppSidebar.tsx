import React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Globe, 
  FolderKanban, 
  Sparkles,
  MessageSquare,
  Settings,
  User,
  ChevronDown,
  HelpCircle,
  LogOut,
  Palette,
  Menu,
  X
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "../lib/supabase/client";
import { getAvatarUrl, getUserInitials } from "../lib/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onOpenPersonalization: () => void;
  onNewChat: () => void;
  onOpenLibrary: () => void;
  onOpenExplore: () => void;
  onOpenAtlas: () => void;
  onOpenProjects: () => void;
  onSelectChat: (chatId: string) => void;
  onLogout: () => void;
  activeChat: string;
  activeView: "chat" | "atlas" | "explore" | "projects";
  user: any; // update type as needed
}

export function AppSidebar({ 
  isOpen,
  onToggle,
  onOpenSettings, 
  onOpenPersonalization,
  onNewChat,
  onOpenLibrary,
  onOpenExplore,
  onOpenAtlas,
  onOpenProjects,
  onSelectChat,
  onLogout,
  activeChat,
  activeView,
  user
}: AppSidebarProps) {
  // Determine active item based on activeView and activeChat
  const getActiveItem = () => {
    if (activeView === "atlas") return "atlas";
    if (activeView === "explore") return "explore";
    if (activeView === "projects") return "projects";
    // If activeView is chat, check if it's a specific chat or new-chat
    return activeChat === "new-chat" ? "new-chat" : activeChat;
  };
  
  const activeItem = getActiveItem();

  const mainItems = [
    { id: "new-chat", icon: Plus, label: "New Chat" },
    { id: "atlas", icon: Globe, label: "Atlas" },
    { id: "projects", icon: FolderKanban, label: "Projects" },
  ];

  const gptItems = [
    { id: "explore", icon: Sparkles, label: "Explore Tutors" },
  ];

  const [recentChats, setRecentChats] = useState<Array<{ id: string; title: string }>>([]);

  // Fetch last 5 chats when sidebar is open
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('/api/library/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          // Get last 5 chats (they're already ordered by created_at descending)
          setRecentChats(data.slice(0, 5).map((chat: any) => ({
            id: chat.id,
            title: chat.title || chat.id
          })));
        }
      } catch {}
    })();
  }, [isOpen]);

  return (
    <motion.div
      initial={false}
      animate={{
        width: isOpen ? 256 : 64,
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="h-full bg-[var(--card-bg)] border-r border-[var(--card-border)] flex flex-col overflow-hidden"
    >
      {/* Toggle Button Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--card-border)] flex-shrink-0">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden flex items-center"
            >
              <img 
                src="/favicon.png" 
                alt="Logo" 
                className="h-8 w-auto"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors flex-shrink-0"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-[var(--text-primary)]" />
          ) : (
            <Menu className="w-5 h-5 text-[var(--text-primary)]" />
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {mainItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeItem === item.id}
            collapsed={!isOpen}
            onClick={() => {
              if (item.id === "new-chat") onNewChat();
              if (item.id === "atlas") onOpenAtlas();
              if (item.id === "projects") onOpenProjects();
            }}
          />
        ))}

        {/* Explore Tutors */}
        <div className="pt-6 pb-2">
          <div className="space-y-1">
            {gptItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeItem === item.id}
                collapsed={!isOpen}
                onClick={() => { 
                  if (item.id === 'explore') onOpenExplore(); 
                }}
              />
            ))}
          </div>
        </div>

        {/* Chats Section */}
        <div className="pt-4 pb-2">
          <button
            onClick={() => {
              onOpenLibrary();
            }}
            className={`w-full mb-2 ${isOpen ? 'px-3 py-2 flex items-center gap-2' : 'px-2 py-2 flex justify-center'} rounded-lg bg-white dark:bg-black hover:opacity-90 transition-opacity cursor-pointer`}
            title={!isOpen ? "Chats" : undefined}
          >
            <MessageSquare className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="!text-black dark:!text-white font-medium"
                >
                  Chats
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <div className="space-y-1">
            {recentChats.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectChat(item.id);
                }}
                className={`relative flex items-center ${isOpen ? 'px-3' : 'px-2 justify-center'} py-2.5 w-full rounded-xl transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-[#1E1E1E] ${activeChat === item.id && activeView === "chat" ? 'bg-transparent dark:bg-transparent' : ''}`}
                title={!isOpen ? item.title : undefined}
              >
                {activeChat === item.id && activeView === "chat" && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#5A5BEF] rounded-r-full" />
                )}
                <AnimatePresence>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className={`${activeChat === item.id && activeView === "chat" ? 'text-[#5A5BEF] dark:text-white font-medium' : 'text-[var(--text-secondary)]'} whitespace-nowrap overflow-hidden truncate`}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="border-t border-[var(--card-border)] p-3 space-y-2 flex-shrink-0">
        <div className="flex items-center justify-center px-2">
          <ThemeToggle />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'} w-full p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors`}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                {user && getAvatarUrl(user) && (
                  <AvatarImage src={getAvatarUrl(user)!} alt={user.email || ''} />
                )}
                <AvatarFallback className="bg-[#5A5BEF] text-white">
                  {user ? getUserInitials(user) : "?"}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 text-left overflow-hidden"
                  >
                    <div className="text-[var(--text-primary)] truncate">{user?.email || user?.id}</div>
                    <div className="text-[var(--text-secondary)]">Free</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="top" 
            align="end"
            className="w-56 bg-background border-[var(--card-border)] text-[var(--text-primary)] mb-2"
          >
            <DropdownMenuItem className="focus:bg-[var(--hover-bg)] focus:text-[var(--text-primary)] cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--card-border)]" />
            <DropdownMenuItem 
              onClick={onOpenPersonalization}
              className="focus:bg-[var(--hover-bg)] focus:text-[var(--text-primary)] cursor-pointer"
            >
              <Palette className="w-4 h-4 mr-2" />
              Personalization
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onOpenSettings}
              className="focus:bg-[var(--hover-bg)] focus:text-[var(--text-primary)] cursor-pointer"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--card-border)]" />
            <DropdownMenuItem 
              onClick={() => {
                // This would open a help dialog - we'll add this
                const event = new CustomEvent('openHelp');
                window.dispatchEvent(event);
              }}
              className="focus:bg-[var(--hover-bg)] focus:text-[var(--text-primary)] cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                if (confirm('Are you sure you want to log out?')) {
                  onLogout();
                }
              }}
              className="focus:bg-[var(--hover-bg)] focus:text-[var(--text-primary)] cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
