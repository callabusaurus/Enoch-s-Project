import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface Citation {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

interface InlineCitationBadgeProps {
  sourceNumber: number;
  citations: Citation[];
  sameDomainCount?: number; // Number of citations from same domain in current group
  onHover?: (citation: Citation) => void;
}

export function InlineCitationBadge({ sourceNumber, citations, sameDomainCount, onHover }: InlineCitationBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Find the citation for this source number (Source1 = index 0, Source2 = index 1, etc.)
  const citation = citations[sourceNumber - 1];
  
  if (!citation) {
    // If citation not found, just show the number
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-[#3A3A3A] text-gray-700 dark:text-gray-300">
        {sourceNumber}
      </span>
    );
  }

  // Use sameDomainCount if provided, otherwise count all citations from this domain
  const domainCount = sameDomainCount !== undefined ? sameDomainCount : citations.filter(c => c.domain === citation.domain).length;
  const showCount = domainCount > 1;

  return (
    <span className="relative inline-block">
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 dark:bg-[#3A3A3A] text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-[#4A4A4A] transition-colors cursor-pointer"
        onMouseEnter={() => {
          setIsHovered(true);
          if (onHover) onHover(citation);
        }}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <span>{citation.domain}</span>
        {showCount && (
          <span className="opacity-75">+{domainCount - 1}</span>
        )}
      </a>
      
      {/* Tooltip on hover */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2 bg-gray-900 dark:bg-[#1A1A1A] text-white text-xs rounded-lg shadow-lg border border-gray-700 dark:border-[#3A3A3A]">
          <div className="font-semibold mb-1 truncate">{citation.title}</div>
          <div className="text-gray-400 truncate">{citation.url}</div>
          {citation.snippet && (
            <div className="mt-1 text-gray-300 line-clamp-2">{citation.snippet}</div>
          )}
          <div className="mt-2 flex items-center gap-1 text-[#5A5BEF]">
            <ExternalLink className="w-3 h-3" />
            <span>Click to open</span>
          </div>
        </div>
      )}
    </span>
  );
}

