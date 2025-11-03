import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";

interface ProjectsComingSoonProps {
  open: boolean;
  onClose: () => void;
}

export function ProjectsComingSoon({ open, onClose }: ProjectsComingSoonProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-[#121212] border border-[#2A2A2A] p-8 rounded-[12px] text-center">
        <DialogTitle className="sr-only">Projects</DialogTitle>
        <DialogDescription className="sr-only">Coming soon</DialogDescription>
        <h2 className="text-[#EAEAEA] text-xl mb-2">Projects</h2>
        <p className="text-[#A0A0A0]">Coming soon. Stay tuned!</p>
      </DialogContent>
    </Dialog>
  );
}







