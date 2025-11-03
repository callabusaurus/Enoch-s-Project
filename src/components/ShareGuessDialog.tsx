import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { supabase } from "@/lib/supabase/client";

interface ShareGuessDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShareGuessDialog({ open, onClose }: ShareGuessDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guess, setGuess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !guess.trim()) return;
    setIsSubmitting(true);
    try {
      // Associate with current user if available
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      const { error } = await (supabase as any)
        .from('project_guesses')
        .insert({ name, email, guess, user_id: userId });

      if (error) {
        console.error('Failed to save guess:', error.message);
      } else {
        // Reset form and close
        setName("");
        setEmail("");
        setGuess("");
        onClose();
      }
    } catch (err) {
      console.error('Unexpected error saving guess:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName("");
    setEmail("");
    setGuess("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl !bg-white dark:!bg-[#121212] border border-gray-200 dark:border-[#2A2A2A] p-6 rounded-[12px] opacity-100">
        <DialogTitle className="sr-only">Share Your Guess</DialogTitle>
        <DialogDescription className="sr-only">
          Enter your guess about upcoming features
        </DialogDescription>

        <div className="relative">

          {/* Title */}
          <h2 className="text-gray-900 dark:text-[#EAEAEA] text-2xl font-bold mb-4 pr-8">
            Share Your Guess
          </h2>

          {/* Introductory Text */}
          <p className="text-gray-900 dark:text-[#EAEAEA] mb-6 text-base leading-relaxed">
            Enter your guess about what exciting things are coming soon and stand a chance to win exciting prizes!
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-gray-900 dark:text-[#EAEAEA] block text-sm font-medium">
                Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#5A5BEF] focus:ring-1 focus:ring-[#5A5BEF]"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-gray-900 dark:text-[#EAEAEA] block text-sm font-medium">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#5A5BEF] focus:ring-1 focus:ring-[#5A5BEF]"
              />
            </div>

            {/* Your Guess Field */}
            <div className="space-y-2">
              <label className="text-gray-900 dark:text-[#EAEAEA] block text-sm font-medium">
                Your Guess
              </label>
              <Textarea
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="What do you think is coming soon? Be creative!"
                required
                rows={4}
                className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:border-[#5A5BEF] focus:ring-1 focus:ring-[#5A5BEF]"
              />
              <p className="text-gray-600 dark:text-[#A0A0A0] text-sm">
                Share your thoughts on what exciting features or updates might be coming!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                onClick={handleCancel}
                className="bg-white text-gray-900 hover:bg-gray-50 border border-gray-300 dark:bg-[#181818] dark:text-[#EAEAEA] dark:hover:bg-[#1E1E1E] dark:border-[#2A2A2A] rounded-md px-4 py-2"
              >
                Cancel
              </Button>
              <div className="rounded-md p-1 bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/15 ring-2 ring-[#8B5CF6]/60 shadow-[0_0_16px_rgba(139,92,246,0.45)]">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="!bg-[#8B5CF6] hover:!bg-[#7C3AED] !text-white rounded-md px-4 py-2 !border-transparent shadow-lg shadow-[#8B5CF6]/30 ring-2 ring-[#8B5CF6]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#8B5CF6", boxShadow: "0 0 0 2px rgba(139,92,246,0.35), 0 8px 20px rgba(139,92,246,0.35)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#7C3AED"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#8B5CF6"; }}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Guess'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

