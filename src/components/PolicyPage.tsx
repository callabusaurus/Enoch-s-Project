import { ArrowLeft } from "lucide-react";

interface PolicyPageProps {
  title: string;
  slug: string;
}

export function PolicyPage({ title, slug }: PolicyPageProps) {
  const handleBackClick = () => {
    // Navigate back to legal policies list
    window.location.href = '/legal';
  };

  return (
    <div className="h-screen bg-[var(--app-bg)] flex flex-col overflow-hidden">
      {/* Header with Back Button - Fixed */}
      <div className="border-b border-[var(--card-border)] bg-[var(--card-bg)] flex-shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[#5A5BEF] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Legal Policies</span>
          </button>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">{title}</h1>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="prose prose-invert max-w-none">
            <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] text-lg">
              Content coming soon for this policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

