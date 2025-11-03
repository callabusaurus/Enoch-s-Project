import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface ShareGuessDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShareGuessDialog({ open, onClose }: ShareGuessDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guess, setGuess] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to submit guess
    console.log("Submitting guess:", { name, email, guess });
    // Reset form and close
    setName("");
    setEmail("");
    setGuess("");
    onClose();
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
          {/* Close Button - positioned in top right */}
          <button
            onClick={handleCancel}
            className="absolute top-0 right-0 text-gray-400 dark:text-[#EAEAEA] hover:text-gray-600 dark:hover:text-gray-400 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

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
                className="bg-gray-600 dark:bg-[#181818] hover:bg-gray-700 dark:hover:bg-[#1E1E1E] text-white dark:text-[#EAEAEA] border border-gray-500 dark:border-[#2A2A2A] rounded-md px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-md px-4 py-2"
              >
                Submit Guess
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

