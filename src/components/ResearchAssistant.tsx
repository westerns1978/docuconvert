import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import Markdown from 'react-markdown';
import { askResearchAssistant, ResearchResponse } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface ResearchAssistantProps {
  documentContext: string;
}

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({ documentContext }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    
    try {
      const res = await askResearchAssistant(documentContext, query);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to get an answer.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">Web Research Assistant</h3>
            <p className="text-sm text-zinc-500">Ask questions about the document, enriched with real-time Google Search data.</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., What are the latest updates on the topics mentioned here?"
            className="w-full pl-4 pr-32 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Ask
          </button>
        </form>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100">
            {error}
          </motion.div>
        )}
        
        {result && !isSearching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6"
          >
            <div className="prose prose-zinc max-w-none prose-sm sm:prose-base prose-a:text-blue-600">
              <Markdown>{result.text}</Markdown>
            </div>
            
            {result.sources.length > 0 && (
              <div className="mt-6 pt-6 border-t border-zinc-100">
                <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-zinc-400" />
                  Sources from Google Search
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                      <span className="max-w-[200px] truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
