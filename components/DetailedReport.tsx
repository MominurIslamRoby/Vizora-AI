
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { 
  Sparkles, ScrollText, ChevronRight, Volume2, VolumeX, Play, Pause, 
  Loader2, Network, AlertCircle, Headphones, Waves, AudioLines, 
  UserCheck, Settings2
} from 'lucide-react';
import { synthesizeNeuralSpeech } from '../services/geminiService';

interface DetailedReportProps {
  content: string;
}

const DetailedReport: React.FC<DetailedReportProps> = ({ content }) => {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voice, setVoice] = useState<'Kore' | 'Zephyr'>('Zephyr');
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  if (!content) return null;

  const decodeAudio = async (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    // The Gemini TTS returns raw PCM data (S16_LE)
    const dataInt16 = new Int16Array(bytes.buffer.slice(0, bytes.buffer.byteLength - (bytes.buffer.byteLength % 2)));
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const handleToggleAudio = async () => {
    if (isPlaying) {
      sourceNodeRef.current?.stop();
      setIsPlaying(false);
      return;
    }

    setIsSynthesizing(true);
    setError(null);
    try {
      // Clean content for cleaner narration
      const sanitized = content
        .replace(/[#*_-]/g, ' ') 
        .replace(/!\[.*?\]\(.*?\)/g, '') 
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
        .replace(/\n+/g, ' ') 
        .replace(/\s+/g, ' ')
        .trim();

      const base64 = await synthesizeNeuralSpeech(sanitized, voice);
      const buffer = await decodeAudio(base64);
      
      const ctx = audioContextRef.current!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      
      sourceNodeRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Audio Synthesis Error:", err);
      setError("Audio Engine Sync Lost");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-xl md:text-2xl font-bold mt-8 mb-4 text-cyan-600 dark:text-cyan-400 font-display">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-2xl md:text-3xl font-bold mt-10 mb-6 text-slate-900 dark:text-slate-100 font-display">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-3xl md:text-4xl font-bold mt-12 mb-8 text-slate-950 dark:text-white border-b border-slate-200 dark:border-white/5 pb-6 font-display">{line.replace('# ', '')}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) return (
        <li key={i} className="flex gap-4 mb-3 ml-4">
          <ChevronRight className="w-5 h-5 mt-1 text-cyan-500 shrink-0 opacity-70" />
          <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{line.replace(/^[-*]\s/, '')}</span>
        </li>
      );
      if (line.trim() === '') return null;
      return <p key={i} className="mb-6 text-slate-700 dark:text-slate-400 leading-relaxed text-lg font-light">{line}</p>;
    });
  };

  return (
    <div className="w-full max-w-[1000px] mx-auto mt-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 relative">
      
      {/* Background Neural Matrix Decoration */}
      <div className="absolute inset-0 -z-10 opacity-[0.05] dark:opacity-10 pointer-events-none">
         <svg width="100%" height="100%" viewBox="0 0 1000 800" fill="none">
            <circle cx="500" cy="400" r="350" stroke="url(#neuralGradient)" strokeWidth="0.5" strokeDasharray="20 40" className="animate-[spin-slow_60s_linear_infinite]" />
            <circle cx="500" cy="400" r="200" stroke="url(#neuralGradient)" strokeWidth="0.5" strokeDasharray="10 20" className="animate-[spin-reverse_40s_linear_infinite]" />
            <defs>
              <linearGradient id="neuralGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
         </svg>
      </div>

      {/* Narrative Interface */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-12 px-6 gap-6">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl text-cyan-600 dark:text-cyan-400 shadow-xl border border-slate-200 dark:border-white/5 relative group">
             <div className="absolute inset-0 bg-cyan-400/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <ScrollText className="w-7 h-7 relative z-10" />
          </div>
          <div>
             <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-1">Knowledge Synthesis</h3>
             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">In-depth research matrix</p>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-950/40 backdrop-blur-3xl p-3 rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex items-center gap-4 shadow-xl">
          
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5">
             <Settings2 className="w-3.5 h-3.5 text-slate-400" />
             <select 
               value={voice} 
               onChange={(e) => setVoice(e.target.value as any)}
               className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:ring-0 cursor-pointer p-0"
             >
               <option value="Zephyr">Voice: Zephyr (Calm)</option>
               <option value="Kore">Voice: Kore (Vibrant)</option>
             </select>
          </div>

          <button 
            onClick={handleToggleAudio}
            disabled={isSynthesizing}
            className={`group flex items-center gap-4 px-8 py-3.5 rounded-[1.75rem] border transition-all hover:scale-[1.02] active:scale-95 shadow-lg min-w-[240px] justify-center ${
              isPlaying 
              ? 'bg-rose-500 text-white border-rose-400' 
              : 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white border-white/10'
            } disabled:opacity-50 font-bold overflow-hidden relative`}
          >
            {isSynthesizing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Headphones className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            <span className="text-[11px] font-black uppercase tracking-widest relative z-10">
              {isSynthesizing ? 'Establishing Neural Link...' : isPlaying ? 'Stop Narration' : 'Narrate Research'}
            </span>
            
            {isPlaying && (
              <div className="flex items-end gap-1 h-3 ml-2">
                 {[1,2,3,4].map(i => (
                   <div 
                    key={i} 
                    className="w-1 bg-white animate-pulse" 
                    style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.15}s` }}
                   ></div>
                 ))}
              </div>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 animate-in slide-in-from-top-4 duration-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
        </div>
      )}

      {/* Interactive Waveform Display (Simulation) */}
      {isPlaying && (
        <div className="mx-6 mb-8 px-8 py-6 bg-cyan-500/5 rounded-3xl border border-cyan-500/20 flex items-center gap-6 animate-in fade-in duration-700">
           <Waves className="w-6 h-6 text-cyan-500 animate-pulse" />
           <div className="flex-1 flex items-end gap-1.5 h-10">
              {[...Array(40)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-full"
                  style={{ 
                    height: `${30 + Math.random() * 70}%`, 
                    animation: `bar-pulse-refined 1.5s ease-in-out infinite ${i * 0.05}s` 
                  }}
                ></div>
              ))}
           </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute -top-6 -left-6 w-24 h-24 border-t border-l border-cyan-500/20 rounded-tl-[4rem] pointer-events-none"></div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 border-b border-r border-indigo-500/20 rounded-br-[4rem] pointer-events-none"></div>

        <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200/50 dark:border-white/5 p-8 md:p-16 lg:p-20 rounded-[3rem] shadow-2xl relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.02] dark:opacity-[0.05] rotate-12 pointer-events-none">
             <Network className="w-[500px] h-[500px]" />
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none relative z-10">
            {formatContent(content)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedReport;
