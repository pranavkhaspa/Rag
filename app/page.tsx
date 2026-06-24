"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  BrainCircuit, 
  GraduationCap, 
  ArrowRight, 
  Sparkles,
  Search,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-[#09090B]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">Up2Skills Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Next-Gen AI Learning</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
              Learn from your documents. <br />
              Master any subject.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform your notes, PDFs, and lectures into interactive learning workspaces. 
              Generate quizzes, evaluate assignments, and chat with your documents using 
              advanced AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base font-semibold">
                  Create Your Notebook <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold">
                Watch Demo
              </Button>
            </div>
          </motion.div>

          {/* Hero Image / UI Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-2 shadow-2xl">
              <div className="rounded-lg border border-zinc-700/50 bg-[#09090B] overflow-hidden aspect-[16/9] flex items-center justify-center text-zinc-500">
                {/* Mockup Content */}
                <div className="flex w-full h-full">
                  <div className="w-64 border-r border-zinc-800 p-4 space-y-4 hidden md:block">
                    <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-8 w-full bg-zinc-800/50 rounded" />
                      <div className="h-8 w-full bg-zinc-800/50 rounded" />
                      <div className="h-8 w-full bg-zinc-800/50 rounded" />
                    </div>
                  </div>
                  <div className="flex-1 p-8 space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                        <BrainCircuit className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-1/4 bg-zinc-800 rounded" />
                        <div className="h-4 w-3/4 bg-zinc-800/50 rounded" />
                        <div className="h-4 w-1/2 bg-zinc-800/50 rounded" />
                      </div>
                    </div>
                    <div className="flex gap-4 justify-end items-start">
                      <div className="space-y-2 flex-1 flex flex-col items-end text-right">
                        <div className="h-4 w-1/4 bg-indigo-900/20 rounded" />
                        <div className="h-10 w-2/3 bg-indigo-600/10 rounded border border-indigo-500/20" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold">ME</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/20 blur-3xl -z-10" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to master your studies</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Our AI-powered platform provides a suite of tools designed to help you 
              retain information faster and more effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-6 h-6 text-indigo-400" />,
                title: "Smart Learning",
                description: "Upload your PDFs, PPTs, and notes. Our AI indexes them for instant retrieval and contextual understanding."
              },
              {
                icon: <BrainCircuit className="w-6 h-6 text-indigo-400" />,
                title: "Interactive Quiz",
                description: "Generate personalized quizzes based on your documents to test your knowledge and identify gaps."
              },
              {
                icon: <GraduationCap className="w-6 h-6 text-indigo-400" />,
                title: "Assignment Evaluator",
                description: "Submit your answers for evaluation. Get detailed feedback and scores based on your course material."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5" />
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 italic">Ready to start learning?</h2>
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-10 text-lg font-bold shadow-xl shadow-indigo-500/20">
              Create Your First Notebook
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800/50 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BrainCircuit className="w-5 h-5 text-indigo-500" />
            <span className="font-bold text-lg">Up2Skills Studio</span>
          </div>
          <p className="text-zinc-500 text-sm">
            © 2026 Up2Skills Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
