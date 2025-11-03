import { Book, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

const helpTopics = [
  { icon: Book, title: "Legal", description: "View our legal policies", link: "#" },
  { icon: Mail, title: "Contact Support", description: "Get help from our team", link: "#" },
];

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const handleLegalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose(); // Close the dialog
    // Navigate to legal page - use window.location for Vite/React SPA
    window.location.href = '/legal';
  };

  const handleContactSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose(); // Close the dialog
    // Navigate to contact support page
    window.location.href = '/contact-support';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="help-dialog-content max-w-2xl bg-white dark:bg-[#121212] !opacity-100 data-[state=open]:!opacity-100 border border-[#e5e7eb] dark:border-[#2A2A2A] p-0 rounded-[12px] [&[data-state=open]]:!opacity-100 shadow-xl"
        style={{ opacity: 1 }}
      >
        <DialogTitle className="sr-only">Help & Support</DialogTitle>
        <DialogDescription className="sr-only">
          Get help and support resources
        </DialogDescription>

        <div className="p-6 opacity-100" style={{ opacity: 1 }}>
          <h2 className="text-[#111827] dark:text-[#EAEAEA] mb-6 font-semibold">Help & Support</h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {helpTopics.map((topic) => {
              const Icon = topic.icon;
              const isLegal = topic.title === "Legal";
              const isContactSupport = topic.title === "Contact Support";
              return (
                <button
                  key={topic.title}
                  onClick={isLegal ? handleLegalClick : isContactSupport ? handleContactSupportClick : undefined}
                  className={`p-4 bg-white dark:bg-[#181818] !opacity-100 border border-[#e5e7eb] dark:border-[#2A2A2A] rounded-lg hover:border-[#5A5BEF] transition-colors shadow-sm dark:shadow-none cursor-pointer`}
                  style={{ opacity: 1 }}
                >
                  <Icon className="w-6 h-6 text-[#5A5BEF] mb-2" />
                  <h3 className="text-[#111827] dark:text-[#EAEAEA] mb-1 font-medium">{topic.title}</h3>
                  <p className="text-[#6b7280] dark:text-[#A0A0A0] text-sm">{topic.description}</p>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-white dark:bg-[#181818] !opacity-100 border border-[#e5e7eb] dark:border-[#2A2A2A] rounded-lg shadow-sm dark:shadow-none" style={{ opacity: 1 }}>
            <h3 className="text-[#111827] dark:text-[#EAEAEA] mb-2 font-medium">Quick Tips</h3>
            <ul className="space-y-2 text-[#6b7280] dark:text-[#A0A0A0]">
              <li>• Use keyboard shortcuts for faster navigation</li>
              <li>• Save important conversations to your Library</li>
              <li>• Customize your experience in Personalization settings</li>
              <li>• Export your data anytime from Data Controls</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
