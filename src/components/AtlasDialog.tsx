import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { supabase } from "../lib/supabase/client";

type Result = { title: string; link: string; snippet?: string; image?: string };

interface AtlasDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AtlasDialog({ open, onClose }: AtlasDialogProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<'web' | 'images'>('web');

  const search = async () => {
    setError(null);
    setResults([]);
    if (!q.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/atlas/search', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ query: q, searchType }) 
      });
      const data = await res.json();
      if (res.status === 403) { setError('Atlas is available for premium users only.'); return; }
      if (res.ok && Array.isArray(data.results)) setResults(data.results);
      else setError(data.error || 'Search failed');
    } catch {
      setError('Search failed');
    }
  };

  useEffect(() => { if (!open) { setQ(""); setResults([]); setError(null); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#121212] border border-[#2A2A2A] p-0 rounded-[12px]">
        <DialogTitle className="sr-only">Atlas</DialogTitle>
        <DialogDescription className="sr-only">Web Search</DialogDescription>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder={searchType === 'images' ? "Search images..." : "Search the web..."} className="bg-[#181818] border-[#2A2A2A] text-[#EAEAEA]" onKeyDown={(e) => { if (e.key === 'Enter') search(); }} />
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value as 'web' | 'images')}
              className="bg-[#181818] border border-[#2A2A2A] text-[#EAEAEA] px-3 rounded-[12px] focus:outline-none focus:border-[#5A5BEF] cursor-pointer"
            >
              <option value="web">Web</option>
              <option value="images">Images</option>
            </select>
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className={`max-h-[420px] overflow-auto pr-1 ${searchType === 'images' ? 'grid grid-cols-2 md:grid-cols-3 gap-3' : 'space-y-3'}`}>
            {results.map((r, i) => (
              searchType === 'images' && r.image ? (
                <a 
                  key={i} 
                  href={r.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block bg-[#181818] border border-[#2A2A2A] rounded-[12px] hover:border-[#5A5BEF] overflow-hidden group"
                >
                  <div className="aspect-square relative overflow-hidden bg-[#1a1a1a]">
                    <img 
                      src={r.image} 
                      alt={r.title || 'Image result'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-full text-[#A0A0A0] text-xs">Image unavailable</div>';
                        }
                      }}
                    />
                  </div>
                  <div className="p-2">
                    <div className="text-[#EAEAEA] text-xs font-medium truncate" title={r.title}>{r.title}</div>
                    <div className="text-[#5A5BEF] text-xs truncate">{r.link}</div>
                  </div>
                </a>
              ) : (
                <a key={i} href={r.link} target="_blank" rel="noreferrer" className="block p-3 bg-[#181818] border border-[#2A2A2A] rounded-[12px] hover:border-[#5A5BEF]">
                  <div className="text-[#EAEAEA] font-medium">{r.title}</div>
                  <div className="text-[#5A5BEF] text-xs break-all">{r.link}</div>
                  {r.snippet && <div className="text-[#A0A0A0] mt-1 text-sm">{r.snippet}</div>}
                  {r.image && (
                    <div className="mt-2">
                      <img 
                        src={r.image} 
                        alt={r.title || 'Search result image'}
                        className="max-w-full h-auto rounded-lg max-h-48 object-cover border border-[#2A2A2A]"
                        onError={(e) => {
                          // Hide image if it fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </a>
              )
            ))}
            {!results.length && !error && <div className="text-[#A0A0A0]">Type a query and press Enter</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



