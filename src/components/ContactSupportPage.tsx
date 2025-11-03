export function ContactSupportPage() {
  const handleBackClick = () => {
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
            <span className="text-sm font-medium">← Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Contact Support</h1>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-6 text-[var(--text-primary)]">
              <div className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                <p className="mb-4">
                  Hey guys,
                </p>
                <p className="mb-4">
                  If you require any assistance in operating our application, need to report anything, or give us your advice on anything,
                </p>
                <p className="mb-4">
                  Kindly reach out to either,
                </p>
                <div className="space-y-2 mb-4">
                  <p>
                    <a href="mailto:karol@decivise.com" className="text-[#5A5BEF] hover:underline">karol@decivise.com</a>
                  </p>
                  <p>
                    <a href="mailto:danesh@decivise.com" className="text-[#5A5BEF] hover:underline">danesh@decivise.com</a>
                  </p>
                </div>
                <p className="mb-4">
                  PS- You can also reach out to <a href="mailto:karolsujith1@gmail.com" className="text-[#5A5BEF] hover:underline">karolsujith1@gmail.com</a> or just add it as a cc.
                </p>
                <p className="mb-4">
                  Hope y'all like our stuff.
                </p>
                <p>
                  Cheers.
                </p>
                <p className="mt-4">
                  <strong className="text-[var(--text-primary)]">Karol and Dan</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

