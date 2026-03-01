import React, { useState } from 'react';
import { Sparkles, FileText, ListTodo, Users, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Markdown from 'react-markdown';
import { analyzeDocument } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface SmartInsightsProps {
  documentContext: string;
}

type InsightType = 'summary' | 'actions' | 'entities' | null;

export const SmartInsights: React.FC<SmartInsightsProps> = ({ documentContext }) => {
  const [activeInsight, setActiveInsight] = useState<InsightType>(null);
  const [loading, setLoading] = useState<InsightType>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleInsight = async (type: InsightType, prompt: string) => {
    if (activeInsight === type) {
      setActiveInsight(null);
      return;
    }
    
    setActiveInsight(type);
    if (results[type!]) return; // Already cached

    setLoading(type);
    setError(null);
    try {
      const res = await analyzeDocument(documentContext, prompt);
      setResults(prev => ({ ...prev, [type!]: res }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate insight.');
      setActiveInsight(null);
    } finally {
      setLoading(null);
    }
  };

  const buttons = [
    { id: 'summary' as InsightType, label: 'Executive Summary', icon: FileText, prompt: 'Provide a concise executive summary of this document in 3-4 paragraphs.' },
    { id: 'actions' as InsightType, label: 'Action Items', icon: ListTodo, prompt: 'Extract all action items, tasks, or next steps mentioned in this document. Format as a checklist.' },
    { id: 'entities' as InsightType, label: 'Key Entities', icon: Users, prompt: 'Identify the key people, organizations, and locations mentioned in this document. Provide a brief description for each.' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 bg-purple-50/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">AI Document Insights</h3>
            <p className="text-sm text-zinc-500">Quickly analyze the document using Gemini Flash for rapid insights.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {buttons.map(btn => {
            const Icon = btn.icon;
            const isActive = activeInsight === btn.id;
            const isLoading = loading === btn.id;
            
            return (
              <button
                key={btn.id}
                onClick={() => handleInsight(btn.id, btn.prompt)}
                disabled={loading !== null && loading !== btn.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-purple-600 text-white shadow-md' 
                    : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-purple-200'
                } ${loading !== null && loading !== btn.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                {btn.label}
                {isActive ? <ChevronUp className="w-4 h-4 ml-1 opacity-70" /> : <ChevronDown className="w-4 h-4 ml-1 opacity-70" />}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {error}
          </motion.div>
        )}
        
        {activeInsight && results[activeInsight] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-zinc-100"
          >
            <div className="p-6 bg-zinc-50/50">
              <div className="prose prose-zinc max-w-none prose-sm sm:prose-base prose-a:text-purple-600">
                <Markdown>{results[activeInsight]}</Markdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
