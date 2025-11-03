export function UserConductPolicyPage() {
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
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">User Conduct & Content Policy</h1>
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
                  This User Conduct & Content Policy ("Policy") governs user behavior on Petros ("Platform"), operated by Kaipullha Techlabs Private Limited ("Company", "we", "our", "us"). By using the Platform, you agree to comply with this Policy, the Terms & Conditions, and applicable laws of India.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">2. Acceptable Use</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  Users must use the Platform solely for lawful, educational, and ethical purposes. Acceptable usage includes:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">Accessing AI tutoring services for learning and self-improvement.</li>
                  <li className="leading-relaxed">Respecting other users and the Platform's community guidelines.</li>
                  <li className="leading-relaxed">Providing accurate registration information.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">3. Prohibited Conduct</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  You must not, under any circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">Attempt to disable, override, or manipulate safety systems (including NSFW or content filters).</li>
                  <li className="leading-relaxed">Upload, transmit, or generate content that is defamatory, obscene, sexually explicit, hateful, or illegal.</li>
                  <li className="leading-relaxed">Engage in or promote cheating, plagiarism, academic dishonesty, or misinformation.</li>
                  <li className="leading-relaxed">Reverse-engineer, duplicate, or resell the Platform's software or AI models.</li>
                  <li className="leading-relaxed">Use the Platform to harass, threaten, or impersonate any individual or organization.</li>
                  <li className="leading-relaxed">Deploy automated systems or bots to abuse the Platform's resources.</li>
                  <li className="leading-relaxed">Violate any applicable law, regulation, or third-party right, including intellectual property rights.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">4. User-Generated Content (UGC)</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  Users may input text or data during their learning sessions. By submitting content, you grant the Company a non-exclusive, royalty-free, and revocable license to use such content solely for internal analytics, system improvement, and feature enhancement.
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">You remain the owner of your intellectual property.</li>
                  <li className="leading-relaxed">The Company reserves the right to remove or restrict any content that violates this Policy or applicable law.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">5. Enforcement and Penalties</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  Violation of this Policy may lead to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">Temporary or permanent suspension of access.</li>
                  <li className="leading-relaxed">Termination of account without refund.</li>
                  <li className="leading-relaxed">Reporting of unlawful activity to competent authorities.</li>
                  <li className="leading-relaxed">Legal action under the Information Technology Act, 2000 or relevant penal provisions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">6. Reporting Violations</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  Users can report any policy violations, offensive content, or abusive activity by emailing danesh@decivise.com. Reports will be reviewed and acted upon within a reasonable timeframe.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">7. No Liability for User Content</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  The Company is not responsible for user-generated inputs, AI outputs derived from them, or any resulting consequences. Users bear full responsibility for how they apply the information provided by the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">8. Policy Revisions</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  We may amend or update this Policy periodically to ensure legal compliance or operational clarity. Continued use after such updates constitutes acceptance of the revised Policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">9. Governing Law & Jurisdiction</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  This Policy shall be governed by and construed in accordance with the laws of India, with exclusive jurisdiction of the courts in Chennai, Tamil Nadu.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">10. Contact Information</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-2">
                  For inquiries or complaints related to conduct or content moderation:
                </p>
                <div className="text-[var(--text-secondary)] dark:text-[#A0A0A0] space-y-1">
                  <p><strong className="text-[var(--text-primary)]">Kaipullha Techlabs Private Limited</strong></p>
                  <p>Email: <a href="mailto:danesh@decivise.com" className="text-[#5A5BEF] hover:underline">danesh@decivise.com</a></p>
                  <p>Jurisdiction: Chennai, Tamil Nadu, India</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

