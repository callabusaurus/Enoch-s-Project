export function DMCATakedownPolicyPage() {
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
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">DMCA & Content Takedown Policy</h1>
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
                  This DMCA & Content Takedown Policy ("Policy") outlines how Kaipullha Techlabs Private Limited ("Company", "we", "our", "us") addresses copyright infringement claims and manages content removal on Petros ("Platform"). We comply with the Information Technology Act, 2000, and, where applicable, follow principles inspired by the Digital Millennium Copyright Act (DMCA).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">2. Policy Objective</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  We respect intellectual property rights and expect users to do the same. Any material that infringes on copyright, trademark, or other proprietary rights will be removed upon proper notice and verification.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">3. User Responsibility</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  By using the Platform, you agree that:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">You will only upload, input, or transmit data that you own or have legal rights to use.</li>
                  <li className="leading-relaxed">You will not reproduce, distribute, or share copyrighted content without authorization.</li>
                  <li className="leading-relaxed">You will not use the Platform to generate, disseminate, or assist in the infringement of others' intellectual property.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">4. Reporting Copyright Infringement</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  If you believe that any content available on the Platform violates your intellectual property rights, you may submit a takedown request containing:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">Your full name, address, and valid contact information.</li>
                  <li className="leading-relaxed">A description of the copyrighted work you claim has been infringed.</li>
                  <li className="leading-relaxed">The exact URL or location of the allegedly infringing content.</li>
                  <li className="leading-relaxed">A statement declaring that you have a good-faith belief that the use of the material is not authorized by the copyright owner or law.</li>
                  <li className="leading-relaxed">A declaration, made under penalty of perjury, that the information provided is accurate and that you are the copyright owner or authorized representative.</li>
                  <li className="leading-relaxed">Your physical or electronic signature.</li>
                </ul>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mt-3">
                  Send all notices to:
                </p>
                <div className="text-[var(--text-secondary)] dark:text-[#A0A0A0] space-y-1 mt-2">
                  <p><strong className="text-[var(--text-primary)]">Kaipullha Techlabs Private Limited</strong></p>
                  <p>Email: <a href="mailto:danesh@decivise.com" className="text-[#5A5BEF] hover:underline">danesh@decivise.com</a></p>
                  <p>Jurisdiction: Chennai, Tamil Nadu, India</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">5. Review and Action</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  Upon receiving a valid notice, we will:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">Review the claim and verify its validity.</li>
                  <li className="leading-relaxed">Temporarily restrict or remove the allegedly infringing content.</li>
                  <li className="leading-relaxed">Notify the user responsible for the content, providing a copy of the notice.</li>
                  <li className="leading-relaxed">Allow the user to file a counter-notice if they believe the removal was in error.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">6. Counter-Notice Procedure</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-3">
                  If you believe your content was wrongfully removed, submit a counter-notice including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                  <li className="leading-relaxed">Your name, address, and contact information.</li>
                  <li className="leading-relaxed">Identification of the removed content and its previous location.</li>
                  <li className="leading-relaxed">A statement, under penalty of perjury, that you believe the content was removed by mistake or misidentification.</li>
                  <li className="leading-relaxed">Consent to the jurisdiction of courts in Chennai, Tamil Nadu, India, for dispute resolution.</li>
                  <li className="leading-relaxed">Your physical or electronic signature.</li>
                </ul>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mt-3">
                  We may reinstate the content if the original complainant does not pursue legal action within a reasonable timeframe.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">7. Repeat Infringers</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  Users who repeatedly violate intellectual property laws or this Policy may face account suspension or permanent termination without refund or prior notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">8. False Claims</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  Submission of fraudulent or bad-faith notices or counter-notices may result in legal consequences under applicable law.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">9. Policy Updates</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  We may modify or update this Policy as required by law or operational needs. Updated versions will be posted on the Platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">10. Governing Law</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                  This Policy is governed by the laws of India, with exclusive jurisdiction vested in the courts of Chennai, Tamil Nadu.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">11. Contact Information</h2>
                <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-2">
                  For all copyright or takedown-related communications:
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

