import { Avatar, AvatarFallback } from "./ui/avatar";
import { Sparkles } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-4 px-6 py-6 bg-white dark:bg-[#1E1E1E] transition-opacity duration-200 ease-in">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarFallback className="bg-gray-100 border border-gray-200 dark:bg-[#181818] dark:border-[#2A2A2A]">
          <Sparkles className="w-4 h-4 text-[#5A5BEF]" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="bg-gray-100 dark:bg-[#2A2A2A] px-4 py-3 rounded-2xl rounded-tl-sm animate-pulse border border-gray-200 dark:border-[#3A3A3A]">
          <div className="flex space-x-2 items-center min-h-[20px]">
            <span 
              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '-0.3s' }}
            />
            <span 
              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '-0.15s' }}
            />
            <span 
              className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

