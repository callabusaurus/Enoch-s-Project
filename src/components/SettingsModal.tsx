import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, Palette, Shield, Lock, User as UserIcon, Coins, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuth } from '../context/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: string;
}

const tabs = [
  { id: "personalization", label: "Personalization", icon: Palette },
  { id: "credits", label: "Credits", icon: Coins },
  { id: "account", label: "Account", icon: UserIcon },
];

// Payment Modal Component
interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
}

function PaymentModal({ open, onClose }: PaymentModalProps) {
  if (typeof window === 'undefined') return null;
  
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop - Fully opaque */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{
              backgroundColor: '#000000',
              opacity: 1,
            }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="bg-white dark:bg-[#181818] payment-modal-bg border border-gray-200 dark:border-[#2A2A2A] payment-modal-border rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <style>{`
                @media (prefers-color-scheme: light), :not(.dark) {
                  .payment-modal-text-primary {
                    color: rgb(17, 24, 39) !important;
                  }
                  .payment-modal-text-secondary {
                    color: rgb(75, 85, 99) !important;
                  }
                  .payment-modal-bg {
                    background-color: rgb(255, 255, 255) !important;
                  }
                  .payment-modal-border {
                    border-color: rgb(229, 231, 235) !important;
                  }
                }
                .dark .payment-modal-text-primary {
                  color: #EAEAEA !important;
                }
                .dark .payment-modal-text-secondary {
                  color: #A0A0A0 !important;
                }
                .dark .payment-modal-bg {
                  background-color: #181818 !important;
                }
                .dark .payment-modal-border {
                  border-color: #2A2A2A !important;
                }
              `}</style>
              <div className="flex justify-end mb-4">
                <button
                  onClick={onClose}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">💳</div>
                <p className="payment-modal-text-primary text-lg font-medium mb-2">
                  Payments are coming soon!
                </p>
                <p className="payment-modal-text-secondary text-sm">
                  We're currently working on enabling Razorpay integration. Please hold on 🙂
                </p>
              </div>
              
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Confirm Delete Modal Component (same portal/animation pattern as PaymentModal)
interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmDeleteModal({ open, onClose, onConfirm }: ConfirmDeleteModalProps) {
  if (typeof window === 'undefined') return null;
  
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: '#000000' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 60 }}
          >
            <div 
              className="bg-white dark:bg-[#181818] confirm-modal-bg border border-gray-200 dark:border-[#2A2A2A] confirm-modal-border rounded-xl shadow-xl w-full max-w-lg p-6"
            >
              <style>{`
                @media (prefers-color-scheme: light), :not(.dark) {
                  .confirm-modal-text-primary { color: rgb(17, 24, 39) !important; }
                  .confirm-modal-text-secondary { color: rgb(75, 85, 99) !important; }
                  .confirm-modal-bg { background-color: rgb(255, 255, 255) !important; }
                  .confirm-modal-border { border-color: rgb(229, 231, 235) !important; }
                }
                .dark .confirm-modal-text-primary { color: #EAEAEA !important; }
                .dark .confirm-modal-text-secondary { color: #A0A0A0 !important; }
                .dark .confirm-modal-bg { background-color: #181818 !important; }
                .dark .confirm-modal-border { border-color: #2A2A2A !important; }
              `}</style>
              <div className="flex justify-end mb-4">
                <button
                  onClick={onClose}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-lg font-medium confirm-modal-text-primary mb-2">
                  Are you sure you want to delete your account?
                </p>
                <p className="text-sm confirm-modal-text-secondary">
                  This action is permanent.
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between w-full">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#1E1E1E] text-gray-900 dark:text-[#EAEAEA]"
                >
                  No
                </button>
                <button
                  onClick={onConfirm}
                  aria-label="Confirm account deletion"
                  style={{ backgroundColor: '#dc2626' }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md border border-red-700/60 hover:shadow-lg active:scale-[0.99] transition-all select-none z-[61] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#181818]"
                >
                  Yes, delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function SettingsModal({ open, onClose, initialTab = "personalization" }: SettingsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [credits, setCredits] = useState(0);
  const [atlasCredits, setAtlasCredits] = useState(0);
  const [creditType, setCreditType] = useState<'normal' | 'atlas'>('normal');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // State for user settings
  const [settings, setSettings] = useState({
    enable_customization: true,
    teacher_personality: 'default',
    custom_instructions: '',
    call_me_by: 'Chief',
    about_user: '',
    theme: 'dark',
    language: 'en',
    accentColor: 'purple',
    save_chat_history: true,
    improve_model: true,
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Update active tab when initialTab changes
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // Load credits and settings from backend
  useEffect(() => {
    if (!open) return;
    setIsLoadingSettings(true);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        // Fetch credits and profile in parallel
        const [creditsRes, profileRes] = await Promise.all([
          fetch('/api/credits', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);
        
        const creditsData = await creditsRes.json();
        if (creditsRes.ok && typeof creditsData.credits === 'number') {
          setCredits(creditsData.credits);
          // If atlas credits are also returned:
          if (typeof creditsData.atlasCredits === 'number') {
            setAtlasCredits(creditsData.atlasCredits);
          }
        }
        
        const profileData = await profileRes.json();
        if (profileRes.ok) {
          // Update settings state with fetched data
          setSettings(prev => ({
            ...prev,
            enable_customization: profileData.enable_customization ?? true,
            teacher_personality: profileData.teacher_personality || 'default',
            custom_instructions: profileData.custom_instructions || '',
            call_me_by: profileData.call_me_by || 'Chief',
            about_user: profileData.about_user || '',
            theme: profileData.theme || 'dark',
            language: profileData.language || 'en',
            accentColor: profileData.accentColor || 'purple',
            save_chat_history: profileData.save_chat_history ?? true,
            improve_model: profileData.improve_model ?? true,
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    })();
  }, [open]);

  const saveProfile = async (updates: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }
      
      const data = await res.json();
      
      if (res.ok) {
        // Update local settings state immediately
        setSettings(prev => ({ ...prev, ...updates }));
        // Refresh auth session so AuthContext updates everywhere
        await supabase.auth.refreshSession();
        // Dispatch event to notify other components (like ChatArea) that settings were updated
        window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: updates }));
        return data; // Return the saved data
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error; // Re-throw so calling function knows it failed
    }
  };

  const savePersonalizationSettings = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const updates = {
        enable_customization: settings.enable_customization,
        teacher_personality: settings.teacher_personality,
        custom_instructions: settings.custom_instructions,
        call_me_by: settings.call_me_by,
        about_user: settings.about_user,
      };
      
      const savedData = await saveProfile(updates);
      
      // Verify that custom_instructions was actually saved
      if (savedData && savedData.custom_instructions === updates.custom_instructions) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw new Error('Settings were not saved correctly');
      }
    } catch (error) {
      console.error('Error saving personalization settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch('/api/export/data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch {}
  };
  const deleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch('/api/export/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch {}
  };

  const handleAddCredits = async (amount: number, type: 'normal' | 'atlas' = 'normal') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/credits/increment', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ amount, type }) 
      });
      const data = await res.json();
      if (res.ok) {
        if (type === 'normal' && typeof data.credits === 'number') {
          setCredits(data.credits);
        } else if (type === 'atlas' && typeof data.atlasCredits === 'number') {
          setAtlasCredits(data.atlasCredits);
        }
      }
    } catch {}
  };

  const handleResetCredits = async () => {
    // Demo reset: set to 15 via direct update to users credits endpoint (increment negative is not allowed). Use PUT profile.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/user/profile', { 
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ credits: 15 }) 
      });
      if (res.ok) setCredits(15);
    } catch {}
  };

  // Format member since text
  const formatMonthYear = (date: Date) =>
    new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);
  const memberSinceText = user?.created_at
    ? `Member since ${formatMonthYear(new Date(user.created_at))}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[1200px] max-w-[95vw] h-[80vh] bg-background border border-[var(--card-border)] p-0 rounded-[12px] flex">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your application settings and preferences
        </DialogDescription>
        <div className="flex w-full h-full">
          {/* Tabs Sidebar */}
          <div className="w-64 border-r border-[var(--card-border)] p-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[var(--hover-bg)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-8 flex flex-col">
            {/* All tab contents rendered here, vertical, never breaking out */}
            {/* (No min-w-full/w-full on tab content blocks) */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === "personalization" && (
                  <motion.div
                    key="personalization"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h2 className="text-gray-900 dark:text-[#EAEAEA] mb-6">Personalization</h2>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-[12px]">
                      <div>
                        <div className="text-gray-900 dark:text-[#EAEAEA]">Enable Customization</div>
                        <div className="text-gray-600 dark:text-[#A0A0A0]">Allow Private Teacher to learn from your conversations</div>
                      </div>
                      <Switch 
                        checked={settings.enable_customization} 
                        onCheckedChange={(c) => saveProfile({ enable_customization: c })} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-600 dark:text-[#A0A0A0]">Private Teacher Personality</label>
                      <Select 
                        value={settings.teacher_personality} 
                        onValueChange={(v) => saveProfile({ teacher_personality: v })}
                      >
                        <SelectTrigger className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A]">
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-600 dark:text-[#A0A0A0]">Custom Instructions</label>
                      <Textarea
                        placeholder="What would you like Private Teacher to know about you?"
                        value={settings.custom_instructions}
                        onChange={(e) => setSettings(prev => ({ ...prev, custom_instructions: e.target.value }))}
                        className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] min-h-[120px] resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-600 dark:text-[#A0A0A0]">How should I call you?</label>
                      <Input
                        placeholder="Nickname"
                        value={settings.call_me_by}
                        onChange={(e) => setSettings(prev => ({ ...prev, call_me_by: e.target.value }))}
                        className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA]"
                      />
                      <p className="text-gray-600 dark:text-[#A0A0A0]">This will be used in greetings and throughout the conversation.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-600 dark:text-[#A0A0A0]">About You</label>
                      <Textarea
                        placeholder="Tell me about yourself, your work, interests..."
                        value={settings.about_user}
                        onChange={(e) => setSettings(prev => ({ ...prev, about_user: e.target.value }))}
                        className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] min-h-[80px] resize-none"
                      />
                    </div>

                    {/* Save Button - Bottom Right */}
                    <div className="flex justify-end mt-6">
                      <div className="flex items-center gap-3">
                        {saveSuccess && (
                          <span className="text-green-400 text-sm">Saved successfully!</span>
                        )}
                        <Button
                          onClick={savePersonalizationSettings}
                          disabled={isSaving}
                          className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "credits" && (
                  <motion.div
                    key="credits"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h2 className="text-gray-900 dark:text-[#EAEAEA] mb-6">Credits Management</h2>
                    
                    {/* Current Credits Display */}
                    <div className="p-6 bg-gradient-to-r from-[#5A5BEF]/20 to-[#5A5BEF]/10 border border-[#5A5BEF]/30 rounded-[12px]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          <div className="text-gray-600 dark:text-[#A0A0A0] text-sm mb-1">Available Credits</div>
                          <div className="text-4xl font-bold text-gray-900 dark:text-[#EAEAEA] mb-4">{credits.toLocaleString()}</div>
                          
                          <div className="text-gray-600 dark:text-[#A0A0A0] text-sm mb-1">Available Atlas Credits</div>
                          <div className="text-4xl font-bold text-gray-900 dark:text-[#EAEAEA]">{atlasCredits.toLocaleString()}</div>
                        </div>
                        <div className="p-4 bg-[#5A5BEF]/20 rounded-full">
                          <Coins className="w-8 h-8 text-[#5A5BEF]" />
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-[#A0A0A0] text-sm">
                        1 credit per message. Credits refill monthly or can be purchased.
                      </p>
                    </div>

                    {/* Add Credits Section */}
                    <div className="space-y-4">
                      <h3 className="text-gray-900 dark:text-[#EAEAEA] text-lg font-semibold">Add Credits</h3>
                      
                      {/* Toggle for Credit Type */}
                      <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-[12px]">
                        <span className="text-gray-900 dark:text-[#EAEAEA] text-sm">Credit Type:</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCreditType('normal')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              creditType === 'normal'
                                ? 'bg-[#5A5BEF] text-white'
                                : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#1E1E1E]'
                            }`}
                          >
                            Normal Credits
                          </button>
                          <button
                            onClick={() => setCreditType('atlas')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              creditType === 'atlas'
                                ? 'bg-[#5A5BEF] text-white'
                                : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#A0A0A0] hover:bg-gray-200 dark:hover:bg-[#1E1E1E]'
                            }`}
                          >
                            Atlas Credits
                          </button>
                        </div>
                      </div>
                      
                      {/* Credit Options */}
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setPaymentModalOpen(true)}
                          className="p-4 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-[12px] hover:border-[#5A5BEF] transition-colors text-center"
                        >
                          <div className="text-[#5A5BEF] font-semibold text-lg mb-1">+20</div>
                          <div className="text-gray-600 dark:text-[#A0A0A0] text-xs mb-2">Credits</div>
                          <div className="text-gray-900 dark:text-[#EAEAEA] text-sm font-medium">₹30</div>
                        </button>
                        <button
                          onClick={() => setPaymentModalOpen(true)}
                          className="p-4 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-[12px] hover:border-[#5A5BEF] transition-colors text-center"
                        >
                          <div className="text-[#5A5BEF] font-semibold text-lg mb-1">+100</div>
                          <div className="text-gray-600 dark:text-[#A0A0A0] text-xs mb-2">Credits</div>
                          <div className="text-gray-900 dark:text-[#EAEAEA] text-sm font-medium">₹120</div>
                        </button>
                      </div>
                    </div>

                    {/* Credit History */}
                    <div className="space-y-4">
                      <h3 className="text-gray-900 dark:text-[#EAEAEA] text-lg font-semibold">Credit History</h3>
                      <div className="space-y-2">
                        {[
                          { date: "Dec 1, 2024", action: "Monthly Refill", amount: 1000, type: "add" },
                          { date: "Nov 29, 2024", action: "Message Sent", amount: 1, type: "subtract" },
                          { date: "Nov 28, 2024", action: "Purchased Pro Pack", amount: 5000, type: "add" },
                        ].map((transaction, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-lg"
                          >
                            <div>
                              <div className="text-gray-900 dark:text-[#EAEAEA] text-sm">{transaction.action}</div>
                              <div className="text-gray-600 dark:text-[#A0A0A0] text-xs">{transaction.date}</div>
                            </div>
                            <div
                              className={`font-semibold ${
                                transaction.type === "add" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {transaction.type === "add" ? "+" : "-"}
                              {transaction.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reset Credits (Admin/Demo) */}
                    <div className="p-4 bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-[12px]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-gray-900 dark:text-[#EAEAEA] mb-1">Reset Credits</div>
                          <div className="text-gray-600 dark:text-[#A0A0A0] text-sm">Reset to default 1000 credits (Demo only)</div>
                        </div>
                        <Button
                          onClick={handleResetCredits}
                          className="bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#1E1E1E] text-gray-900 dark:text-[#EAEAEA]"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "account" && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <h2 className="text-gray-900 dark:text-[#EAEAEA] mb-6">Account</h2>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-[12px]">
                        <h3 className="text-gray-900 dark:text-[#EAEAEA] mb-4">Account Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-gray-600 dark:text-[#A0A0A0]">Email</label>
                            <Input 
                              defaultValue={user?.email || ''}
                              className="bg-white dark:bg-[#121212] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-gray-600 dark:text-[#A0A0A0]">Name</label>
                            <Input 
                              defaultValue={user?.user_metadata?.name || user?.email?.split('@')[0] || ''}
                              onBlur={(e) => saveProfile({ name: e.target.value })}
                              className="bg-white dark:bg-[#121212] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] mt-1"
                            />
                          </div>
                        </div>
                        <Button onClick={() => saveProfile({})} className="mt-4 bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white">Save Changes</Button>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-[12px]">
                        <h3 className="text-gray-900 dark:text-[#EAEAEA] mb-2">Subscription</h3>
                        <p className="text-gray-600 dark:text-[#A0A0A0] mb-1">Current Plan: Free</p>
                        <p className="text-gray-600 dark:text-[#A0A0A0] mb-3">{memberSinceText}</p>
                        <Button 
                          className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white"
                          onClick={() => {
                            window.location.href = '/pricing';
                          }}
                        >
                          Upgrade Plan
                        </Button>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-[#181818] border border-red-300 dark:border-red-900/50 rounded-[12px]">
                        <h3 className="text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-gray-600 dark:text-[#A0A0A0] mb-3">Permanently delete your account</p>
                        <Button 
                          className="bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-900"
                          onClick={() => setConfirmDeleteOpen(true)}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Payment Modal */}
      <PaymentModal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} />
      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal 
        open={confirmDeleteOpen} 
        onClose={() => setConfirmDeleteOpen(false)} 
        onConfirm={() => { window.location.href = '/account/delete-feedback'; }}
      />
    </Dialog>
  );
}
