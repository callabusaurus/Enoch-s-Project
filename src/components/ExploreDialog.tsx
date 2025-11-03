import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { supabase } from "../lib/supabase/client";

type Teacher = { id: string; name: string; description?: string };

interface ExploreDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectTeacher: (teacherId: string) => void;
}

export function ExploreDialog({ open, onClose, onSelectTeacher }: ExploreDialogProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('/api/teacher', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setTeachers(data);
      } catch {}
    })();
  }, [open]);

  const handleAdd = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/teacher', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ name, system_prompt: systemPrompt, description }) 
      });
      const data = await res.json();
      if (res.ok && data?.id) {
        setTeachers(prev => [data, ...prev]);
        setAddOpen(false);
        setName(""); setSystemPrompt(""); setDescription("");
      }
    } catch {}
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-[#121212] border border-[#2A2A2A] p-0 rounded-[12px]">
        <DialogTitle className="sr-only">Explore Teachers</DialogTitle>
        <DialogDescription className="sr-only">Choose or create a tutor</DialogDescription>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[#EAEAEA]">Explore Tutors</h2>
            <Button className="bg-[#5A5BEF] hover:bg-[#4A4BDF]" onClick={() => setAddOpen(true)}>Add Tutor</Button>
          </div>
          <div className="space-y-2">
            {teachers.map(t => (
              <div key={t.id} className="p-4 bg-[#181818] border border-[#2A2A2A] rounded-[12px] flex items-center justify-between">
                <div>
                  <div className="text-[#EAEAEA] font-medium">{t.name}</div>
                  <div className="text-[#A0A0A0] text-sm">{t.description || ''}</div>
                </div>
                <Button onClick={() => onSelectTeacher(t.id)} className="bg-[#2A2A2A] hover:bg-[#1E1E1E]">Start Chat</Button>
              </div>
            ))}
            {!teachers.length && <div className="text-[#A0A0A0]">No tutors yet</div>}
          </div>

          {addOpen && (
            <div className="p-4 bg-[#181818] border border-[#2A2A2A] rounded-[12px] space-y-3">
              <div className="text-[#EAEAEA] font-medium">Create Tutor</div>
              <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="bg-[#121212] border-[#2A2A2A] text-[#EAEAEA]" />
              <Textarea placeholder="System prompt (how should this tutor behave)" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} className="bg-[#121212] border-[#2A2A2A] text-[#EAEAEA] min-h-[100px]" />
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} className="bg-[#121212] border-[#2A2A2A] text-[#EAEAEA] min-h-[60px]" />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="bg-[#5A5BEF] hover:bg-[#4A4BDF]" onClick={handleAdd}>Save</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}



