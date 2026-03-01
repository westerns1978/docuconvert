import React, { useState } from 'react';
import { MapPin, Loader2, ExternalLink, Navigation, Map } from 'lucide-react';
import Markdown from 'react-markdown';
import { askLocationAssistant, LocationResponse } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface LocationAssistantProps {
  documentContext: string;
}

export const LocationAssistant: React.FC<LocationAssistantProps> = ({ documentContext }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<LocationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{latitude: number, longitude: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setIsLocating(false);
        },
        (err) => {
          console.error(err);
          setError("Could not get your location. Please ensure permissions are granted.");
          setIsLocating(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    
    try {
      const res = await askLocationAssistant(documentContext, query, userLoc || undefined);
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to get location info.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100 bg-emerald-50/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">Location & Maps Assistant</h3>
              <p className="text-sm text-zinc-500">Find places mentioned in the document or nearby locations.</p>
            </div>
          </div>
          <button
            onClick={handleGetLocation}
            disabled={isLocating || userLoc !== null}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              userLoc 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
            {userLoc ? 'Location Active' : 'Use My Location'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Where are the restaurants mentioned in the text?"
            className="w-full pl-4 pr-32 py-3 rounded-xl border border-zinc-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            Find
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
            <div className="prose prose-zinc max-w-none prose-sm sm:prose-base prose-a:text-emerald-600">
              <Markdown>{result.text}</Markdown>
            </div>
            
            {result.places.length > 0 && (
              <div className="mt-6 pt-6 border-t border-zinc-100">
                <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  Places from Google Maps
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.places.map((place, idx) => (
                    <a
                      key={idx}
                      href={place.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                      <span className="max-w-[200px] truncate">{place.title}</span>
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
