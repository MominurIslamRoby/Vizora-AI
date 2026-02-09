
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { SearchResultItem } from '../types';
import { ExternalLink, BookOpen, Link as LinkIcon } from 'lucide-react';

interface SearchResultsProps {
  results: SearchResultItem[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="w-full max-w-[1400px] mx-auto mt-24 md:mt-40 animate-in fade-in slide-in-from-bottom-12 duration-1000 px-4">
      <div className="flex items-center justify-between mb-12 border-t border-slate-200 dark:border-white/5 pt-16">
        <div className="flex items-center gap-6">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 text-cyan-600 dark:text-cyan-400 shadow-xl">
                <BookOpen className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-1">Grounded References</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Verified knowledge sources from the web</p>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {results.map((result, index) => (
          <a 
            key={index} 
            href={result.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group relative flex flex-col p-8 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-white/5 rounded-[2.5rem] hover:border-cyan-500/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2"
          >
            {/* Hover Accent Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-indigo-500/0 group-hover:from-cyan-500/5 group-hover:to-indigo-500/5 transition-all duration-700"></div>
            
            <div className="flex items-start justify-between gap-6 mb-8 relative z-10">
               <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight text-lg">
                 {result.title}
               </h4>
               <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm">
                  <ExternalLink className="w-4 h-4" />
               </div>
            </div>
            
            <div className="mt-auto flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                  <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                    <LinkIcon className="w-3.5 h-3.5 text-cyan-500/70" />
                  </div>
                  <span className="truncate max-w-[140px] opacity-70 group-hover:opacity-100 transition-opacity">
                    {(() => {
                      try {
                        return new URL(result.url).hostname.replace('www.', '');
                      } catch {
                        return 'Verified Source';
                      }
                    })()}
                  </span>
                </div>
                <span className="text-[9px] font-black text-slate-200 dark:text-slate-800 uppercase tracking-tighter transition-colors group-hover:text-cyan-500/40">REF_{index + 1}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
