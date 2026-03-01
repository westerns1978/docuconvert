import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Download, Check, Database } from 'lucide-react';
import { useState } from 'react';
import { chunkText, createEmbeddingsJsonl } from '../lib/textProcessing';

interface MarkdownPreviewProps {
  content: string;
  filename: string;
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.pdf$/i, '.md');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonl = () => {
    const chunks = chunkText(content, 5); // 5 sentences per chunk as per Python script
    const jsonl = createEmbeddingsJsonl(chunks);
    const blob = new Blob([jsonl], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.pdf$/i, '_embeddings.jsonl');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col gap-4">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-100 border border-zinc-200 rounded-t-xl">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Markdown Output</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-white hover:text-zinc-900 rounded-lg transition-all border border-transparent hover:border-zinc-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownloadJsonl}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-white hover:text-zinc-900 rounded-lg transition-all border border-transparent hover:border-zinc-200"
            title="Export as JSONL chunks for embeddings"
          >
            <Database className="w-3.5 h-3.5" />
            Export JSONL
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download .md
          </button>
        </div>
      </div>
      <div className="p-8 bg-white border-x border-b border-zinc-200 rounded-b-xl shadow-sm min-h-[400px]">
        <div className="prose prose-zinc max-w-none prose-headings:font-semibold prose-a:text-emerald-600">
          <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
        </div>
      </div>
    </div>
  );
};
