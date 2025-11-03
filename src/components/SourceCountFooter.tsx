interface Citation {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

interface SourceCountFooterProps {
  citations?: Citation[];
  onClick?: () => void;
}

export function SourceCountFooter({ citations, onClick }: SourceCountFooterProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  const sourceCount = citations.length;

  return (
    <div className="px-6 py-2.5 border-t border-[var(--card-border)] bg-white dark:bg-[#1E1E1E]">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }}
        className="w-full flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[#5A5BEF] transition-colors cursor-pointer group"
      >
        <span className="font-medium">{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
        <svg
          className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

