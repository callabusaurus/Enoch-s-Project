export function CookiePolicyPage() {
  const handleBackClick = () => {
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
            <span className="text-sm font-medium">← Back to Legal</span>
          </button>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Cookie Policy</h1>
          <p className="text-sm text-[var(--text-secondary)] dark:text-[#A0A0A0] mt-2">Last Updated: 02/11/2025</p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-6 text-[var(--text-primary)]">
              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">1. Introduction</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  This Cookie Policy ("Policy") explains how Kaipullha Techlabs Private Limited ("Company", "we", "our", "us") uses cookies and similar technologies on Petros ("Platform"). By continuing to browse or use the Platform, you consent to the use of cookies in accordance with this Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">2. What Are Cookies</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  Cookies are small text files placed on your device when you visit our Platform. They help us recognize your device, improve platform performance, personalize your experience, and analyze usage trends.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">3. Types of Cookies Used</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  We use the following types of cookies:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed"><strong className="text-[var(--text-primary)]">Essential Cookies:</strong> Required for core functionality, such as authentication, session management, and security. These cannot be disabled.</li>
                  <li className="leading-relaxed"><strong className="text-[var(--text-primary)]">Analytical Cookies:</strong> Help us understand how users interact with the Platform to improve performance and user experience.</li>
                  <li className="leading-relaxed"><strong className="text-[var(--text-primary)]">Functional Cookies:</strong> Remember user preferences, such as language settings and UI configurations.</li>
                  <li className="leading-relaxed"><strong className="text-[var(--text-primary)]">Marketing Cookies (if enabled):</strong> Used to deliver relevant promotional content and measure campaign effectiveness.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">4. Third-Party Cookies</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  Certain cookies may be set by third-party service providers (e.g., analytics, payment processors, or cloud hosting providers). These third parties may collect data under their own privacy policies. We do not control or assume liability for their cookie practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">5. Managing Cookies</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  You can manage or delete cookies at any time through your browser settings. Please note that disabling essential cookies may limit or impair your access to certain features of the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">6. Data Collected Through Cookies</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  Cookies may collect non-personal information, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">Browser type and version</li>
                  <li className="leading-relaxed">Device identifiers</li>
                  <li className="leading-relaxed">IP address (masked/anonymized)</li>
                  <li className="leading-relaxed">Session duration and clickstream data</li>
                </ul>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mt-3">
                  This information is processed to enhance service reliability, security, and analytics.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">7. Data Retention</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  Cookie data is retained for as long as necessary to fulfill its intended purpose. Session cookies expire when you close your browser, while persistent cookies remain until manually deleted or auto-expired.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">8. Consent</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  By using the Platform, you consent to the use of cookies as described in this Policy. Upon your first visit, you may encounter a cookie banner allowing you to adjust or withdraw consent for non-essential cookies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">9. Updates to This Policy</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  We may modify this Policy periodically to align with regulatory or operational requirements. The latest version will always be available on the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">10. Contact Information</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-2">
                  For questions or concerns about this Cookie Policy:
                </p>
                <div className="text-[var(--text-secondary)] dark:text-[#A0A0A0] space-y-1">
                  <p><strong className="text-[var(--text-primary)]">Kaipullha Techlabs Private Limited</strong></p>
                  <p>Email: <a href="mailto:danesh@decivise.com" className="text-[#5A5BEF] hover:underline">danesh@decivise.com</a></p>
                  <p>Jurisdiction: Chennai, Tamil Nadu, India</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">11. Governing Law</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  This Policy shall be governed by the laws of India, and any disputes shall fall under the exclusive jurisdiction of the courts in Chennai, Tamil Nadu.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

