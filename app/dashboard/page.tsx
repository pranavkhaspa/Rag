"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Book, 
  CheckCircle2,
  Loader2,
  Trash2,
  X,
  MessageSquare,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  LayoutDashboard,
  Clock,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { notebookApi } from "@/lib/api";
import { toast } from "sonner";

const Dashboard = () => {
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "recent">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newNotebook, setNewNotebook] = useState({ 
    title: "", 
    description: "", 
    embedding_model: "all-MiniLM-L6-v2", 
    use_reranking: true,
    chunk_size: 500,
    chunk_overlap: 100
  });
  const [creating, setCreating] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleGenerateTitle = async () => {
    if (!newNotebook.description.trim()) return;
    setGeneratingTitle(true);
    try {
      const res = await notebookApi.generateTitle(newNotebook.description);
      setNewNotebook((prev: any) => ({ ...prev, title: res.data.title }));
      toast.success("Title generated!");
    } catch (error) {
      console.error("Failed to generate title", error);
      toast.error("Failed to generate title.");
    } finally {
      setGeneratingTitle(false);
    }
  };

  const fetchNotebooks = async () => {
    try {
      const res = await notebookApi.list();
      setNotebooks(res.data);
    } catch (error) {
      console.error("Failed to fetch notebooks", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotebook = async () => {
    if (!newNotebook.title) return;
    setCreating(true);
    try {
      await notebookApi.create(newNotebook);
      toast.success("Workspace initialized successfully!");
      setShowModal(false);
      setNewNotebook({ 
        title: "", 
        description: "", 
        embedding_model: "all-MiniLM-L6-v2", 
        use_reranking: true,
        chunk_size: 500,
        chunk_overlap: 100
      });
      fetchNotebooks();
    } catch (error) {
      console.error("Failed to create notebook", error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNotebook = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast("Delete this workspace?", {
      description: "This action cannot be undone and will remove all associated documents and history.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await notebookApi.delete(id);
            toast.success("Workspace deleted.");
            fetchNotebooks();
          } catch (error) {
            console.error("Failed to delete notebook", error);
            toast.error("Failed to delete workspace.");
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  };

  const filteredNotebooks = notebooks
    .filter(nb => {
      const matchesSearch = nb.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (view === "recent") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(nb.updated_at || nb.created_at) > weekAgo;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex relative selection:bg-indigo-500/30">
      {/* Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600" />
              <h2 className="text-2xl font-bold mb-2">Create Workspace</h2>
              <p className="text-zinc-400 text-sm mb-6">Set up a new space for your learning materials.</p>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description</label>
                  <div className="relative">
                    <textarea 
                      placeholder="What will you learn in this notebook?"
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      value={newNotebook.description}
                      onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })}
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="absolute bottom-3 right-3 h-8 gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 hover:bg-indigo-600/10 rounded-lg"
                      onClick={handleGenerateTitle}
                      disabled={generatingTitle || !newNotebook.description.trim()}
                    >
                      {generatingTitle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Generate Title
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Title</label>
                  <input 
                    type="text"
                    placeholder="e.g. Advanced Machine Learning"
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    value={newNotebook.title}
                    onChange={(e) => setNewNotebook({ ...newNotebook, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Embedding Model</label>
                  <select 
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100"
                    value={newNotebook.embedding_model}
                    onChange={(e) => setNewNotebook({ ...newNotebook, embedding_model: e.target.value })}
                  >
                    <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (ST Local - Recommended)</option>
                    <option value="bge-small-en-v1.5">bge-small-en-v1.5 (ST Local - Fast)</option>
                    <option value="nomic-embed-text">nomic-embed-text (Ollama Local)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Chunk Size</label>
                    <input 
                      type="number"
                      min={100}
                      max={2000}
                      step={50}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100"
                      value={newNotebook.chunk_size}
                      onChange={(e) => setNewNotebook({ ...newNotebook, chunk_size: parseInt(e.target.value) || 500 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Chunk Overlap</label>
                    <input 
                      type="number"
                      min={0}
                      max={1000}
                      step={10}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100"
                      value={newNotebook.chunk_overlap}
                      onChange={(e) => setNewNotebook({ ...newNotebook, chunk_overlap: parseInt(e.target.value) || 100 })}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 -mt-2">
                  Optimized: 500 chunk size and 100 overlap are proven best by RAG experiments.
                </div>
                <div className="flex items-center gap-3 py-1">
                  <input 
                    type="checkbox"
                    id="use-reranking"
                    className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-500/50 focus:ring-2 bg-zinc-800/50 accent-indigo-600"
                    checked={newNotebook.use_reranking}
                    onChange={(e) => setNewNotebook({ ...newNotebook, use_reranking: e.target.checked })}
                  />
                  <div className="flex flex-col">
                    <label htmlFor="use-reranking" className="text-sm font-semibold select-none cursor-pointer">
                      Enable Re-ranking Layer
                    </label>
                    <span className="text-[10px] text-zinc-400">
                      Uses cross-encoder/ms-marco-MiniLM-L-6-v2 for higher precision (+25ms).
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1 h-12 rounded-xl" onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button className="flex-1 h-12 rounded-xl shadow-lg shadow-indigo-600/20" onClick={handleCreateNotebook} disabled={creating || !newNotebook.title}>
                    {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize Workspace"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-72 border-r border-zinc-800/50 flex flex-col hidden lg:flex bg-[#09090B]">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Up2Skills</span>
          </Link>
          
          <nav className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-4 mb-4">Main Navigation</p>
            <Button 
              variant="ghost" 
              onClick={() => setView("dashboard")}
              className={`w-full justify-start gap-3 h-11 px-4 rounded-xl transition-all ${
                view === 'dashboard' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setView("recent")}
              className={`w-full justify-start gap-3 h-11 px-4 rounded-xl transition-all ${
                view === 'recent' 
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Clock className="w-4 h-4" /> Recent Work
            </Button>
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-zinc-800/50">
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-zinc-800/50 flex items-center justify-between px-8 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold">
              {view === "dashboard" ? "Workspace Dashboard" : "Recent Work"}
            </h1>
            <p className="text-xs text-zinc-500">
              {view === "dashboard" ? "Welcome back! Pick up where you left off." : "Your most recently updated learning spaces."}
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search workspaces..."
                className="bg-zinc-900/50 border border-zinc-800/50 rounded-full pl-12 pr-6 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-80 transition-all hover:bg-zinc-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="gap-2 h-11 px-6 rounded-full shadow-lg shadow-indigo-600/20 font-bold" onClick={() => setShowModal(true)}>
              <Plus className="w-5 h-5" /> New Workspace
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 max-w-[1600px] w-full mx-auto overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {view === "dashboard" ? "All Workspaces" : "Recent Activity"}
              <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] text-zinc-400">{filteredNotebooks.length}</span>
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 rounded-3xl bg-zinc-900/50 animate-pulse border border-zinc-800" />
              ))}
            </div>
          ) : filteredNotebooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredNotebooks.map((nb) => (
                <Link key={nb.id} href={`/notebook/${nb.id}`}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Card className="h-64 rounded-3xl border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition-all group overflow-hidden relative">
                      {/* Gradient Overlay */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -z-10 group-hover:bg-indigo-600/10 transition-colors" />
                      
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center border border-indigo-600/20 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                            <Book className="w-6 h-6 text-indigo-500 group-hover:text-white transition-colors" />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => handleDeleteNotebook(e, nb.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-xl font-bold tracking-tight">
                            {nb.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-zinc-500 text-sm">
                            {nb.description || "No description provided for this workspace."}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-6 pt-0 mt-auto">
                        <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4">
                          <div className="flex items-center -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[8px] font-bold">PDF</div>
                            <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[8px] font-bold">AI</div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-indigo-500" /> {nb.document_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(nb.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 rounded-[40px] border border-dashed border-zinc-800">
              <div className="w-24 h-24 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-8 border border-indigo-600/20">
                <Plus className="w-10 h-10 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold mb-3">No active workspaces</h3>
              <p className="text-zinc-500 max-w-sm mb-10 leading-relaxed">
                Start your learning journey by creating your first workspace. 
                Upload documents to chat with AI and generate practice materials.
              </p>
              <Button size="lg" className="h-14 px-10 rounded-2xl gap-3 font-bold shadow-xl shadow-indigo-600/20" onClick={() => setShowModal(true)}>
                <Plus className="w-6 h-6" /> Create Your First Workspace
              </Button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};


export default Dashboard;
