import React from "react";
import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, ArrowUp, Loader2, X } from "lucide-react";
import { MessageCard } from "./MessageCard";
import { ScrollArea } from "./ui/scroll-area";
import { supabase } from "../lib/supabase/client";

interface ChatAreaProps {
  chatId: string;
  teacherId?: string;
  onReset?: () => void;
  onChatIdUpdate?: (newChatId: string) => void;
}

type Attachment = {
  id: string;
  url: string;
  filename: string;
  file_type: string;
  file_size: number;
};

type ChatMessage = { 
  type: "user" | "ai"; 
  content: string;
  attachments?: Attachment[];
};

/**
 * Safe normalizer — only converts explicit \( ... \) and \[ ... \] math delimiters to $...$ / $$...$$
 * IMPORTANT: DO NOT globally replace backslashes or remove them. This preserves matrix \\\\ sequences intact.
 */
function normalizeMathSyntax(text: string): string {
  if (!text) return text;
  
  // Convert \( ... \) => $...$
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, p1) => `$${p1}$`);
  
  // Convert \[ ... \] => $$...$$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, p1) => `$$${p1}$$`);
  
  // Important: DO NOT globally replace backslashes or remove them.
  return text;
}

export function ChatArea({ chatId, teacherId, onReset, onChatIdUpdate }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [userName, setUserName] = useState("Chief"); // Default name
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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
    
    // DEV-only: Expose test matrix message function to window for easy testing
    if (process.env.NODE_ENV !== "production") {
      (window as any).testMatrixMessage = () => {
        const testContent = `$$\n\\begin{bmatrix} 1 & 2 & 3 \\\\ 4 & 5 & 6 \\\\ 7 & 8 & 9 \\end{bmatrix}\n$$`;
        setInputValue(testContent);
        console.log("[DEV] Test matrix message loaded into input. Click send to test.");
      };
      console.log("[DEV] Test matrix message function available: window.testMatrixMessage()");
    }
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
      if (process.env.NODE_ENV !== "production") {
        delete (window as any).testMatrixMessage;
      }
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
        
        // DEV-only: log raw strings for the last messages
        if (process.env.NODE_ENV !== "production") {
          console.log("[DEV] RAW MESSAGES FROM API:", data.messages?.slice(-3).map((m: any) => ({ 
            id: m.id, 
            contentPreview: m.content?.slice(0, 400) || '' 
          })));
        }
        
        if (res.ok && Array.isArray(data.messages)) {
          // Normalize math syntax for all loaded messages (both AI and user)
          const normalizedMessages = data.messages.map((msg: any) => ({
            ...msg,
            content: normalizeMathSyntax(msg.content || ''),
            attachments: msg.attachments || []
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
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading || isUploading) return;
    
    const userMessage = inputValue.trim();
    const filesToSend = [...attachedFiles];
    
    // Create optimistic message with attachments
    const optimisticMessage: ChatMessage = {
      type: "user",
      content: userMessage || filesToSend.map(f => f.filename).join(', '),
      attachments: filesToSend
    };
    
    const optimisticMessages = [...messages, optimisticMessage];
    setMessages(optimisticMessages);
    setInputValue("");
    setAttachedFiles([]);
    setIsLoading(true);

    // Add AI message placeholder for streaming
    setMessages([...optimisticMessages, { type: "ai", content: "" }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Wait briefly for file processing (non-blocking, max 2 seconds)
      if (filesToSend.length > 0) {
        await waitForFileProcessing(filesToSend.map(f => f.id), 2000);
      }
      
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          chatId, 
          content: userMessage || (filesToSend.length > 0 ? `Please analyze these files: ${filesToSend.map(f => f.filename).join(', ')}` : ''),
          teacherId: teacherId,
          attachmentIds: filesToSend.map(f => f.id)
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
    
    setIsUploading(true);
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
      
      if (res.ok) {
        // Update chatId if server returned a new UUID (for new chats)
        if (data.chatId && data.chatId !== chatId && onChatIdUpdate) {
          onChatIdUpdate(data.chatId);
        }
        
        // Add file to attached files list
        const attachment: Attachment = {
          id: data.id,
          url: data.url,
          filename: data.filename,
          file_type: data.mime,
          file_size: data.size
        };
        setAttachedFiles([...attachedFiles, attachment]);
        
        // Trigger file processing in background
        fetch('/api/files/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ attachmentId: data.id })
        }).catch(err => console.error('Error processing file:', err));
      } else {
        console.error('File upload error:', data.error);
      }
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
      // Use ref instead of event target to avoid null reference errors
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  // Wait for file processing to complete before sending
  const waitForFileProcessing = async (attachmentIds: string[], maxWait = 3000) => {
    if (attachmentIds.length === 0) return;
    
    const startTime = Date.now();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    while (Date.now() - startTime < maxWait) {
      // Check if files are processed
      const { data: attachments, error } = await supabase
        .from('attachments')
        .select('id, extracted_text')
        .in('id', attachmentIds);
      
      if (!error && attachments && Array.isArray(attachments)) {
        const allProcessed = attachments.every((att: any) => 
          att.extracted_text && 
          typeof att.extracted_text === 'string' &&
          att.extracted_text.trim() && 
          !att.extracted_text.includes('[File processing failed:')
        );
        
        if (allProcessed) break;
      }
      
      // Wait 200ms before checking again
      await new Promise(resolve => setTimeout(resolve, 200));
    }
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
              window.location.href = '/pricing';
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
              <MessageCard 
                key={index} 
                type={message.type} 
                content={message.content} 
                images={(message as any).images || []}
                attachments={message.attachments || []}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--card-border)] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Attached Files Display */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-3 py-2"
                >
                  {file.file_type.startsWith('image/') ? (
                    <img 
                      src={file.url} 
                      alt={file.filename}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <Paperclip className="w-4 h-4 text-[var(--text-secondary)]" />
                  )}
                  <span className="text-sm text-[var(--text-primary)] max-w-[200px] truncate">
                    {file.filename}
                  </span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="ml-1 hover:bg-[var(--card-border)] rounded p-1 transition-colors"
                    type="button"
                  >
                    <X className="w-3 h-3 text-[var(--text-secondary)]" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 text-muted-foreground hover:text-primary focus:outline-none rounded-full hover:bg-[var(--card-border)] active:bg-[var(--card-border)] focus:bg-[var(--card-border)] transition-colors disabled:opacity-50"
              aria-label="Attach file"
              onClick={handleAttachClick}
              disabled={isLoading || isUploading}
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
                disabled={isUploading}
              />
              <textarea
                placeholder="Ask anything …"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isUploading) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isLoading || isUploading}
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
                disabled={(!inputValue.trim() && attachedFiles.length === 0) || isLoading || isUploading}
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
