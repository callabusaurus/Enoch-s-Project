import { FileText, ArrowLeft } from "lucide-react";

const legalPolicies = [
  { title: "Refund and Cancellation Policy", description: "Rules for refunds and cancellations", slug: "refund-and-cancellation" },
  { title: "Cookie Policy", description: "How we use website cookies", slug: "cookie-policy" },
  { title: "User Conduct and Content Policy", description: "Guidelines for user behavior online", slug: "user-conduct" },
  { title: "DMCA and Content Takedown Policy", description: "Process for copyright content removal", slug: "dmca-takedown" },
  { title: "Liability Disclaimer", description: "Limits of our legal responsibility", slug: "liability-disclaimer" },
];

export function LegalPageContent() {
  const handlePolicyClick = (slug: string) => {
    // Navigate to the specific policy page
    window.location.href = `/legal/${slug}`;
  };

  const handleBackClick = () => {
    // Navigate back to main dashboard (root)
    window.location.href = '/';
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
            <span className="text-sm font-medium">Back to Help</span>
          </button>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Legal Policies</h1>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-3">
            {legalPolicies.map((policy, index) => (
              <button
                key={index}
                onClick={() => handlePolicyClick(policy.slug)}
                className="w-full text-left p-4 bg-[var(--card-bg)] dark:bg-[#181818] border border-[var(--card-border)] dark:border-[#2A2A2A] rounded-lg hover:border-[#5A5BEF] hover:bg-[var(--hover-bg)] dark:hover:bg-[#1E1E1E] transition-colors shadow-sm dark:shadow-none"
              >
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#5A5BEF] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-[var(--text-primary)] dark:text-[#EAEAEA] mb-1 font-medium">{policy.title}</h3>
                    <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] text-sm">{policy.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

