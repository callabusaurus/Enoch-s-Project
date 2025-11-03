import { Star, FileText, Image, Code, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase/client";

interface LibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

type Item = { id: string; title: string; type: "text"|"image"|"code"; date: string; isFavorite?: boolean };

export function LibraryDialog({ open, onClose, onSelectChat }: LibraryDialogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Item[]>([]);

  // Load all items when dialog opens
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      return;
    }
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
        if (res.ok) setItems(data);
      } catch {}
    })();
  }, [open]);

  // Search functionality
  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!open) return;
      if (!searchQuery.trim()) { 
        setSearchResults([]); 
        return; 
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch(`/api/library/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (active && Array.isArray(data)) {
          // Map search results to match Item type format
          setSearchResults(data.map((d: any) => ({
            id: d.id,
            title: d.title,
            type: d.type || "text",
            date: d.date || new Date(d.created).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            isFavorite: d.isFavorite
          })));
        }
      } catch {
        if (active) setSearchResults([]);
      }
    };
    run();
    return () => { active = false; };
  }, [open, searchQuery]);

  const toggleFavorite = async (id: string, favorite: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await fetch('/api/library/favorite', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ chatId: id, favorite }),
      });
      setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: favorite } : i));
      setSearchResults(prev => prev.map(i => i.id === id ? { ...i, isFavorite: favorite } : i));
    } catch {}
  };

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    onClose();
  };

  // Use search results if searching, otherwise use regular items
  const displayItems = searchQuery.trim() ? searchResults : items;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl !bg-white dark:!bg-[#121212] border border-gray-200 dark:border-[#2A2A2A] p-0 rounded-[12px] opacity-100">
        <DialogTitle className="sr-only">Library</DialogTitle>
        <DialogDescription className="sr-only">
          Your saved items and favorites
        </DialogDescription>

        <div className="p-6">
          <h2 className="text-gray-900 dark:text-[#EAEAEA] mb-6">Library</h2>

          {/* Search Bar - positioned between title and tabs */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#A0A0A0]" />
            <Input
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] pl-10 w-full"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-gray-100 dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] mb-4">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#5A5BEF] data-[state=active]:text-white">All Items</TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-[#5A5BEF] data-[state=active]:text-white">Favorites</TabsTrigger>
              <TabsTrigger value="recent" className="data-[state=active]:bg-[#5A5BEF] data-[state=active]:text-white">Recent</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[400px]">
                {displayItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {displayItems.map((item) => {
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectChat(item.id)}
                          className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-lg p-4 hover:border-[#5A5BEF] transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-[#5A5BEF] flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h3 className="text-gray-900 dark:text-[#EAEAEA] mb-1">{item.title}</h3>
                              <div className="text-gray-600 dark:text-[#A0A0A0]">{item.date}</div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id, !item.isFavorite);
                              }} 
                              className="text-gray-600 dark:text-[#A0A0A0] hover:text-[#5A5BEF]"
                            >
                              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-[#5A5BEF] text-[#5A5BEF]' : ''}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 dark:text-[#A0A0A0] py-8">
                    {searchQuery.trim() ? 'No results found' : 'No items yet'}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="favorites">
              <ScrollArea className="h-[400px]">
                {displayItems.filter(item => item.isFavorite).length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {displayItems.filter(item => item.isFavorite).map((item) => {
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectChat(item.id)}
                          className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-lg p-4 hover:border-[#5A5BEF] transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-[#5A5BEF] flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <h3 className="text-gray-900 dark:text-[#EAEAEA] mb-1">{item.title}</h3>
                              <div className="text-gray-600 dark:text-[#A0A0A0]">{item.date}</div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(item.id, !item.isFavorite);
                              }} 
                              className="text-gray-600 dark:text-[#A0A0A0] hover:text-[#5A5BEF]"
                            >
                              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-[#5A5BEF] text-[#5A5BEF]' : ''}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 dark:text-[#A0A0A0] py-8">
                    No favorites yet
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="recent">
              <ScrollArea className="h-[400px]">
                {displayItems.slice(0, 3).length > 0 ? (
                  <div className="space-y-2">
                    {displayItems.slice(0, 3).map((item) => {
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectChat(item.id)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E1E1E] cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-[#5A5BEF]" />
                          <div className="flex-1">
                            <div className="text-gray-900 dark:text-[#EAEAEA]">{item.title}</div>
                            <div className="text-gray-600 dark:text-[#A0A0A0]">{item.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 dark:text-[#A0A0A0] py-8">
                    No recent items
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
