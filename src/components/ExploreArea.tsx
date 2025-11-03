import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { MoreVertical, Edit, Trash2, ArrowRight, ArrowLeft, X, Upload, Check, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";

type Teacher = { 
  id: string; 
  name: string; 
  description?: string;
  system_prompt?: string;
};

interface ExploreAreaProps {
  onSelectTeacher: (teacherId: string) => void;
}

export function ExploreArea({ onSelectTeacher }: ExploreAreaProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [deletingTeacherId, setDeletingTeacherId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [selectedKnowledgeLevel, setSelectedKnowledgeLevel] = useState<string | null>(null);
  const [hasSyllabus, setHasSyllabus] = useState<boolean | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [selectedLearningReason, setSelectedLearningReason] = useState<string | null>(null);
  const [customLearningReason, setCustomLearningReason] = useState("");
  const [startingTopic, setStartingTopic] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingTutor, setIsCreatingTutor] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Reset questionnaire state when modal closes
  useEffect(() => {
    if (!addOpen) {
      setCurrentStep(1);
      setSelectedSubject(null);
      setCustomSubject("");
      setSelectedKnowledgeLevel(null);
      setHasSyllabus(null);
      setUploadedFile(null);
      setShowUploadPopup(false);
      setSelectedLearningReason(null);
      setCustomLearningReason("");
      setStartingTopic("");
    }
  }, [addOpen]);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/teacher', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTeachers(data);
      } else {
        setError(data.error || 'Failed to load tutors');
      }
    } catch (err) {
      setError('Failed to load tutors');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    
    setLoading(true);
    setError(null);
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
        setName(""); 
        setSystemPrompt(""); 
        setDescription("");
      } else {
        setError(data.error || 'Failed to create tutor');
      }
    } catch (err) {
      setError('Failed to create tutor');
      console.error('Error creating teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = async () => {
    if (!startingTopic.trim()) return;
    
    setIsCreatingTutor(true);
    setError(null);
    
    try {
      // Collect all questionnaire data
      const subject = selectedSubject === "Other" ? customSubject : selectedSubject;
      if (!subject || !subject.trim()) {
        setError("Subject is required");
        setIsCreatingTutor(false);
        return;
      }
      
      // Build the system prompt with all context
      let systemPrompt = `You are an expert AI tutor specialized in ${subject}. `;
      
      // Add knowledge level context
      if (selectedKnowledgeLevel) {
        systemPrompt += `The student is at a ${selectedKnowledgeLevel.toLowerCase()} level. `;
      }
      
      // Add learning purpose
      const learningPurpose = selectedLearningReason === "Other" 
        ? customLearningReason 
        : selectedLearningReason;
      if (learningPurpose) {
        systemPrompt += `The student is learning ${subject} for: ${learningPurpose}. `;
      }
      
      // Add syllabus context
      if (hasSyllabus === true && uploadedFile) {
        systemPrompt += `The student has provided a syllabus document (${uploadedFile.name}). Use this as reference for course structure and topics. `;
      }
      
      // Add starting topic
      systemPrompt += `The student wants to start learning with: "${startingTopic}". Begin teaching from this topic and build from there. `;
      
      // Add core teaching instructions
      systemPrompt += `\n\n## Teaching Approach:\nUse the Socratic method. Assess prerequisite knowledge before explaining. Break complex topics into simple building blocks. Test comprehension after each explanation. Be patient, encouraging, and clear.`;
      
      // Create tutor name from subject
      const tutorName = `${subject} Tutor`;
      const tutorDescription = `Personalized ${subject} tutor${selectedKnowledgeLevel ? ` for ${selectedKnowledgeLevel.toLowerCase()} learners` : ''}`;
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        setError("Authentication required");
        setIsCreatingTutor(false);
        return;
      }
      
      // Create the tutor
      const res = await fetch('/api/teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: tutorName,
          description: tutorDescription,
          system_prompt: systemPrompt,
        })
      });
      
      const data = await res.json();
      
      if (res.ok && data?.id) {
        // Refresh the teachers list
        await fetchTeachers();
        
        // Close modal
        setAddOpen(false);
        
        // Reset all questionnaire state
        setCurrentStep(1);
        setSelectedSubject(null);
        setCustomSubject("");
        setSelectedKnowledgeLevel(null);
        setHasSyllabus(null);
        setUploadedFile(null);
        setShowUploadPopup(false);
        setSelectedLearningReason(null);
        setCustomLearningReason("");
        setStartingTopic("");
        
        // Redirect to chat with the new tutor
        onSelectTeacher(data.id);
      } else {
        setError(data.error || 'Failed to create tutor');
        setIsCreatingTutor(false);
      }
    } catch (err) {
      setError('Failed to create tutor');
      console.error('Error creating teacher:', err);
      setIsCreatingTutor(false);
    }
  };

  const handleEdit = async (teacherId: string) => {
    setEditingTeacherId(teacherId);
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/teacher/${teacherId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data) {
        setName(data.name || "");
        setSystemPrompt(data.system_prompt || "");
        setDescription(data.description || "");
        setEditOpen(true);
      } else {
        setError(data.error || 'Failed to load teacher');
      }
    } catch (err) {
      setError('Failed to load teacher');
      console.error('Error fetching teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTeacherId || !name.trim() || !systemPrompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/teacher/${editingTeacherId}`, { 
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({ name, system_prompt: systemPrompt, description }) 
      });
      const data = await res.json();
      if (res.ok && data?.id) {
        setTeachers(prev => prev.map(t => t.id === editingTeacherId ? data : t));
        setEditOpen(false);
        setEditingTeacherId(null);
        setName("");
        setSystemPrompt("");
        setDescription("");
      } else {
        setError(data.error || 'Failed to update teacher');
      }
    } catch (err) {
      setError('Failed to update teacher');
      console.error('Error updating teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (teacherId: string) => {
    setDeletingTeacherId(teacherId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTeacherId) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/teacher/${deletingTeacherId}`, { 
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setTeachers(prev => prev.filter(t => t.id !== deletingTeacherId));
        setDeleteDialogOpen(false);
        setDeletingTeacherId(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete teacher');
      }
    } catch (err) {
      setError('Failed to delete teacher');
      console.error('Error deleting teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--app-bg)] overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--card-border)] px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--text-primary)] text-xl font-semibold">Explore Tutors</h2>
          <Button 
            className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white" 
            onClick={() => setAddOpen(true)}
            disabled={loading}
          >
            Add Tutor
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Tutors List */}
          <div className="space-y-3">
            {loading && !addOpen && !editOpen ? (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">Loading tutors...</p>
              </div>
            ) : teachers.length > 0 ? (
              teachers.map(t => (
                <div 
                  key={t.id} 
                  className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[12px] flex items-center justify-between hover:border-[#5A5BEF] transition-colors"
                >
                  <div className="flex-1">
                    <div className="text-[var(--text-primary)] font-medium">{t.name}</div>
                    {t.description && (
                      <div className="text-[var(--text-secondary)] text-sm mt-1">{t.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[var(--card-bg)] border-[var(--card-border)]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(t.id);
                          }}
                          className="focus:bg-[var(--hover-bg)] focus:text-[var(--text-primary)] cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(t.id);
                          }}
                          className="focus:bg-[var(--hover-bg)] focus:text-red-400 text-red-400 cursor-pointer"
                          variant="destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button 
                      onClick={() => onSelectTeacher(t.id)} 
                      className="bg-[#2A2A2A] hover:bg-[#1E1E1E] text-[var(--text-primary)]"
                    >
                      Start Chat
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">No tutors yet</p>
                <p className="text-[var(--text-secondary)] text-sm mt-2">
                  Click "Add Tutor" to create your first tutor
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Tutor Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        if (!open) {
          setEditOpen(false);
          setEditingTeacherId(null);
          setName("");
          setSystemPrompt("");
          setDescription("");
          setError(null);
        }
      }}>
        <DialogContent className="bg-[var(--card-bg)] border-[var(--card-border)] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Edit Tutor</DialogTitle>
            <DialogDescription className="sr-only">
              Edit the tutor's name, system prompt, and description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input 
              placeholder="Name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-primary)]" 
              disabled={loading}
            />
            <Textarea 
              placeholder="System prompt (how should this tutor behave)" 
              value={systemPrompt} 
              onChange={e => setSystemPrompt(e.target.value)} 
              className="bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-primary)] min-h-[100px]" 
              disabled={loading}
            />
            <Textarea 
              placeholder="Description (optional)" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className="bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-primary)] min-h-[60px]" 
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setEditOpen(false);
                setEditingTeacherId(null);
                setName("");
                setSystemPrompt("");
                setDescription("");
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white" 
              onClick={handleUpdate}
              disabled={loading || !name.trim() || !systemPrompt.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tutor Modal */}
      <Dialog open={addOpen} onOpenChange={(open) => {
        if (!open) {
          setAddOpen(false);
          setName("");
          setSystemPrompt("");
          setDescription("");
          setError(null);
        }
      }}>
        <DialogContent 
          className="max-w-4xl h-[80vh] max-h-[700px] !bg-white dark:!bg-[#121212] border border-gray-200 dark:border-[#2A2A2A] p-0 rounded-[12px] opacity-100 overflow-hidden
                     data-[state=open]:animate-modal-in
                     data-[state=closed]:animate-modal-out
                     data-[state=open]:!zoom-in-100 data-[state=closed]:!zoom-out-100
                     !fade-in-0 !fade-out-0"
        >
          <DialogTitle className="sr-only">Create Tutor</DialogTitle>
          <DialogDescription className="sr-only">
            Create a new tutor with name, system prompt, and description
          </DialogDescription>
          
          <div className="p-6 h-full flex flex-col">
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full"
                >
                  {/* Title */}
                  <h2 className="text-gray-900 dark:text-[#EAEAEA] text-center text-xl font-medium mb-8">
                    Which subject do you want to learn?
                  </h2>

                  {/* Subject Options Grid */}
                  <div className="grid grid-cols-2 gap-4 flex-1 mb-6">
                    {["Math", "History", "Physics", "Coding", "Other"].map((subject) => (
                      <button
                        key={subject}
                        onClick={() => {
                          setSelectedSubject(subject);
                          if (subject !== "Other") {
                            setCustomSubject("");
                          }
                        }}
                        className={`p-6 rounded-lg border-2 transition-all duration-200 text-left
                          ${
                            selectedSubject === subject
                              ? "bg-[#5A5BEF] border-[#5A5BEF] text-white dark:text-white"
                              : "bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] hover:border-[#5A5BEF] hover:bg-[#5A5BEF]/10 dark:hover:bg-[#5A5BEF]/20"
                          }`}
                      >
                        <div className="font-medium text-base">{subject}</div>
                      </button>
                    ))}
                  </div>

                  {/* Other Input Field - appears when "Other" is selected */}
                  {selectedSubject === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-6"
                    >
                      <Input
                        placeholder="Enter custom subject..."
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] w-full"
                        autoFocus
                      />
                    </motion.div>
                  )}

                  {/* Next Button */}
                  <div className="flex justify-end mt-auto">
                    <Button
                      onClick={() => {
                        // Slide animation will be handled by AnimatePresence
                        setCurrentStep(2);
                      }}
                      disabled={
                        !selectedSubject || (selectedSubject === "Other" && !customSubject.trim())
                      }
                      className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : currentStep === 2 ? (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full"
                >
                  {/* Title */}
                  <h2 className="text-gray-900 dark:text-[#EAEAEA] text-center text-xl font-medium mb-8">
                    How much do you know about the subject?
                  </h2>

                  {/* Knowledge Level Options */}
                  <div className="flex flex-col gap-4 flex-1 mb-6 justify-center">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setSelectedKnowledgeLevel(level);
                        }}
                        className={`p-6 rounded-lg border-2 transition-all duration-200 text-left
                          ${
                            selectedKnowledgeLevel === level
                              ? "bg-[#5A5BEF] border-[#5A5BEF] text-white dark:text-white"
                              : "bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] hover:border-[#5A5BEF] hover:bg-[#5A5BEF]/10 dark:hover:bg-[#5A5BEF]/20"
                          }`}
                      >
                        <div className="font-medium text-base">{level}</div>
                      </button>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-auto">
                    <Button
                      onClick={() => {
                        setCurrentStep(1);
                      }}
                      variant="ghost"
                      className="text-gray-700 dark:text-[#EAEAEA] hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentStep(3);
                      }}
                      disabled={!selectedKnowledgeLevel}
                      className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : currentStep === 3 ? (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full relative"
                >
                  {/* Title */}
                  <h2 className="text-gray-900 dark:text-[#EAEAEA] text-center text-xl font-medium mb-8">
                    Do you have a syllabus you can share?
                  </h2>

                  {/* Yes/No Buttons */}
                  <div className="flex flex-col gap-4 mb-8">
                    <button
                      onClick={() => {
                        setHasSyllabus(true);
                        setShowUploadPopup(true);
                      }}
                      className={`p-6 rounded-lg border-2 transition-all duration-200 text-left font-medium text-base
                        ${
                          hasSyllabus === true
                            ? "bg-[#5A5BEF] border-[#5A5BEF] text-white dark:text-white"
                            : "bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] hover:border-[#5A5BEF] hover:bg-[#5A5BEF]/10 dark:hover:bg-[#5A5BEF]/20"
                        }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => {
                        setHasSyllabus(false);
                        setUploadedFile(null);
                        setShowUploadPopup(false);
                      }}
                      className={`p-6 rounded-lg border-2 transition-all duration-200 text-left font-medium text-base
                        ${
                          hasSyllabus === false
                            ? "bg-[#5A5BEF] border-[#5A5BEF] text-white dark:text-white"
                            : "bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] hover:border-[#5A5BEF] hover:bg-[#5A5BEF]/10 dark:hover:bg-[#5A5BEF]/20"
                        }`}
                    >
                      No
                    </button>
                  </div>

                  {/* File Upload Confirmation */}
                  {uploadedFile && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-[#5A5BEF]/10 dark:bg-[#5A5BEF]/20 border border-[#5A5BEF]/30 rounded-lg flex items-center gap-2"
                    >
                      <Check className="w-5 h-5 text-[#5A5BEF] flex-shrink-0" />
                      <span className="text-[#5A5BEF] dark:text-[#5A5BEF] font-medium">
                        File attached ✓
                      </span>
                      <span className="text-gray-600 dark:text-[#A0A0A0] ml-2 text-sm">
                        {uploadedFile.name}
                      </span>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-auto">
                    <Button
                      onClick={() => {
                        setCurrentStep(2);
                      }}
                      variant="ghost"
                      className="text-gray-700 dark:text-[#EAEAEA] hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentStep(4);
                      }}
                      disabled={hasSyllabus === null || (hasSyllabus === true && !uploadedFile)}
                      className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* File Upload Sub-Popup */}
                  {showUploadPopup && (
                    <div className="absolute inset-0 bg-black/30 dark:bg-black/70 flex items-center justify-center z-50 rounded-[12px]">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2A2A2A] rounded-lg p-6 max-w-md w-full mx-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-gray-900 dark:text-[#EAEAEA] text-lg font-semibold">
                            Upload your syllabus
                          </h3>
                          <button
                            onClick={() => setShowUploadPopup(false)}
                            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E1E1E] text-gray-500 dark:text-[#A0A0A0] transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <label
                            htmlFor="syllabus-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-[#2A2A2A] rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1E1E1E] transition-colors relative"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.add('border-[#5A5BEF]', 'bg-[#5A5BEF]/5');
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.remove('border-[#5A5BEF]', 'bg-[#5A5BEF]/5');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.currentTarget.classList.remove('border-[#5A5BEF]', 'bg-[#5A5BEF]/5');
                              const file = e.dataTransfer.files[0];
                              if (file && (file.type === 'application/pdf' || file.type.includes('word'))) {
                                setUploadedFile(file);
                                setTimeout(() => {
                                  setShowUploadPopup(false);
                                }, 500);
                              }
                            }}
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                              <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-[#A0A0A0]" />
                              <p className="mb-2 text-sm text-gray-500 dark:text-[#A0A0A0]">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 dark:text-[#A0A0A0]">
                                PDF, DOC, DOCX (MAX. 10MB)
                              </p>
                            </div>
                            <input
                              id="syllabus-upload"
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setUploadedFile(file);
                                  setTimeout(() => {
                                    setShowUploadPopup(false);
                                  }, 500);
                                }
                              }}
                            />
                          </label>

                          {uploadedFile && (
                            <div className="p-3 bg-gray-50 dark:bg-[#1E1E1E] rounded-lg">
                              <p className="text-sm text-gray-900 dark:text-[#EAEAEA]">
                                {uploadedFile.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              ) : currentStep === 4 ? (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full overflow-y-auto"
                >
                  {/* Title */}
                  <h2 className="text-gray-900 dark:text-[#EAEAEA] text-center text-xl font-medium mb-8">
                    Why are you learning it?
                  </h2>

                  {/* Learning Reason Options */}
                  <div className="flex flex-col gap-4 mb-6">
                    {["Competitive Exams", "School", "College", "Other"].map((reason) => (
                      <button
                        key={reason}
                        onClick={() => {
                          setSelectedLearningReason(reason);
                          if (reason !== "Other") {
                            setCustomLearningReason("");
                          }
                        }}
                        className={`p-6 rounded-lg border-2 transition-all duration-200 text-left font-medium text-base
                          ${
                            selectedLearningReason === reason
                              ? "bg-[#5A5BEF] border-[#5A5BEF] text-white dark:text-white"
                              : "bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] hover:border-[#5A5BEF] hover:bg-[#5A5BEF]/10 dark:hover:bg-[#5A5BEF]/20"
                          }`}
                      >
                        <div className="font-medium text-base">{reason}</div>
                      </button>
                    ))}
                  </div>

                  {/* Other Input Field - appears when "Other" is selected */}
                  {selectedLearningReason === "Other" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-6"
                    >
                      <Input
                        placeholder="Enter your reason..."
                        value={customLearningReason}
                        onChange={(e) => setCustomLearningReason(e.target.value)}
                        className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] w-full"
                        autoFocus
                      />
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 mb-4">
                    <Button
                      onClick={() => {
                        setCurrentStep(3);
                      }}
                      variant="ghost"
                      className="text-gray-700 dark:text-[#EAEAEA] hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setCurrentStep(5);
                      }}
                      disabled={
                        !selectedLearningReason || (selectedLearningReason === "Other" && !customLearningReason.trim())
                      }
                      className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex flex-col h-full"
                >
                  {/* Title */}
                  <h2 className="text-gray-900 dark:text-[#EAEAEA] text-center text-xl font-medium mb-8">
                    What topic should we start learning with?
                  </h2>

                  {/* Starting Topic Input */}
                  <div className="flex-1 mb-6">
                    <Textarea
                      placeholder="Type your starting topic..."
                      value={startingTopic}
                      onChange={(e) => setStartingTopic(e.target.value)}
                      className="bg-white dark:bg-[#181818] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-[#EAEAEA] w-full min-h-[200px] resize-none"
                      autoFocus
                    />
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-auto">
                    <Button
                      onClick={() => {
                        setCurrentStep(4);
                      }}
                      variant="ghost"
                      className="text-gray-700 dark:text-[#EAEAEA] hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleStartLearning}
                      disabled={!startingTopic.trim() || isCreatingTutor}
                      className="bg-[#5A5BEF] hover:bg-[#4A4BDF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreatingTutor ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Start Learning"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[var(--card-bg)] border-[var(--card-border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--text-primary)]">Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-secondary)]">
              Are you sure you want to delete this teacher? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingTeacherId(null);
              }}
              disabled={loading}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

