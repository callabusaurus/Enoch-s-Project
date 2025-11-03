import { X, ExternalLink } from "lucide-react";
import { useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { ScrollArea } from "./ui/scroll-area";

interface Citation {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

interface SourceSidebarProps {
  open: boolean;
  onClose: (open: boolean) => void;
  citations: Citation[];
}

// Get favicon URL for a domain
function getFaviconUrl(domain: string): string {
  // Use Google's favicon service as fallback
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export function SourceSidebar({ open, onClose, citations = [] }: SourceSidebarProps) {
  const prevOpenRef = useRef(open);
  const ignoreCloseRef = useRef(false);
  
  // Track state changes
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // We're opening - ignore close events for a brief moment
      ignoreCloseRef.current = true;
      setTimeout(() => {
        ignoreCloseRef.current = false;
      }, 300);
    }
    prevOpenRef.current = open;
  }, [open]);
  
  console.log('SourceSidebar render - open:', open, 'citations count:', citations?.length);
  
  const handleOpenChange = (isOpen: boolean) => {
    console.log('Sheet onOpenChange - isOpen:', isOpen, 'ignoreClose:', ignoreCloseRef.current, 'prevOpen:', prevOpenRef.current, 'current open:', open);
    
    // If we're trying to open (open prop is true) but Radix wants to close immediately, ignore it
    // This happens when opening triggers an unwanted close event from Radix
    if (!isOpen && ignoreCloseRef.current && open) {
      console.log('Ignoring premature close during initial opening');
      return;
    }
    
    // Otherwise, sync the state
    onClose(isOpen);
  };
  
  return (
    <Sheet 
      open={open} 
      onOpenChange={handleOpenChange}
      modal={true}
    >
      <SheetContent 
        side="right" 
        className="!w-full sm:!w-[420px] !max-w-[420px] p-0 !bg-white dark:!bg-[#1E1E1E] overflow-hidden"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3A]">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold text-[var(--text-primary)]">
                Sources
              </SheetTitle>
            </div>
            <SheetDescription className="text-sm text-[var(--text-secondary)] mt-1">
              {citations?.length || 0} {(citations?.length || 0) === 1 ? 'source' : 'sources'}
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable content */}
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-3">
              {(!citations || citations.length === 0) ? (
                <div className="text-sm text-[var(--text-secondary)] text-center py-8">
                  No sources available
                </div>
              ) : (
                citations.map((citation, index) => (
                <a
                  key={index}
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3 rounded-lg border border-gray-200 dark:border-[#3A3A3A] hover:border-[#5A5BEF] hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Favicon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <img
                        src={getFaviconUrl(citation.domain)}
                        alt={`${citation.domain} favicon`}
                        className="w-5 h-5 rounded"
                        onError={(e) => {
                          // Fallback to a default icon if favicon fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Domain name */}
                      <div className="text-xs font-medium text-[#5A5BEF] mb-1 truncate">
                        {citation.domain}
                      </div>

                      {/* Title */}
                      <div className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 line-clamp-2 group-hover:text-[#5A5BEF] transition-colors">
                        {citation.title}
                      </div>

                      {/* Snippet */}
                      {citation.snippet && (
                        <div className="text-xs text-[var(--text-secondary)] line-clamp-2">
                          {citation.snippet}
                        </div>
                      )}

                      {/* URL preview */}
                      <div className="text-xs text-[var(--text-secondary)] mt-1.5 truncate flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{citation.url}</span>
                      </div>
                    </div>
                  </div>
                </a>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

