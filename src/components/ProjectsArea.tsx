import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ShareGuessDialog } from "./ShareGuessDialog";

export function ProjectsArea() {
  const [shareGuessOpen, setShareGuessOpen] = useState(false);

  return (
    <>
      <div className="flex-1 flex items-center justify-center bg-[var(--app-bg)]">
        <div className="text-center space-y-6 px-4">
          <Sparkles className="w-12 h-12 text-[#8B5CF6] dark:text-[#A78BFA] mx-auto" />
          <h1 className="text-gray-900 dark:text-[#EAEAEA] text-2xl font-medium">
            Exciting Things Coming Soon
          </h1>
          <p className="text-gray-900 dark:text-[#EAEAEA] text-base">
            Guess what?{" "}
            <button
              onClick={() => setShareGuessOpen(true)}
              className="text-[#8B5CF6] dark:text-[#A78BFA] hover:underline font-medium"
            >
              Share your guess
            </button>{" "}
            and win exciting prizes!
          </p>
        </div>
      </div>

      <ShareGuessDialog
        open={shareGuessOpen}
        onClose={() => setShareGuessOpen(false)}
      />
    </>
  );
}

