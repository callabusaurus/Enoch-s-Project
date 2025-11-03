import { useEffect, useState } from "react";
import { Search, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";

interface SearchChatsDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

type SearchItem = { id: string; title: string; date?: string };

export function SearchChatsDialog({ open, onClose, onSelectChat }: SearchChatsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!open) return;
      if (!searchQuery.trim()) { setResults([]); return; }
      try {
        const res = await fetch(`/api/library/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (active && Array.isArray(data)) {
          setResults(data.map((d: any) => ({ id: d.id, title: d.title, date: d.date })));
        }
      } catch {
        if (active) setResults([]);
      }
    };
    run();
    return () => { active = false; };
  }, [open, searchQuery]);

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#121212] border border-[#2A2A2A] p-0 rounded-[12px]">
        <DialogTitle className="sr-only">Search Chats</DialogTitle>
        <DialogDescription className="sr-only">
          Search through your chat history
        </DialogDescription>
        
        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A0A0A0]" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#181818] border-[#2A2A2A] text-[#EAEAEA] pl-10"
              autoFocus
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {results.length > 0 ? (
                results.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#1E1E1E] transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-[#A0A0A0] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-[#EAEAEA]">{chat.title}</div>
                      <div className="text-[#A0A0A0]">{chat.date || ''}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-[#A0A0A0] py-8">
                  No chats found
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
