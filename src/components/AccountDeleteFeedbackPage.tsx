import { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { supabase } from '@/lib/supabase/client';

export function AccountDeleteFeedbackPage() {
  const [reason, setReason] = useState('');
  const [advice, setAdvice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not authenticated');

      // 1) Save feedback
      const res = await fetch('/api/account/delete-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason, advice }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save feedback');
      }

      // 2) Delete account through existing endpoint
      await fetch('/api/export/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      // Optionally sign out locally
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <button onClick={handleBack} className="mr-4 text-sm px-3 py-2 rounded-md bg-gray-100 dark:bg-[#2A2A2A] hover:bg-gray-200 dark:hover:bg-[#1E1E1E]">
            Back
          </button>
          <h1 className="text-2xl font-semibold">We’re sorry to see you go</h1>
        </div>

        <div className="space-y-6 bg-white dark:bg-[#181818] border border-[var(--card-border)] rounded-[12px] p-6">
          <div className="space-y-2">
            <label className="text-[var(--text-secondary)]">Why do you want to delete your account?</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us the main reason..."
              className="min-h-[120px] bg-white dark:bg-[#181818] border-[var(--card-border)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[var(--text-secondary)]">What would be one advice you would want us to take?</label>
            <Textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              placeholder="Your advice..."
              className="min-h-[120px] bg-white dark:bg-[#181818] border-[var(--card-border)]"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              // Inline background to prevent external overrides
              style={{ backgroundColor: '#dc2626' }}
              className="px-5 py-2.5 rounded-xl font-semibold text-white shadow-md border border-red-700/60 hover:shadow-lg active:scale-[0.99] transition-all select-none z-[61] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#181818]"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


