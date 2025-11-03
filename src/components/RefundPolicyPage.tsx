export function RefundPolicyPage() {
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
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Refund and Cancellation Policy</h1>
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
                This Refund and Cancellation Policy ("Policy") applies to all users of Petros ("Platform") operated by Kaipullha Techlabs Private Limited ("Company", "we", "our", "us"). By purchasing or subscribing to any plan, you acknowledge and agree to the terms outlined below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">2. Non-Refundable Policy</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                All payments made for subscriptions or credits on the Platform are strictly non-refundable. Once a transaction is processed successfully through Razorpay, no refunds, chargebacks, or cancellations will be entertained, regardless of usage or account activity.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">3. Subscription Terms</h2>
              <ul className="list-disc list-inside space-y-2 text-[var(--text-secondary)] dark:text-[#A0A0A0] ml-4">
                <li className="leading-relaxed">Users are responsible for reviewing all plan details before subscribing.</li>
                <li className="leading-relaxed">Each subscription term (monthly, quarterly, or annual) will remain active until its expiration date.</li>
                <li className="leading-relaxed">The Company reserves the right to discontinue or modify any subscription plan with prior notice on the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">4. Cancellation by User</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                Users may cancel future renewals at any time by disabling auto-renewal in their account settings. Cancellation will prevent renewal charges but will not result in a refund for the remaining period of the active subscription.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">5. Cancellation by Company</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                The Company may, at its sole discretion, suspend or terminate user access for violations of the Terms & Conditions, abuse of services, or unlawful conduct. In such cases, no refund shall be issued for any remaining period or unused credits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">6. Duplicate Transactions</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                In the rare event of duplicate billing due to a technical error, users must notify us within seven (7) days of the transaction by emailing danesh@decivise.com with proof of payment. Verified duplicate charges will be refunded through the original payment method.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">7. Payment Disputes</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                If you believe an unauthorized or incorrect charge occurred, report it immediately to danesh@decivise.com. We will investigate in coordination with Razorpay. Filing a false or fraudulent chargeback may result in permanent suspension of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">8. Service Interruptions</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                Temporary outages or maintenance downtime do not qualify for refunds or extensions. However, if a paid service is unavailable for more than 72 consecutive hours due to a Company-side issue, an extension of service duration may be provided at the Company's discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">9. Governing Law</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed">
                This Policy shall be governed by and construed in accordance with the laws of India, with exclusive jurisdiction of the courts in Chennai, Tamil Nadu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">10. Contact Information</h2>
              <p className="text-[var(--text-secondary)] dark:text-[#A0A0A0] leading-relaxed mb-2">
                For billing or refund-related concerns:
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

