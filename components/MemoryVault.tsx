
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { getMemory } from '../services/memoryService';
import { fetchWorkspaceVisions, toggleWorkspaceItem } from '../services/dbService';
import { X, BrainCircuit, Trash2, History, CheckCircle2, Zap, Bookmark, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { GeneratedImage } from '../types';

interface MemoryVaultProps {
  onClose: () => void;
  onReset: () => void;
  onRestoreVision?: (vision: GeneratedImage) => void;
  userId: string;
}

const MemoryVault: React.FC<MemoryVaultProps> = ({ onClose, onReset, onRestoreVision, userId }) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'workspace'>('knowledge');
  const [workspaceVisions, setWorkspaceVisions] = useState<GeneratedImage[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);
  const memory = getMemory();

  useEffect(() => {
    if (activeTab === 'workspace') {
      loadWorkspace();
    }
  }, [activeTab]);

  const loadWorkspace = async () => {
    setIsLoadingWorkspace(true);
    try {
      const data = await fetchWorkspaceVisions(userId);
      setWorkspaceVisions(data);
    } catch (e) {
      console.error("Failed to fetch cloud workspace:", e);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const handleRemoveVision = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleWorkspaceItem(userId, id);
      setWorkspaceVisions(prev => prev.filter(v => v.id !== id));
    } catch (e) {
      console.error("Failed to remove from cloud workspace:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-2xl">
                <BrainCircuit className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Neural Memory Vault</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grounded continuity & archives</p>
              </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-white/5">
            <button 
              onClick={() => setActiveTab('knowledge')}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'knowledge' 
                ? 'bg-white dark:bg-slate-950 text-cyan-600 dark:text-cyan-400 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Knowledge Graph
            </button>
            <button 
              onClick={() => setActiveTab('workspace')}
              className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'workspace' 
                ? 'bg-white dark:bg-slate-950 text-amber-500 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              Vision Workspace
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar min-h-[400px]">
          
          {activeTab === 'knowledge' ? (
            <div className="animate-in fade-in duration-500">
              {/* Preferred Level Badge */}
              <div className="mb-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Zap className="w-5 h-5 text-cyan-500" />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inferred Preferred Depth</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{memory.preferredLevel}</p>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-cyan-500/10 rounded-full text-cyan-500 text-[10px] font-black uppercase tracking-widest">Active Profile</div>
              </div>

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                <History className="w-4 h-4" />
                Knowledge Graph ({memory.knowledgeGraph.length})
              </h3>

              <div className="space-y-4">
                {memory.knowledgeGraph.length === 0 ? (
                  <div className="text-center py-20 opacity-40">
                    <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="italic text-sm">Neural vault is currently empty.</p>
                  </div>
                ) : (
                  memory.knowledgeGraph.map((entry, i) => (
                    <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5 rounded-3xl transition-all hover:border-cyan-500/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-display font-bold text-slate-900 dark:text-white">{entry.topic}</h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.level}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {entry.concepts.slice(0, 8).map((c, j) => (
                          <div key={j} className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 rounded-full border border-slate-100 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ).reverse()}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Saved Visions ({workspaceVisions.length})
                  </h3>
              </div>

              {isLoadingWorkspace ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                   <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing Cloud Matrix...</p>
                </div>
              ) : workspaceVisions.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 dark:bg-slate-950/40 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10">
                  <Bookmark className="w-12 h-12 mx-auto mb-4 opacity-10 text-amber-500" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic">No saved visions in your workspace.</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Click the bookmark icon on any infographic to save it to your account.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {workspaceVisions.map((vision) => (
                    <div 
                      key={vision.id}
                      className="group relative bg-white dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all hover:border-amber-500/30"
                    >
                      <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                         <img src={vision.data} alt={vision.prompt} className="w-full h-full object-cover dark:opacity-80 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <button 
                              onClick={() => onRestoreVision?.(vision)}
                              className="w-full py-2 bg-white dark:bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 hover:text-white transition-all shadow-lg"
                            >
                               <RefreshCw className="w-3 h-3" />
                               Restore Vision
                            </button>
                         </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate flex-1 uppercase tracking-tight">{vision.prompt}</h5>
                          <button 
                            onClick={(e) => handleRemoveVision(vision.id, e)}
                            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{vision.level}</span>
                           <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                           <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{vision.style}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-slate-100 dark:border-white/5 flex justify-end">
          {activeTab === 'knowledge' ? (
            <button 
              onClick={onReset}
              className="flex items-center gap-3 px-8 py-4 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest border border-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Clear Neural Memory
            </button>
          ) : (
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Vision Matrix Secure • Persistent Cloud storage</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryVault;
