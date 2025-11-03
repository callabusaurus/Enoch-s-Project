import React from "react";
import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, ArrowUp, Loader2 } from "lucide-react";
import { MessageCard } from "./MessageCard";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "../lib/supabase/client";

interface ChatAreaProps {
  chatId: string;
  teacherId?: string;
  onReset?: () => void;
  onChatIdUpdate?: (newChatId: string) => void;
}

type ChatMessage = { type: "user" | "ai"; content: string };

/**
 * Normalize math syntax - clean up escaped backslashes and convert LaTeX delimiters
 * This ensures AI-generated math expressions render correctly in KaTeX
 */
function normalizeMathSyntax(text: string): string {
  if (!text) return text;
  
  return text
    // Replace escaped backslashes like \\sin -> \sin
    .replace(/\\\\/g, "\\")
    // Convert \(...\) to $...$ (inline math)
    .replace(/\\\((.*?)\\\)/gs, '$$$1$')
    // Convert \[...\] to $$...$$ (block math)
    .replace(/\\\[(.*?)\\\]/gs, '$$$1$$')
    // Remove trailing " \ " artifacts that break KaTeX
    .replace(/\\\s/g, '');
}

export function ChatArea({ chatId, teacherId, onReset, onChatIdUpdate }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userName, setUserName] = useState("Chief"); // Default name
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user settings (call_me_by) on mount and when settings are updated
  const loadUserName = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // If not JSON, log and keep default
        const text = await res.text();
        console.error('Non-JSON response from server when loading user profile:', text);
        return;
      }
      
      const data = await res.json();
      if (res.ok && data.call_me_by) {
        setUserName(data.call_me_by);
      }
    } catch (error) {
      console.error('Error loading user name:', error);
      // Keep default "Chief" on error
    }
  };

  useEffect(() => {
    loadUserName();
    
    // Listen for settings updates
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail?.call_me_by) {
        setUserName(event.detail.call_me_by);
      } else {
        // Reload full settings if call_me_by not in update
        loadUserName();
      }
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        const res = await fetch(`/api/chat/history?chatId=${encodeURIComponent(chatId)}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Check if response is JSON before parsing
        const contentType = res.headers.get('content-type');
        let data;
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          // If not JSON, log error and set empty messages
          const text = await res.text();
          console.error('Non-JSON response from server when loading chat history:', text);
          setMessages([]);
          return;
        }
        
        if (res.ok && Array.isArray(data.messages)) {
          // Normalize math syntax for all loaded messages (both AI and user)
          const normalizedMessages = data.messages.map((msg: ChatMessage) => ({
            ...msg,
            content: normalizeMathSyntax(msg.content)
          }));
          setMessages(normalizedMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([]);
      }
    };
    load();
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    const optimisticMessages = [...messages, { type: "user" as const, content: userMessage }];
    setMessages(optimisticMessages);
    setInputValue("");
    setIsLoading(true);

    // Add AI message placeholder for streaming
    setMessages([...optimisticMessages, { type: "ai", content: "" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          chatId, 
          content: userMessage,
          teacherId: teacherId
        }),
      });

      if (!res.ok) {
        // Handle non-streaming errors (like 401, 402, etc.)
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        console.error('Chat send error:', errorData);
        setMessages(optimisticMessages);
        setIsLoading(false);
        return;
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let newChatId = chatId;

      if (!reader) {
        console.error('No response body');
        setMessages(optimisticMessages);
        setIsLoading(false);
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6); // Remove 'data: ' prefix
                const data = JSON.parse(jsonStr);

                // Handle error
                if (data.error) {
                  console.error('Stream error:', data.error);
                  setMessages(optimisticMessages);
                  setIsLoading(false);
                  return;
                }

                // Handle content chunk
                if (data.content) {
                  accumulatedContent += data.content;
                  // Normalize math syntax before updating the message
                  const normalizedContent = normalizeMathSyntax(accumulatedContent);
                  // Update the last AI message with accumulated content
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].type === 'ai') {
                      newMsgs[newMsgs.length - 1] = { 
                        type: 'ai', 
                        content: normalizedContent
                      };
                    }
                    return newMsgs;
                  });
                }

                // Handle completion
                if (data.done) {
                  if (data.chatId && chatId === 'new-chat' && data.chatId !== chatId && onChatIdUpdate) {
                    newChatId = data.chatId;
                    onChatIdUpdate(data.chatId);
                  }
                  setIsLoading(false);
                }
              } catch (e) {
                console.error('Error parsing SSE chunk:', e);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        setMessages(optimisticMessages);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Chat send failed:', error);
      setMessages(optimisticMessages);
      setIsLoading(false);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('chatId', chatId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
      const data = await res.json();
      // Update chatId if server returned a new UUID (for new chats)
      if (data.chatId && data.chatId !== chatId && onChatIdUpdate) {
        onChatIdUpdate(data.chatId);
      }
    } catch {}
    e.currentTarget.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--app-bg)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-6 py-4 relative flex items-center">
        <h2 className="text-[var(--text-primary)]">Petros</h2>
        
        {/* Upgrade to Pro Button - Centered */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <button
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[var(--card-bg)] dark:bg-[#2A2A2A] hover:bg-[var(--hover-bg)] dark:hover:bg-[#333333] border border-[var(--card-border)] dark:border-transparent transition-colors"
            onClick={() => {
              // Optional: Add upgrade modal trigger here
              console.log('Upgrade to Pro clicked');
            }}
          >
            <div className="w-3 h-3 rotate-45 bg-[#5A5BEF] rounded-sm flex items-center justify-center">
              <ArrowUp className="w-2 h-2 text-white rotate-[-45deg]" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)] dark:text-[var(--text-secondary)]">Upgrade to Pro</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6">
            <h2 className="text-[var(--text-primary)] mb-4">Hi, I'm your Private Tutor</h2>
            <h1 className="text-[var(--text-primary)] mb-8">How can I help, {userName}?</h1>
          </div>
        ) : (
          <div className="w-full">
            {messages.map((message, index) => (
              <MessageCard key={index} type={message.type} content={message.content} images={(message as any).images || []} />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--card-border)] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-primary focus:outline-none rounded-full hover:bg-[var(--card-border)] active:bg-[var(--card-border)] focus:bg-[var(--card-border)] transition-colors"
              aria-label="Attach file"
              onClick={handleAttachClick}
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="relative flex-1">
              <input 
                ref={fileInputRef} 
                type="file" 
                onChange={handleFileChange} 
                className="hidden"
                style={{ display: 'none' }}
                aria-hidden="true"
              />
              <textarea
                placeholder="Ask anything …"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading}
                rows={1}
                className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[12px] px-4 py-3 pr-12 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#5A5BEF] transition-colors resize-none overflow-hidden min-h-[48px] max-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#5A5BEF] hover:bg-[#4A4BDF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
