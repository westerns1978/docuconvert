import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, Link as LinkIcon, Image as ImageIcon, FileAudio, FileArchive, FileSpreadsheet, Presentation, File as FileIcon } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  onUrlSelect: (url: string) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, onUrlSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [mode, setMode] = useState<'file' | 'url'>('file');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      console.log('[FileUploader] File dropped. Calling onFileSelect with:', file);
      setSelectedFile(file);
      onFileSelect(file);
      onUrlSelect('');
      setUrlInput('');
    }
  }, [onFileSelect, onUrlSelect, disabled]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('[FileUploader] File input changed. Calling onFileSelect with:', file);
      setSelectedFile(file);
      onFileSelect(file);
      onUrlSelect('');
      setUrlInput('');
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      console.log('[FileUploader] URL submitted. Calling onUrlSelect with:', urlInput.trim());
      onUrlSelect(urlInput.trim());
      setSelectedFile(null);
      onFileSelect(null);
    }
  };

  const clearSelection = () => {
    console.log('[FileUploader] Clearing selection.');
    setSelectedFile(null);
    setUrlInput('');
    onFileSelect(null);
    onUrlSelect('');
  };

  const getFileIcon = (type: string, name: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6" />;
    if (type.includes('image')) return <ImageIcon className="w-6 h-6" />;
    if (type.includes('audio')) return <FileAudio className="w-6 h-6" />;
    if (type.includes('zip') || name.endsWith('.zip')) return <FileArchive className="w-6 h-6" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-6 h-6" />;
    if (type.includes('presentation') || type.includes('powerpoint')) return <Presentation className="w-6 h-6" />;
    return <FileIcon className="w-6 h-6" />;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex gap-4 mb-4 justify-center">
        <button
          onClick={() => setMode('file')}
          className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", mode === 'file' ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}
        >
          Upload File
        </button>
        <button
          onClick={() => setMode('url')}
          className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", mode === 'url' ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200")}
        >
          YouTube URL
        </button>
      </div>

      {!selectedFile && !urlInput ? (
        mode === 'file' ? (
          <label
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer",
              isDragging 
                ? "border-emerald-500 bg-emerald-50/50" 
                : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <div className="p-4 mb-4 rounded-full bg-white shadow-sm border border-zinc-100 flex gap-2">
                <Upload className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="mb-2 text-sm text-zinc-700">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-zinc-500 max-w-md">
                Supports PDF, Word, Excel, PowerPoint, Images (OCR), Audio (Transcription), and ZIP archives (max 20MB)
              </p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,audio/*,.zip" 
              onChange={handleFileChange}
              disabled={disabled}
            />
          </label>
        ) : (
          <form onSubmit={handleUrlSubmit} className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-zinc-300 rounded-2xl bg-zinc-50/50 p-8">
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-zinc-700 mb-2 text-center">Paste a YouTube URL to transcribe</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    disabled={disabled}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!urlInput || disabled}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        )
      ) : (
        <div className="relative flex items-center p-4 border border-zinc-200 rounded-xl bg-white shadow-sm">
          <div className="p-3 mr-4 rounded-lg bg-emerald-50 text-emerald-600">
            {selectedFile ? getFileIcon(selectedFile.type, selectedFile.name) : <LinkIcon className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate">
              {selectedFile ? selectedFile.name : urlInput}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">
              {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • ${selectedFile.name.split('.').pop()}` : 'YouTube Video'}
            </p>
          </div>
          {!disabled && (
            <button
              onClick={clearSelection}
              className="p-2 ml-4 text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};