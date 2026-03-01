import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Sparkles, Loader2, AlertCircle, Github } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { MarkdownPreview } from './components/MarkdownPreview';
import { ResearchAssistant } from './components/ResearchAssistant';
import { LocationAssistant } from './components/LocationAssistant';
import { SmartInsights } from './components/SmartInsights';
import { convertPdfToMarkdown } from './services/gemini';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    console.log('[App] handleFileSelect called. file state set to:', selectedFile);
    setFile(selectedFile);
    setUrl('');
    setMarkdown(null);
    setError(null);
  };

  const handleUrlSelect = (selectedUrl: string) => {
    console.log('[App] handleUrlSelect called. url state set to:', selectedUrl);
    setUrl(selectedUrl);
    setFile(null);
    setMarkdown(null);
    setError(null);
  };

  const handleConvert = async () => {
    console.log('--- Convert button clicked ---');
    console.log('[App] Current state -> File:', file?.name, '| URL:', url);
    
    if (!file && !url) {
      console.log('[App] No file or URL selected. Aborting.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMarkdown(null);
    
    try {
      let result = '';
      
      const isPdf = file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
      console.log('[App] Is PDF detected?', !!isPdf);

      if (isPdf) {
        console.log('[App] Path A: Routing to Gemini PDF converter...');
        setStatus('Analyzing PDF with Gemini...');
        result = await convertPdfToMarkdown(file, (s) => {
          console.log('[App] Gemini progress:', s);
          setStatus(s);
        });
        console.log('[App] Gemini conversion complete. Length:', result.length);
      } else {
        console.log('[App] Path B: Routing to FastAPI backend...');
        setStatus('Processing via MarkItDown backend...');
        
        const formData = new FormData();
        if (file) {
          console.log('[App] Appending file to FormData:', file.name);
          formData.append('file', file);
        }
        if (url) {
          console.log('[App] Appending URL to FormData:', url);
          formData.append('url', url);
        }

        // Hardcoded fallback URL as requested
        const apiUrl = (import.meta as any).env?.VITE_CONVERT_API_URL || 'https://docuconvert-backend-286939318734.us-west1.run.app';
        console.log('[App] Using Backend API URL:', apiUrl);
        
        console.log('[App] Sending POST request to:', `${apiUrl}/convert`);
        const res = await fetch(`${apiUrl}/convert`, {
          method: 'POST',
          body: formData
        });
        
        console.log('[App] Backend response status:', res.status);
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error('[App] Backend error data:', errData);
          throw new Error(errData.detail || `Backend conversion failed with status ${res.status}. Ensure the Python backend is running.`);
        }
        
        const data = await res.json();
        console.log('[App] Backend conversion complete. Format detected:', data.format);
        result = data.markdown;
      }
      
      console.log('[App] Setting markdown result to state...');
      setMarkdown(result);
    } catch (err) {
      console.error('--- Conversion Error ---', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during conversion.');
    } finally {
      console.log('[App] Cleaning up processing state...');
      setIsProcessing(false);
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-lg">DocuConvert AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">How it works</a>
            <a href="#" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Privacy</a>
            <div className="h-4 w-px bg-zinc-200" />
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-zinc-900">
              PDF to Markdown, <span className="text-emerald-600">Perfected.</span>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Transform complex PDF documents into clean, structured Markdown using Gemini 3.1 Pro. 
              Preserve tables, lists, and formatting with AI precision.
            </p>
          </motion.div>
        </div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50"
        >
          <FileUploader onFileSelect={handleFileSelect} onUrlSelect={handleUrlSelect} disabled={isProcessing} />

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={handleConvert}
              disabled={(!file && !url) || isProcessing}
              className={cn(
                "group relative px-8 py-4 bg-zinc-900 text-white rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center gap-2 overflow-hidden",
                ((!file && !url) || isProcessing) ? "opacity-50 cursor-not-allowed" : "hover:bg-zinc-800 hover:shadow-lg active:scale-95"
              )}
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Converting...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
                    <span>Convert to Markdown</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {status && (
              <p className="text-sm text-zinc-500 animate-pulse font-medium">
                {status}
              </p>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100"
              >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {markdown && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
            >
              <MarkdownPreview content={markdown} filename={file?.name || url || 'document.md'} />
              <SmartInsights documentContext={markdown} />
              <ResearchAssistant documentContext={markdown} />
              <LocationAssistant documentContext={markdown} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        {!markdown && !isProcessing && (
          <div className="grid md:grid-cols-3 gap-8 mt-24">
            {[
              {
                title: "AI-Powered",
                desc: "Uses Gemini 3.1 Pro for state-of-the-art document understanding.",
                icon: Sparkles
              },
              {
                title: "Structure Aware",
                desc: "Intelligently identifies tables, nested lists, and complex layouts.",
                icon: FileText
              },
              {
                title: "Privacy First",
                desc: "Documents are processed securely and never stored permanently.",
                icon: Github
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-zinc-600" />
                </div>
                <h3 className="font-semibold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-zinc-200 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">DocuConvert AI</span>
          </div>
          <p className="text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} DocuConvert AI. Powered by Google Gemini.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors">Terms</a>
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors">Privacy</a>
            <a href="#" className="text-xs font-medium text-zinc-400 hover:text-zinc-900 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function for class merging
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}