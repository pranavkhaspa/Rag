"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Plus, 
  Send, 
  BrainCircuit, 
  BookOpen, 
  GraduationCap, 
  ChevronLeft,
  ChevronRight,
  Upload,
  MoreVertical,
  CheckCircle2,
  Loader2,
  Trash2,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { notebookApi, chatApi, quizApi, evalApi } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const NotebookWorkspace = () => {
  const { id } = useParams();
  const router = useRouter();
  
  // State
  const [notebook, setNotebook] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  
  // Studio State
  const [studioTab, setStudioTab] = useState<"quiz" | "evaluate" | "history">("quiz");
  
  // History State
  const [historicalQuizzes, setHistoricalQuizzes] = useState<any[]>([]);
  const [historicalEvaluations, setHistoricalEvaluations] = useState<any[]>([]);
  
  // Quiz State
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  
  // Interactive Quiz Engine State
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizTimer, setQuizTimer] = useState(30);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  
  // Practice/Eval State
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [examActive, setExamActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [evalAnswer, setEvalAnswer] = useState("");
  const [evalResult, setEvalResult] = useState<any>(null);
  
  // UI State
  const [leftPaneVisible, setLeftPaneVisible] = useState(true);
  const [rightPaneVisible, setRightPaneVisible] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchNotebookData();
    }
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (id && documents.length > 0) {
      const timer = setTimeout(() => {
        refreshTopics();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedSources, id]);

  const handleGenerateDescription = async () => {
    if (documents.length === 0) return;
    setGeneratingDescription(true);
    try {
      const res = await notebookApi.generateDescription(id as string, selectedSources);
      setNotebook((prev: any) => ({ ...prev, description: res.data.description }));
      toast.success("Description updated!");
    } catch (error) {
      console.error("Failed to generate description", error);
      toast.error("Failed to generate description.");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const loadHistoricalQuiz = (quiz: any) => {
    const processed = {
      ...quiz,
      questions: (quiz.questions || []).map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? q.options.split('|') : (Array.isArray(q.options) ? q.options : [])
      }))
    };
    setQuizResult(processed);
    setQuizScore(quiz.score || 0);
    setQuizCompleted(true);
    setQuizActive(false);
    setStudioTab("quiz");
  };

  const loadHistoricalEvaluation = (evaluation: any) => {
    const processedEval = {
      ...evaluation,
      strengths: typeof evaluation.strengths === 'string' ? evaluation.strengths.split('|') : (Array.isArray(evaluation.strengths) ? evaluation.strengths : []),
      missing_concepts: typeof evaluation.missing_concepts === 'string' ? evaluation.missing_concepts.split('|') : (Array.isArray(evaluation.missing_concepts) ? evaluation.missing_concepts : [])
    };
    setEvalResult(processedEval);
    setCurrentQuestion(evaluation.question_text || "Previous Question");
    setEvalAnswer(evaluation.student_answer || "");
    setPracticeMode(true);
    setExamActive(false);
    setStudioTab("evaluate");
  };

  const refreshTopics = async () => {
    setTopicsLoading(true);
    try {
      const topicsRes = await notebookApi.getSuggestedTopics(id as string, selectedSources);
      let topics = [];
      try {
        const data = typeof topicsRes.data === 'string' ? JSON.parse(topicsRes.data) : topicsRes.data;
        topics = Array.isArray(data) ? data : [];
      } catch {
        topics = ["Core Concepts", "Key Theories", "Case Studies"];
      }
      setSuggestedTopics(topics.length > 0 ? topics : ["General Overview"]);
    } catch (error) {
      console.error("Failed to refresh topics", error);
    } finally {
      setTopicsLoading(false);
    }
  };

  const fetchNotebookData = async () => {
    try {
      const nbRes = await notebookApi.get(id as string);
      setNotebook(nbRes.data);
      
      const docRes = await notebookApi.listDocuments(id as string);
      const docs = docRes.data;
      setDocuments(docs);
      // Select all by default
      setSelectedSources(docs.map((d: any) => d.name));

      // Create or get default chat
      const chatRes = await chatApi.create(id as string, "Main Discussion");
      setChatId(chatRes.data.id);
      
      // Fetch messages if any
      const msgRes = await chatApi.getMessages(chatRes.data.id);
      setMessages(msgRes.data);

      // Load Historical Quizzes
      try {
        const quizListRes = await quizApi.list(id as string);
        if (quizListRes.data && quizListRes.data.length > 0) {
          setHistoricalQuizzes(quizListRes.data);
          const lastQuiz = quizListRes.data[0];
          const processed = {
            ...lastQuiz,
            questions: (lastQuiz.questions || []).map((q: any) => ({
              ...q,
              options: typeof q.options === 'string' ? q.options.split('|') : (Array.isArray(q.options) ? q.options : [])
            }))
          };
          setQuizResult(processed);
          setQuizScore(lastQuiz.score || 0);
          setQuizCompleted(true); // Show results of the last quiz
        }
      } catch (e) { console.error("History: Quizzes failed", e); }

      // Load Historical Evaluations
      try {
        const evalListRes = await evalApi.list(id as string);
        if (evalListRes.data && evalListRes.data.length > 0) {
          setHistoricalEvaluations(evalListRes.data);
          const lastEval = evalListRes.data[0];
          const processedEval = {
            ...lastEval,
            strengths: typeof lastEval.strengths === 'string' ? lastEval.strengths.split('|') : (Array.isArray(lastEval.strengths) ? lastEval.strengths : []),
            missing_concepts: typeof lastEval.missing_concepts === 'string' ? lastEval.missing_concepts.split('|') : (Array.isArray(lastEval.missing_concepts) ? lastEval.missing_concepts : [])
          };
          setEvalResult(processedEval);
          setCurrentQuestion(lastEval.question_text || "Previous Question");
          setEvalAnswer(lastEval.student_answer || "");
          setPracticeMode(true);
        }
      } catch (e) { console.error("History: Evaluations failed", e); }

      // Initial topics fetch will be handled by the useEffect above
    } catch (error) {
      console.error("Failed to load notebook data", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (name: string) => {
    setSelectedSources(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const selectAllSources = () => {
    if (selectedSources.length === documents.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(documents.map(d => d.name));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await notebookApi.uploadDocument(id as string, file);
      toast.success(`${file.name} uploaded and indexed.`);
      // Refresh documents
      const docRes = await notebookApi.listDocuments(id as string);
      const newDocs = docRes.data;
      setDocuments(newDocs);
      
      // Automatically select new doc
      if (!selectedSources.includes(file.name)) {
        setSelectedSources(prev => [...prev, file.name]);
      }
      
      // Topics will refresh via useEffect on selectedSources
    } catch (error) {
      console.error("Upload failed", error);
      toast.error(`Failed to upload ${file.name}.`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    toast("Remove this document?", {
      description: "This will delete the document and its indexed content from this workspace.",
      action: {
        label: "Remove",
        onClick: async () => {
          try {
            await notebookApi.deleteDocument(docId);
            toast.success("Document removed.");
            const docRes = await notebookApi.listDocuments(id as string);
            setDocuments(docRes.data);
          } catch (error) {
            console.error("Delete failed", error);
            toast.error("Failed to remove document.");
          }
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      }
    });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !chatId) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    try {
      const res = await chatApi.ask(chatId, input, selectedSources);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: res.data.answer,
        sources: res.data.sources 
      }]);
    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setStreaming(false);
    }
  };

  const generateQuiz = async (topic?: string) => {
    const activeTopic = topic || quizTopic || "General Material";
    setQuizLoading(true);
    setQuizResult(null);
    setQuizActive(false);
    setQuizCompleted(false);
    try {
      const res = await quizApi.generate(id as string, activeTopic, 5, selectedSources);
      
      const quizData = res.data;
      if (quizData && Array.isArray(quizData.questions) && quizData.questions.length > 0) {
         // Process options if they are string-delimited
         const processed = {
           ...quizData,
           questions: quizData.questions.map((q: any) => ({
             ...q,
             options: typeof q.options === 'string' ? q.options.split('|') : (Array.isArray(q.options) ? q.options : [])
           }))
         };
         setQuizResult(processed);
         setQuizActive(true);
         setCurrentQuestionIndex(0);
         setQuizScore(0);
         setQuizAnswers([]);
         setQuizCompleted(false);
         setAnswerRevealed(false);
         setSelectedAnswer(null);
         setQuizTimer(30);

         // Refresh history
         const quizListRes = await quizApi.list(id as string);
         setHistoricalQuizzes(quizListRes.data);
         toast.success("Learning circuit generated!");
      } else {
         console.error("No questions in response:", quizData);
         toast.error("AI could not generate questions. Try a different topic.");
      }
    } catch (error) {
      console.error("Quiz generation failed", error);
      toast.error("Failed to generate quiz circuit.");
    } finally {
      setQuizLoading(false);
    }
  };

  const startQuiz = () => {
    setQuizActive(true);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizAnswers([]);
    setQuizCompleted(false);
    setAnswerRevealed(false);
    setSelectedAnswer(null);
    setQuizTimer(30);
  };

  useEffect(() => {
    let interval: any;
    if (quizActive && !quizCompleted && quizTimer > 0 && !answerRevealed) {
      interval = setInterval(() => {
        setQuizTimer((prev) => prev - 1);
      }, 1000);
    } else if (quizActive && !quizCompleted && quizTimer === 0 && !answerRevealed) {
      handleAnswerSelect(-1); // Timeout
    }
    return () => clearInterval(interval);
  }, [quizActive, quizCompleted, quizTimer, answerRevealed]);

  const handleAnswerSelect = async (index: number) => {
    if (answerRevealed || !quizResult) return;
    
    setSelectedAnswer(index);
    setAnswerRevealed(true);
    
    const newAnswers = [...quizAnswers, index];
    setQuizAnswers(newAnswers);
    
    const isCorrect = index === quizResult.questions[currentQuestionIndex].correct_option;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }

    setTimeout(async () => {
      if (currentQuestionIndex < quizResult.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setAnswerRevealed(false);
        setQuizTimer(30);
      } else {
        setQuizCompleted(true);
        // Submit to backend to persist score
        try {
          await quizApi.submit(quizResult.id, newAnswers);
          // Refresh history list
          const quizListRes = await quizApi.list(id as string);
          setHistoricalQuizzes(quizListRes.data);
        } catch (e) {
          console.error("Failed to submit quiz score", e);
        }
      }
    }, 2000);
  };

  const startPractice = async () => {
    setPracticeLoading(true);
    setEvalResult(null);
    setEvalAnswer("");
    try {
      const res = await evalApi.getPracticeQuestion(id as string, "general", selectedSources);
      setCurrentQuestion(res.data.question);
      setPracticeMode(true);
      setExamActive(true);
      setStudioTab("evaluate");
    } catch (error) {
      console.error("Failed to get question", error);
    } finally {
      setPracticeLoading(false);
    }
  };

  const submitPracticeAnswer = async () => {
    if (!evalAnswer.trim()) return;
    setLoading(true);
    try {
      const res = await evalApi.evaluate(id as string, currentQuestion, evalAnswer, selectedSources);
      const data = res.data;
      const processed = {
        ...data,
        strengths: typeof data.strengths === 'string' ? data.strengths.split('|') : (Array.isArray(data.strengths) ? data.strengths : []),
        missing_concepts: typeof data.missing_concepts === 'string' ? data.missing_concepts.split('|') : (Array.isArray(data.missing_concepts) ? data.missing_concepts : [])
      };
      setEvalResult(processed);
      toast.success("Evaluation complete!");

      // Refresh history
      const evalListRes = await evalApi.list(id as string);
      setHistoricalEvaluations(evalListRes.data);
    } catch (error) {
      console.error("Evaluation failed", error);
      toast.error("Failed to evaluate answer.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !notebook) {
    return (
      <div className="h-screen w-full bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-zinc-500 text-sm font-medium animate-pulse">Syncing Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#09090B] text-zinc-100 flex flex-col overflow-hidden selection:bg-indigo-500/30">
      {/* Workspace Header */}
      <header className="h-16 border-b border-zinc-800/50 flex items-center justify-between px-6 bg-[#09090B] z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-800" onClick={() => router.push("/dashboard")}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
              <BookOpen className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold text-sm block leading-none mb-1">{notebook?.title}</span>
              <div className="flex items-center gap-2 group">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                  {notebook?.description || "Active Workspace"}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 text-zinc-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleGenerateDescription}
                  disabled={generatingDescription || documents.length === 0}
                  title="Auto-generate description from sources"
                >
                  {generatingDescription ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {notebook && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 shadow-inner">
              <span className="font-semibold text-indigo-400">{notebook.embedding_model}</span>
              <span className="text-zinc-700">•</span>
              <span>Rerank: <span className={notebook.use_reranking ? "text-emerald-400 font-bold" : "text-zinc-500"}>{notebook.use_reranking ? "ON" : "OFF"}</span></span>
            </div>
          )}
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold shadow-lg">
            ME
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Pane: Sources */}
        <AnimatePresence initial={false}>
          {leftPaneVisible && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-zinc-800/50 bg-[#09090B] flex flex-col overflow-hidden"
            >
              <div className="p-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm">Sources</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                    {selectedSources.length} / {documents.length} Selected
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-500 hover:text-indigo-400" onClick={selectAllSources}>
                    <CheckCircle2 className={`w-4 h-4 ${selectedSources.length === documents.length ? 'text-indigo-500' : ''}`} />
                  </Button>
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept=".pdf,.pptx,.ppt,.txt,.md" />
                    <div className="p-2 rounded-lg hover:bg-zinc-800 text-indigo-400 transition-colors border border-transparent hover:border-zinc-700">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    onClick={() => toggleSource(doc.name)}
                    className={`group p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedSources.includes(doc.name) 
                      ? 'bg-indigo-600/5 border-indigo-600/30' 
                      : 'bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedSources.includes(doc.name) ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate mb-0.5 ${selectedSources.includes(doc.name) ? 'text-zinc-100' : 'text-zinc-400'}`}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{doc.status || "ready"}</span>
                           {selectedSources.includes(doc.name) && (
                             <span className="text-[8px] bg-indigo-600/20 text-indigo-400 px-1.5 py-0.5 rounded-md font-black uppercase">Active</span>
                           )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {documents.length === 0 && !uploading && (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-zinc-800/50 rounded-[32px] mt-4">
                    <Upload className="w-10 h-10 text-zinc-800 mb-4" />
                    <p className="text-xs text-zinc-500 font-medium">Drop your study materials here to begin indexing.</p>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Center Pane: Chat */}
        <main className="flex-1 flex flex-col bg-zinc-950 relative">
          {/* Status Bar */}
          <div className="h-10 border-b border-zinc-800/50 flex items-center px-6 text-[10px] font-bold text-zinc-500 gap-4">
            <span className="flex items-center gap-1.5 text-indigo-400">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               RAG CONTEXT ENABLED
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">SEARCHING {selectedSources.length} DOCUMENTS</span>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-600/20 shadow-2xl shadow-indigo-600/10">
                  <BrainCircuit className="w-8 h-8 text-indigo-500" />
                </div>
                <h2 className="text-2xl font-bold mb-4 tracking-tight">How can I help you learn today?</h2>
                <p className="text-zinc-500 leading-relaxed text-sm">
                  I've indexed your {documents.length} documents. Ask me to summarize a chapter, 
                  explain a complex concept, or compare information across your sources.
                </p>
                <div className="grid grid-cols-2 gap-3 mt-8 w-full">
                   {["Summarize the main points", "Explain like I'm 5", "Key definitions", "Compare these sources"].map((hint, i) => (
                     <button 
                        key={i}
                        onClick={() => setInput(hint)}
                        className="p-3 text-[11px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-indigo-500/50 hover:text-indigo-400 transition-all text-left"
                      >
                        {hint}
                      </button>
                   ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20 mt-1">
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-5 py-3 shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-none'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2">
                      {msg.sources.map((src: any, j: number) => (
                        <div key={j} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-900/50 text-[9px] font-bold text-zinc-500 border border-zinc-800/50 hover:border-indigo-500/30 transition-colors cursor-help">
                          <FileText className="w-3 h-3 text-indigo-500/70" />
                          {src.document} <span className="text-zinc-700">•</span> PG {src.page}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 text-xs font-black shadow-lg mt-1">
                    ME
                  </div>
                )}
              </motion.div>
            ))}

            {streaming && (
              <div className="flex gap-6 justify-start">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-600/20 animate-pulse">
                  <BrainCircuit className="w-5 h-5 text-white" />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none px-5 py-3">
                  <div className="flex gap-1.5 py-1">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-8 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
            <div className="max-w-4xl mx-auto relative group">
              {/* Focus Ring Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 to-blue-600/20 rounded-[32px] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              
              <div className="relative flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-[28px] p-2 shadow-2xl focus-within:border-indigo-500/50 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Message your workspace (${selectedSources.length} sources active)...`}
                  className="w-full bg-transparent border-none rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none min-h-[50px] max-h-[200px] resize-none text-zinc-100 placeholder:text-zinc-600"
                  rows={1}
                />
                <Button 
                  className="h-10 w-10 p-0 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 mb-1" 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || streaming}
                >
                  {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <p className="text-[9px] text-zinc-700 text-center mt-4 uppercase tracking-[0.2em] font-black">
              Augmented Intelligence by Up2Skills
            </p>
          </div>
        </main>

        {/* Right Pane: Studio */}
        <AnimatePresence initial={false}>
          {rightPaneVisible && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-zinc-800/50 bg-[#09090B] flex flex-col overflow-hidden"
            >
              {/* Studio Tabs */}
              <div className="p-6 border-b border-zinc-800/50 bg-zinc-900/20">
                <div className="flex p-1.5 bg-zinc-950 rounded-[20px] border border-zinc-800 shadow-inner">
                  <button 
                    onClick={() => setStudioTab("quiz")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all ${
                      studioTab === 'quiz' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Quiz
                  </button>
                  <button 
                    onClick={() => setStudioTab("evaluate")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all ${
                      studioTab === 'evaluate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" /> Exam
                  </button>
                  <button 
                    onClick={() => setStudioTab("history")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-2xl transition-all ${
                      studioTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> History
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {studioTab === "quiz" ? (
                  <div className="space-y-8">
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
                           <Sparkles className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="font-bold text-sm tracking-tight">Smart Quiz Generator</h3>
                      </div>
                      
                      <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                        Select a recommended topic based on your study material or define a custom one.
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Suggested Topics</p>
                          {topicsLoading && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTopics.map((topic, i) => (
                            <button 
                              key={i}
                              onClick={() => generateQuiz(topic)}
                              disabled={quizLoading}
                              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400 hover:border-indigo-500/50 hover:text-white transition-all text-left disabled:opacity-50"
                            >
                              {topic}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-zinc-800/50">
                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1 mb-3">Custom Topic</p>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="e.g. Transformers Architecture"
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            value={quizTopic}
                            onChange={(e) => setQuizTopic(e.target.value)}
                          />
                          <Button className="h-10 w-10 p-0 rounded-xl" onClick={() => generateQuiz()} disabled={quizLoading}>
                            {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </section>

                    {quizLoading && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Generating Quiz...</p>
                      </div>
                    )}

                    {quizResult && !quizLoading && !quizActive && !quizCompleted && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-[32px] bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 text-center">
                         <div className="w-16 h-16 rounded-[24px] bg-indigo-600/20 flex items-center justify-center border border-indigo-600/30 mx-auto mb-6">
                            <Sparkles className="w-8 h-8 text-indigo-400" />
                         </div>
                         <h4 className="text-lg font-bold mb-2">Quiz Ready</h4>
                         <p className="text-[11px] text-zinc-400 mb-6 leading-relaxed uppercase tracking-widest font-black">
                            {quizResult.topic}
                         </p>
                         <Button className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 gap-3" onClick={() => setQuizActive(true)}>
                            Launch Learning Circuit <ArrowRight className="w-5 h-5" />
                         </Button>
                         <Button variant="ghost" className="w-full h-10 rounded-xl text-zinc-600 text-[10px] font-black uppercase mt-2 tracking-widest" onClick={() => setQuizResult(null)}>
                            Reset & Select Topic
                         </Button>
                      </motion.div>
                    )}

                    {/* Quiz Overlay (Full Screen) */}
                    <AnimatePresence>
                      {quizActive && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[100] bg-[#09090B] flex flex-col"
                        >
                          {/* Premium Background Elements */}
                          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                             <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
                             <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[120px]" />
                          </div>

                          {/* Quiz Header */}
                          <header className="h-20 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-[#09090B]/50 backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                     <BrainCircuit className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                     <h2 className="font-black text-sm uppercase tracking-[0.2em]">{quizResult?.topic}</h2>
                                     <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Learning Circuit</p>
                                  </div>
                               </div>
                            </div>

                            <div className="flex items-center gap-8">
                               <div className="flex flex-col items-end">
                                  <div className={`flex items-center gap-2 font-mono text-2xl font-black ${quizTimer < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                     {quizTimer}s
                                  </div>
                                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Remaining Time</p>
                               </div>
                               <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-zinc-800/50 border border-zinc-800" onClick={() => { if(confirm("Quit quiz? Progress will be lost.")) setQuizActive(false); }}>
                                  <X className="w-6 h-6 text-zinc-400" />
                               </Button>
                            </div>
                          </header>

                          {/* Quiz Content Area */}
                          <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
                            {!quizCompleted ? (
                              <div className="max-w-4xl w-full space-y-12">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">
                                     <span>Question {currentQuestionIndex + 1} of {quizResult.questions.length}</span>
                                     <span>{Math.round(((currentQuestionIndex) / quizResult.questions.length) * 100)}% Complete</span>
                                  </div>
                                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                     <motion.div 
                                       className="h-full bg-gradient-to-r from-indigo-600 to-purple-600" 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${((currentQuestionIndex + 1) / quizResult.questions.length) * 100}%` }}
                                     />
                                  </div>
                                </div>

                                <motion.div 
                                  key={currentQuestionIndex}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-10"
                                >
                                  <h3 className="text-xl md:text-2xl font-bold leading-tight tracking-tight text-center">
                                    {quizResult.questions[currentQuestionIndex].question_text}
                                  </h3>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quizResult.questions[currentQuestionIndex].options.map((opt: string, i: number) => {
                                      const isCorrect = i === quizResult.questions[currentQuestionIndex].correct_option;
                                      const isSelected = i === selectedAnswer;
                                      
                                      let statusClass = "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-zinc-900";
                                      if (answerRevealed) {
                                        if (isCorrect) statusClass = "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.1)]";
                                        else if (isSelected) statusClass = "bg-red-500/10 border-red-500/50 text-red-400";
                                        else statusClass = "bg-zinc-900/20 border-zinc-800/30 text-zinc-700 opacity-40";
                                      } else if (isSelected) {
                                        statusClass = "bg-indigo-600/10 border-indigo-500 text-indigo-400";
                                      }

                                      return (
                                        <button
                                          key={i}
                                          onClick={() => handleAnswerSelect(i)}
                                          disabled={answerRevealed}
                                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group relative overflow-hidden ${statusClass}`}
                                        >
                                          <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-xs font-black flex-shrink-0 transition-all ${
                                            isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-zinc-800 text-zinc-600 group-hover:border-zinc-500'
                                          }`}>
                                            {String.fromCharCode(65 + i)}
                                          </div>
                                          <span className="text-base font-medium">{opt}</span>
                                          {answerRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-500 animate-in zoom-in duration-300" />}
                                          {answerRevealed && isSelected && !isCorrect && <X className="w-5 h-5 ml-auto text-red-500 animate-in zoom-in duration-300" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              </div>
                            ) : (
                              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl w-full text-center space-y-12">
                                 <div className="relative inline-block">
                                   <div className="w-40 h-40 rounded-[48px] bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20 mx-auto shadow-2xl">
                                      <GraduationCap className="w-20 h-20 text-indigo-500" />
                                   </div>
                                   <div className="absolute -bottom-4 -right-4 bg-indigo-600 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-2xl border-4 border-[#09090B] uppercase tracking-widest animate-bounce">
                                     Mastered
                                   </div>
                                 </div>
                                 
                                 <div className="space-y-4">
                                    <h3 className="text-5xl font-black tracking-tighter">Circuit Complete</h3>
                                    <p className="text-zinc-500 text-sm uppercase tracking-[0.4em] font-black">Performance Analytics</p>
                                 </div>

                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-zinc-800 shadow-2xl group hover:border-indigo-500/30 transition-all text-center">
                                       <p className="text-4xl font-black text-white mb-1 group-hover:text-indigo-400 transition-colors">{quizScore}</p>
                                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Correct Answers</p>
                                    </div>
                                    <div className="p-6 rounded-[32px] bg-zinc-900/50 border border-zinc-800 shadow-2xl group hover:border-indigo-500/30 transition-all text-center">
                                       <p className="text-4xl font-black text-indigo-500 mb-1 group-hover:text-white transition-colors">{Math.round((quizScore / quizResult.questions.length) * 100)}%</p>
                                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Accuracy Level</p>
                                    </div>
                                 </div>

                                 <div className="flex flex-col sm:flex-row gap-4 pt-8">
                                    <Button className="flex-1 h-16 rounded-[28px] font-black text-lg shadow-2xl shadow-indigo-600/40 uppercase tracking-widest" onClick={() => generateQuiz()}>
                                       Initialize New Circuit
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-16 rounded-[28px] border-zinc-800 text-zinc-400 font-black text-lg uppercase tracking-widest hover:bg-zinc-800" onClick={() => { setQuizActive(false); setQuizCompleted(true); }}>
                                       Exit to Workspace
                                    </Button>
                                 </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {quizCompleted && !quizActive && (
                      <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-4">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Latest Score</p>
                            <span className="text-[10px] font-black text-indigo-500">{quizScore}/{quizResult.questions.length} Correct</span>
                         </div>
                         <Button variant="outline" className="w-full h-12 rounded-2xl border-indigo-500/30 text-indigo-400 font-bold bg-indigo-500/5 hover:bg-indigo-500/10" onClick={() => setQuizActive(true)}>
                            Re-attempt Circuit
                         </Button>
                      </div>
                    )}

                  </div>
                ) : studioTab === "evaluate" ? (
                  <div className="space-y-8">
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
                           <GraduationCap className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="font-bold text-sm tracking-tight">AI Oral Examination</h3>
                      </div>
                      
                      {!practiceMode ? (
                        <div className="p-6 rounded-[32px] bg-gradient-to-br from-indigo-600/10 to-blue-600/10 border border-indigo-600/20 text-center">
                          <BrainCircuit className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                          <h4 className="font-bold text-sm mb-2">Ready to be tested?</h4>
                          <p className="text-[11px] text-zinc-400 mb-6 leading-relaxed">
                            The AI will analyze your {selectedSources.length} sources and ask you a challenging question. 
                          </p>
                          <Button className="w-full h-12 rounded-2xl shadow-xl shadow-indigo-600/20 font-bold" onClick={startPractice} disabled={practiceLoading}>
                             {practiceLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                             Start Examination
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="p-6 rounded-[32px] bg-indigo-600/10 border border-indigo-600/20 text-center">
                              <CheckCircle2 className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
                              <h4 className="font-bold text-sm mb-2">Exam in Progress</h4>
                              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-6">Active Session</p>
                              <Button className="w-full h-12 rounded-2xl font-bold shadow-lg" onClick={() => setExamActive(true)}>
                                 Resume Examination
                              </Button>
                              <Button variant="ghost" className="w-full h-10 text-[10px] font-black uppercase text-zinc-600 mt-2" onClick={() => setPracticeMode(false)}>
                                 End Session
                              </Button>
                           </div>
                        </div>
                      )}
                    </section>

                    {/* Exam Overlay (Full Screen) */}
                    <AnimatePresence>
                      {examActive && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-[100] bg-[#09090B] flex flex-col"
                        >
                          <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
                             <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
                             <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[120px]" />
                          </div>

                          <header className="h-20 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-[#09090B]/50 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                  <GraduationCap className="w-6 h-6 text-white" />
                               </div>
                               <div>
                                  <h2 className="font-black text-sm uppercase tracking-[0.2em]">Oral Examination</h2>
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">In-depth Concept Validation</p>
                               </div>
                            </div>
                            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-zinc-800/50 border border-zinc-800" onClick={() => setExamActive(false)}>
                               <X className="w-6 h-6 text-zinc-400" />
                            </Button>
                          </header>

                          <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
                             <div className="max-w-4xl w-full space-y-12">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                                   <div className="p-6 md:p-8 rounded-[32px] bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden group">
                                      <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600" />
                                      <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">AI Proctored Question</p>
                                      <h3 className="text-lg md:text-xl font-bold leading-tight tracking-tight">
                                        "{currentQuestion}"
                                      </h3>
                                   </div>

                                   {!evalResult ? (
                                     <div className="space-y-6">
                                        <div className="flex items-center justify-between px-4">
                                           <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Construct your response</p>
                                           <p className="text-[10px] text-zinc-600 font-bold uppercase">Sources: {selectedSources.length} Active</p>
                                        </div>
                                        <textarea 
                                          placeholder="The AI is listening. Provide a comprehensive explanation..."
                                          className="w-full bg-zinc-900/50 border-2 border-zinc-800 rounded-[24px] px-6 py-5 text-lg h-64 resize-none focus:outline-none focus:border-indigo-500/50 transition-all shadow-inner placeholder:text-zinc-700"
                                          value={evalAnswer}
                                          onChange={(e) => setEvalAnswer(e.target.value)}
                                        />
                                        <Button 
                                          className="w-full h-16 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-600/40 uppercase tracking-[0.2em] group" 
                                          onClick={submitPracticeAnswer} 
                                          disabled={!evalAnswer.trim() || practiceLoading}
                                        >
                                          {practiceLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : null}
                                          Submit for Evaluation <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                     </div>
                                   ) : (
                                     <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                           <div className="md:col-span-2 p-6 md:p-8 rounded-[32px] bg-indigo-600/5 border border-indigo-500/20 shadow-2xl">
                                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">AI Feedback</p>
                                              <div className="prose prose-invert prose-base text-zinc-200 leading-relaxed">
                                                <ReactMarkdown>{evalResult.feedback}</ReactMarkdown>
                                              </div>
                                           </div>
                                           <div className="flex flex-col gap-4">
                                              <div className="p-6 md:p-8 rounded-[32px] bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col items-center justify-center text-center">
                                                 <p className="text-5xl font-black text-white mb-1">{evalResult.score}</p>
                                                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mastery Score</p>
                                              </div>
                                              <div className="p-6 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 shadow-xl">
                                                 <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-2 text-center">Key Strengths</p>
                                                 <div className="text-[11px] text-zinc-400 font-medium leading-relaxed text-center">
                                                   {evalResult.strengths?.join(', ') || "Conceptual grasp"}
                                                 </div>
                                              </div>
                                           </div>
                                        </div>
                                        <div className="flex gap-4">
                                           <Button className="flex-1 h-16 rounded-[28px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20" onClick={startPractice}>
                                              Next Question
                                           </Button>
                                           <Button variant="outline" className="flex-1 h-16 rounded-[28px] border-zinc-800 text-zinc-400 font-black uppercase tracking-widest" onClick={() => { setExamActive(false); setEvalResult(null); setEvalAnswer(""); }}>
                                              Exit Exam
                                           </Button>
                                        </div>
                                     </motion.div>
                                   )}
                                </motion.div>
                             </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {evalResult && !examActive && (
                      <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-4">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Latest Exam</p>
                            <span className="text-[10px] font-black text-emerald-500">Score: {evalResult.score}/10</span>
                         </div>
                         <Button variant="outline" className="w-full h-12 rounded-2xl border-indigo-500/30 text-indigo-400 font-bold bg-indigo-500/5 hover:bg-indigo-500/10" onClick={() => setExamActive(true)}>
                            Re-open Results
                         </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20">
                         <Clock className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-sm tracking-tight">Activity History</h3>
                    </div>

                    <div className="space-y-6">
                      <section>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1 mb-4">Past Quizzes</p>
                        <div className="space-y-3">
                          {historicalQuizzes.length === 0 ? (
                            <p className="text-[10px] text-zinc-500 text-center py-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">No previous quizzes.</p>
                          ) : (
                            historicalQuizzes.map((q, i) => (
                              <button 
                                key={q.id} 
                                onClick={() => loadHistoricalQuiz(q)}
                                className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all text-left group"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate group-hover:text-indigo-400">{q.topic}</p>
                                    <p className="text-[9px] text-zinc-500 mt-1">{new Date(q.created_at).toLocaleDateString()} at {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[11px] font-black text-indigo-500">{q.score || 0}/{q.questions?.length || 5}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </section>

                      <section>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1 mb-4">Past Examinations</p>
                        <div className="space-y-3">
                          {historicalEvaluations.length === 0 ? (
                            <p className="text-[10px] text-zinc-500 text-center py-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">No previous exams.</p>
                          ) : (
                            historicalEvaluations.map((ev, i) => (
                              <button 
                                key={ev.id} 
                                onClick={() => loadHistoricalEvaluation(ev)}
                                className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 transition-all text-left group"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold line-clamp-2 group-hover:text-indigo-400">"{ev.question_text}"</p>
                                    <p className="text-[9px] text-zinc-500 mt-2">{new Date(ev.created_at).toLocaleDateString()} at {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black ${
                                      ev.score >= 8 ? 'bg-emerald-500/10 text-emerald-500' : ev.score >= 5 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                      {ev.score}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Pane Toggles */}
        <button 
          onClick={() => setLeftPaneVisible(!leftPaneVisible)}
          className="absolute left-[310px] top-1/2 -translate-y-1/2 z-30 w-5 h-12 bg-zinc-800 border border-zinc-700 rounded-r-2xl flex items-center justify-center hover:bg-zinc-700 transition-all shadow-2xl hidden md:flex"
          style={{ left: leftPaneVisible ? 310 : 0 }}
        >
          {leftPaneVisible ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        <button 
          onClick={() => setRightPaneVisible(!rightPaneVisible)}
          className="absolute right-[370px] top-1/2 -translate-y-1/2 z-30 w-5 h-12 bg-zinc-800 border border-zinc-700 rounded-l-2xl flex items-center justify-center hover:bg-zinc-700 transition-all shadow-2xl hidden md:flex"
          style={{ right: rightPaneVisible ? 370 : 0 }}
        >
          {rightPaneVisible ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

      </div>
    </div>
  );
};

export default NotebookWorkspace;
