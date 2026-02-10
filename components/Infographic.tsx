
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { supabase } from '../services/supabase';
import { toggleWorkspaceItem } from '../services/dbService';
import { exportGenerationToPdf } from '../services/pdfService';
import { 
  Download, Sparkles, Edit3, Maximize2, X, ZoomIn, ZoomOut, 
  RefreshCcw, Share2, Check, Info, ShieldCheck, Cpu, 
  Twitter, Linkedin, Zap, Command, ChevronDown, FileImage,
  Bookmark, BookmarkCheck, Archive, Wand2, Layers, Type, Palette as PaletteIcon,
  Copy, ClipboardCheck, Share, Link as LinkIcon, Calendar, ArrowRight,
  Facebook, FileText, FileBarChart, Square, Circle, Triangle, Box, 
  Activity, Database, Network, Atom, Beaker, Brain, Cpu as CpuIcon, 
  Dna, Microscope, Rocket, Shapes, MessageSquarePlus, ALargeSmall, 
  TextCursorInput, Languages, CaseUpper
} from 'lucide-react';

interface InfographicProps {
  image: GeneratedImage;
  onEdit: (prompt: string) => void;
  isEditing: boolean;
  userId: string;
}

const QUICK_EDITS = [
  { label: "Add Labels", prompt: "Add clear, professional labels to all components of this infographic.", icon: Type },
  { label: "Make 3D", prompt: "Transform this into a high-quality 3D isometric render with depth and shadows.", icon: Layers },
  { label: "Vibrant", prompt: "Increase color saturation and contrast for a more vibrant, eye-catching look.", icon: PaletteIcon },
  { label: "Minimalist", prompt: "Simplify the design into a clean, flat minimalist aesthetic.", icon: Wand2 },
  { label: "Blueprint", prompt: "Convert this into a technical blueprint style on vintage paper.", icon: FileImage },
  { label: "Cyberpunk", prompt: "Apply a neon cyberpunk aesthetic with holographic elements and dark background.", icon: Zap },
];

const VISUAL_ELEMENTS = [
  { category: "Basic Shapes", items: [
    { name: "Square", icon: Square, prompt: "Add a sleek geometric square element to the foreground." },
    { name: "Circle", icon: Circle, prompt: "Inject a subtle circular data point marker into the composition." },
    { name: "Triangle", icon: Triangle, prompt: "Add a triangular navigational symbol matching the current style." },
    { name: "Flow Box", icon: Box, prompt: "Add a professional flowchart box to highlight a process step." },
  ]},
  { category: "Scientific", items: [
    { name: "Atom", icon: Atom, prompt: "Incorporate an atomic structure symbol into the background." },
    { name: "Beaker", icon: Beaker, prompt: "Add a laboratory beaker icon to symbolize experimental data." },
    { name: "DNA", icon: Dna, prompt: "Add a double helix DNA strand as a decorative side element." },
    { name: "Microscope", icon: Microscope, prompt: "Insert a stylized microscope icon to represent observation." },
  ]},
  { category: "Technical", items: [
    { name: "Neural", icon: Brain, prompt: "Add a neural network icon to represent intelligence or connectivity." },
    { name: "Circuit", icon: CpuIcon, prompt: "Apply a subtle integrated circuit board pattern to a section of the image." },
    { name: "Rocket", icon: Rocket, prompt: "Add a minimalist rocket symbol to signify launch or progress." },
    { name: "Network", icon: Network, prompt: "Add a node-based network graph icon to show interconnectedness." },
  ]}
];

const TEXT_TRANSFORMS = [
  { label: "Technical Font", prompt: "Change all text to a monospace technical drafting font style.", icon: CpuIcon },
  { label: "Elegant Serif", prompt: "Convert all typography to a high-end, elegant serif font.", icon: CaseUpper },
  { label: "Translate: ES", prompt: "Translate all English text in the image to Spanish.", icon: Languages },
  { label: "Translate: FR", prompt: "Translate all English text in the image to French.", icon: Languages },
  { label: "Bold Headers", prompt: "Make all primary headers significantly bolder and more prominent.", icon: Type },
  { label: "Clean Sans", prompt: "Use a clean, modern Helvetica-style sans-serif font for all labels.", icon: ALargeSmall },
];

const Infographic: React.FC<InfographicProps> = ({ image, onEdit, isEditing, userId }) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [newText, setNewText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTab, setEditTab] = useState<'prompts' | 'elements' | 'text'>('prompts');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSaved = async () => {
      const { data } = await supabase
        .from('workspace')
        .select('id')
        .eq('user_id', userId)
        .eq('vision_id', image.id)
        .single();
      setIsSaved(!!data);
    };
    if (image.id) checkSaved();
  }, [image.id, userId]);

  const handleSaveToWorkspace = async () => {
    try {
      const added = await toggleWorkspaceItem(userId, image.id);
      setIsSaved(added);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Workspace save failed:", e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim()) return;
    onEdit(editPrompt);
    setEditPrompt('');
    setIsEditMode(false);
  };

  const handleTextReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalText.trim() || !newText.trim()) return;
    const prompt = `Change the text that says "${originalText}" to "${newText}" while keeping the same position, style, and font color.`;
    onEdit(prompt);
    setOriginalText('');
    setNewText('');
    setIsEditMode(false);
  };

  const applyQuickEdit = (prompt: string) => {
    onEdit(prompt);
    setIsEditMode(false);
  };

  const handleDownload = (format: 'png' | 'jpeg' | 'webp') => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL(`image/${format}`, 0.92);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `vizora-${image.id}.${format === 'jpeg' ? 'jpg' : format}`;
      link.click();
      setShowDownloadMenu(false);
    };
    img.src = image.data;
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportGenerationToPdf(image);
      setShowDownloadMenu(false);
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch(image.data);
      const blob = await response.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  };

  const handleShareSystem = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(image.data);
      const blob = await response.blob();
      const file = new File([blob], `vizora-${image.id}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Vizora Visualization',
          text: `Check out this visualization of "${image.prompt}" on Vizora!`,
          files: [file],
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } else {
        setShowShareMenu(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setShowShareMenu(true);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyLinkSuccess(true);
      setTimeout(() => setCopyLinkSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const shareToSocial = (platform: 'twitter' | 'facebook' | 'linkedin') => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this AI-generated visualization of "${image.prompt}" on Vizora!`);
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
      case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    setShowShareMenu(false);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  const handleResetZoom = () => setZoomLevel(1);
  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setZoomLevel(1);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[1400px] mx-auto animate-in fade-in zoom-in duration-1000 px-4">
      
      <div className="relative group w-full bg-slate-100/50 dark:bg-slate-900/40 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/5 transition-all duration-700 mb-8">
        
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5 opacity-0 dark:opacity-100 pointer-events-none"></div>

        <div className="relative z-10 p-4 sm:p-8 md:p-16 lg:p-24 flex items-center justify-center">
          <div className="relative w-full max-w-[1100px] group/img">
            <div className="absolute -inset-4 bg-cyan-500/20 dark:bg-cyan-400/10 blur-3xl opacity-0 group-hover/img:opacity-100 transition-opacity duration-1000"></div>
            
            <img 
              src={image.data} 
              alt={image.prompt} 
              onClick={() => setIsFullscreen(true)}
              className="w-full h-auto object-contain max-h-[75vh] md:max-h-[85vh] rounded-2xl relative z-10 cursor-zoom-in transition-all duration-700 hover:scale-[1.015] shadow-2xl ring-1 ring-white/10 dark:brightness-[0.95] dark:contrast-[1.05]"
            />

            {/* Matrix Editor Overlay */}
            {isEditMode && (
              <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-2xl animate-in fade-in duration-300 px-4">
                <div className="w-full max-w-2xl bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] border border-white/10 scale-100 animate-in zoom-in-95 duration-300 max-h-[90%] overflow-y-auto custom-scrollbar">
                   <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Edit3 className="w-5 h-5 text-cyan-500" />
                         </div>
                         <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">Matrix Editor</h3>
                      </div>
                      <button onClick={() => setIsEditMode(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                   </div>

                   {/* Tabs for Editor */}
                   <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/5 mb-8">
                      <button 
                        onClick={() => setEditTab('prompts')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editTab === 'prompts' ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        Aesthetics
                      </button>
                      <button 
                        onClick={() => setEditTab('text')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editTab === 'text' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <ALargeSmall className="w-3.5 h-3.5" />
                        Text Refinery
                      </button>
                      <button 
                        onClick={() => setEditTab('elements')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editTab === 'elements' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <Shapes className="w-3.5 h-3.5" />
                        Visual Elements
                      </button>
                   </div>

                   {editTab === 'prompts' ? (
                     <div className="animate-in fade-in duration-500">
                        <form onSubmit={handleSubmit} className="mb-8">
                          <div className="relative group">
                            <input 
                              ref={editInputRef}
                              autoFocus
                              type="text" 
                              value={editPrompt}
                              onChange={(e) => setEditPrompt(e.target.value)}
                              placeholder="Describe structural changes..."
                              className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all pr-32"
                            />
                            <button 
                              type="submit" 
                              disabled={!editPrompt.trim() || isEditing}
                              className="absolute right-3 top-3 bottom-3 px-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50"
                            >
                              {isEditing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : "Apply"}
                            </button>
                          </div>
                        </form>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {QUICK_EDITS.map((edit, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => applyQuickEdit(edit.prompt)}
                              className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all group"
                            >
                              <edit.icon className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-cyan-500 transition-colors" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{edit.label}</span>
                            </button>
                          ))}
                        </div>
                     </div>
                   ) : editTab === 'text' ? (
                     <div className="animate-in fade-in duration-500 space-y-8">
                        <form onSubmit={handleTextReplace} className="space-y-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <TextCursorInput className="w-3 h-3" />
                                    Original Text
                                 </label>
                                 <input 
                                    type="text" 
                                    value={originalText}
                                    onChange={(e) => setOriginalText(e.target.value)}
                                    placeholder="Text to replace..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-cyan-500" />
                                    New Content
                                 </label>
                                 <input 
                                    type="text" 
                                    value={newText}
                                    onChange={(e) => setNewText(e.target.value)}
                                    placeholder="Replace with..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold"
                                 />
                              </div>
                           </div>
                           <button 
                              type="submit"
                              disabled={!originalText.trim() || !newText.trim() || isEditing}
                              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg disabled:opacity-50"
                           >
                              {isEditing ? <RefreshCcw className="w-4 h-4 animate-spin mx-auto" /> : "Modify Typography"}
                           </button>
                        </form>

                        <div>
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                              Global Text Enhancements
                           </h4>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {TEXT_TRANSFORMS.map((edit, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => applyQuickEdit(edit.prompt)}
                                  className="flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                                >
                                  <edit.icon className="w-5 h-5 text-slate-400 dark:text-slate-600 group-hover:text-purple-500 transition-colors" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{edit.label}</span>
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="animate-in fade-in duration-500 space-y-8">
                        {VISUAL_ELEMENTS.map((cat, catIdx) => (
                          <div key={catIdx}>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                               {cat.category}
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {cat.items.map((item, itemIdx) => (
                                <button 
                                  key={itemIdx} 
                                  onClick={() => applyQuickEdit(item.prompt)}
                                  className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                                >
                                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg group-hover:scale-110 transition-transform">
                                    <item.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-500" />
                                  </div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white">{item.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Controls */}
        <div className="absolute top-10 right-10 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-8 group-hover:translate-x-0 z-30">
          <button 
            onClick={() => setIsEditMode(true)}
            className={`bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl transition-all border border-slate-200 dark:border-white/10 group/btn ${isEditMode ? 'text-cyan-500 border-cyan-500/30' : 'text-slate-900 dark:text-white hover:bg-cyan-600 hover:text-white'}`}
            title="Edit Visual"
          >
            <Edit3 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => setIsFullscreen(true)}
            className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl text-slate-900 dark:text-white p-4 rounded-2xl shadow-2xl hover:bg-cyan-600 hover:text-white transition-all border border-slate-200 dark:border-white/10 group/btn"
          >
            <Maximize2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
          </button>
          <button 
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className={`bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl transition-all border border-slate-200 dark:border-white/10 group/btn ${showDownloadMenu ? 'text-cyan-500 border-cyan-500/30' : 'text-slate-900 dark:text-white hover:bg-cyan-600 hover:text-white'}`}
            title="Export Options"
          >
            <Download className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
          </button>
          <button 
            onClick={handleSaveToWorkspace}
            className={`bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl p-4 rounded-2xl shadow-2xl transition-all border border-slate-200 dark:border-white/10 group/btn ${isSaved ? 'text-amber-500 border-amber-500/30' : 'text-slate-900 dark:text-white hover:bg-amber-600 hover:text-white'}`}
          >
            {isSaved ? <BookmarkCheck className="w-6 h-6 scale-110" /> : <Bookmark className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />}
          </button>
          <button 
            onClick={handleShareSystem}
            className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl text-slate-900 dark:text-white p-4 rounded-2xl shadow-2xl hover:bg-cyan-600 hover:text-white transition-all border border-slate-200 dark:border-white/10 group/btn"
          >
            {shareSuccess ? <Check className="w-6 h-6 text-green-500" /> : <Share2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />}
          </button>
        </div>
      </div>

      {/* INTERACTIVE TIMELINE */}
      {image.timeline && image.timeline.length > 0 && (
        <div className="w-full bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-slate-200 dark:border-white/5 p-8 md:p-12 mb-16 shadow-2xl overflow-hidden relative group/timeline">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.1] pointer-events-none">
             <Calendar className="w-40 h-40" />
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 relative z-10">
             <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="p-3 bg-cyan-500/10 rounded-2xl">
                   <Calendar className="w-6 h-6 text-cyan-500" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mb-1">Chronological Matrix</h3>
                   <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Interactive scrubbable timeline</p>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Marker</span>
                <div className="px-4 py-1.5 bg-cyan-500/20 rounded-full border border-cyan-500/30 text-cyan-500 font-black text-[11px] tracking-widest">
                  {image.timeline[activeTimelineIndex].year}
                </div>
             </div>
          </div>

          <div className="relative mb-16 px-4 md:px-8">
             <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full w-full relative">
                <div 
                  className="absolute h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(activeTimelineIndex / (image.timeline.length - 1)) * 100}%` }}
                ></div>
                
                <div className="absolute top-0 left-0 w-full h-full flex justify-between items-center px-0">
                  {image.timeline.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveTimelineIndex(idx)}
                      className="group/marker relative flex flex-col items-center"
                    >
                      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                        idx === activeTimelineIndex 
                        ? 'bg-cyan-500 border-white dark:border-slate-900 scale-150 shadow-[0_0_15px_rgba(6,182,212,0.8)]' 
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 hover:scale-125 hover:border-cyan-500'
                      }`}></div>
                      
                      <div className={`absolute top-6 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                        idx === activeTimelineIndex 
                        ? 'text-cyan-500 opacity-100 -translate-y-1' 
                        : 'text-slate-400 dark:text-slate-600 opacity-0 group-hover/marker:opacity-100 group-hover/marker:translate-y-1'
                      }`}>
                        {item.year}
                      </div>
                    </button>
                  ))}
                </div>
             </div>
          </div>

          <div className="relative bg-slate-50/50 dark:bg-slate-950/40 rounded-[2rem] border border-slate-100 dark:border-white/5 p-8 md:p-10 transition-all duration-1000">
             <div key={activeTimelineIndex} className="animate-in fade-in slide-in-from-right-8 duration-700 flex flex-col md:flex-row gap-8 items-start">
                <div className="md:w-1/3 flex flex-col">
                   <div className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white tracking-tighter mb-2">
                     {image.timeline[activeTimelineIndex].year}
                   </div>
                   <div className="h-1 w-12 bg-cyan-500 rounded-full mb-6"></div>
                   <h4 className="text-xl font-display font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                     {image.timeline[activeTimelineIndex].event}
                   </h4>
                </div>
                <div className="md:w-2/3">
                   <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                     {image.timeline[activeTimelineIndex].description}
                   </p>
                   <div className="mt-8 flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                      <button 
                        onClick={() => setActiveTimelineIndex(prev => (prev + 1) % (image.timeline?.length || 1))}
                        className="group/next flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors"
                      >
                        Next Pulse <ArrowRight className="w-4 h-4 group-hover/next:translate-x-2 transition-transform" />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl -mt-12 relative z-40 px-6">
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-3xl p-4 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-white/10 flex items-center transition-all">
            <div className="pl-6 pr-4 text-cyan-500 hidden md:block">
                <Sparkles className="w-7 h-7" />
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex gap-4">
                <input
                    type="text"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe a custom modification..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 px-2 py-4 font-bold text-lg md:text-2xl transition-colors"
                    disabled={isEditing}
                />
                <button
                    type="submit"
                    disabled={isEditing || !editPrompt.trim()}
                    className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                        isEditing || !editPrompt.trim() 
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700' 
                        : 'bg-gradient-to-br from-cyan-600 to-indigo-600 text-white shadow-xl hover:brightness-110 active:scale-95'
                    }`}
                >
                    {isEditing ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </button>
            </form>
        </div>
        
        <div className="mt-12 flex flex-wrap justify-center gap-6 pb-20">
            <button 
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className={`group flex items-center gap-4 px-10 py-5 bg-white dark:bg-slate-950 rounded-3xl border transition-all hover:-translate-y-1 active:scale-95 shadow-xl font-bold uppercase text-[11px] tracking-widest border-slate-200 dark:border-white/5 hover:border-purple-500/40 text-slate-600 dark:text-slate-300`}
            >
                {isExportingPdf ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />}
                <span>{isExportingPdf ? 'Synthesizing PDF...' : 'Export Whole Report (PDF)'}</span>
            </button>

            <button 
                onClick={handleSaveToWorkspace}
                className={`group flex items-center gap-4 px-10 py-5 bg-white dark:bg-slate-950 rounded-3xl border transition-all hover:-translate-y-1 active:scale-95 shadow-xl font-bold uppercase text-[11px] tracking-widest ${
                  isSaved 
                  ? 'text-amber-500 border-amber-500/30' 
                  : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/5 hover:border-amber-500/40'
                }`}
            >
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />}
                <span>{isSaved ? 'Saved to Workspace' : 'Save to Workspace'}</span>
            </button>

            <button 
                onClick={() => { setIsEditMode(true); setEditTab('text'); }}
                className="group flex items-center gap-4 px-10 py-5 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-purple-500/40 transition-all hover:-translate-y-1 active:scale-95 shadow-xl font-bold uppercase text-[11px] tracking-widest"
            >
                <ALargeSmall className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                <span>Text Refinery Matrix</span>
            </button>

            <button 
                onClick={handleCopyToClipboard}
                className={`group flex items-center gap-4 px-10 py-5 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/5 transition-all hover:-translate-y-1 active:scale-95 shadow-xl font-bold uppercase text-[11px] tracking-widest ${copySuccess ? 'text-green-500 border-green-500/30' : 'text-slate-600 dark:text-slate-300 hover:border-cyan-500/40'}`}
            >
                {copySuccess ? <ClipboardCheck className="w-5 h-5" /> : <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                <span>{copySuccess ? 'Copied to Clipboard' : 'Copy Image'}</span>
            </button>

            <div className="relative" ref={shareMenuRef}>
              <button 
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="group flex items-center gap-4 bg-white dark:bg-slate-950 px-10 py-5 rounded-3xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40 transition-all hover:-translate-y-1 active:scale-95 shadow-xl font-bold uppercase text-[11px] tracking-widest"
              >
                  {shareSuccess ? <Check className="w-5 h-5 text-green-500" /> : <Share className="w-5 h-5 text-cyan-500 group-hover:rotate-12 transition-transform" />}
                  <span>{shareSuccess ? 'Shared!' : 'Share Vision'}</span>
                  <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-500 ${showShareMenu ? 'rotate-180' : ''}`} />
              </button>
              {showShareMenu && (
                <div className="absolute left-0 bottom-full mb-6 w-72 bg-white dark:bg-slate-900 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Social Pulse</span>
                  </div>
                  <div className="p-2 grid grid-cols-1 gap-1">
                    {[
                      { id: 'twitter', label: 'Share to Twitter', icon: Twitter, color: 'text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/40' },
                      { id: 'facebook', label: 'Share to Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/40' },
                      { id: 'linkedin', label: 'Share to LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-200 dark:bg-blue-900/40' },
                      { id: 'copy_link', label: copyLinkSuccess ? 'Link Copied!' : 'Copy Page Link', icon: copyLinkSuccess ? Check : LinkIcon, color: copyLinkSuccess ? 'text-green-500' : 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' }
                    ].map((platform) => (
                      <button 
                        key={platform.id} 
                        onClick={() => platform.id === 'copy_link' ? handleCopyLink() : shareToSocial(platform.id as any)} 
                        className="w-full text-left px-4 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-2xl flex items-center gap-4 group/item"
                      >
                        <div className={`p-2.5 rounded-xl transition-transform group-hover/item:scale-110 ${platform.bg} ${platform.color}`}>
                          <platform.icon className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{platform.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={downloadMenuRef}>
              <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="group flex items-center gap-4 bg-white dark:bg-slate-950 px-10 py-5 rounded-3xl border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40 transition-all hover:-translate-y-1 active:scale-95 shadow-xl font-bold uppercase text-[11px] tracking-widest"
              >
                  <Download className="w-5 h-5 text-cyan-500 group-hover:translate-y-1 transition-transform" />
                  <span>Export Vision</span>
                  <ChevronDown className={`w-4 h-4 opacity-50 transition-transform duration-500 ${showDownloadMenu ? 'rotate-180' : ''}`} />
              </button>
              {showDownloadMenu && (
                <div className="absolute left-0 bottom-full mb-6 w-72 bg-white dark:bg-slate-900 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Export Matrix Formats</span>
                  </div>
                  <div className="p-2 grid grid-cols-1 gap-1">
                    {[
                      { id: 'pdf', label: 'Full Research Report (PDF)', sub: 'Complete Generation', icon: FileBarChart, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/40' },
                      { id: 'png', label: 'PNG Image', sub: 'Lossless quality', icon: FileImage, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
                      { id: 'jpeg', label: 'JPG Image', sub: 'Compressed size', icon: FileImage, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/40' },
                      { id: 'webp', label: 'WebP Image', sub: 'Next-gen format', icon: FileImage, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/40' }
                    ].map((fmt) => (
                      <button 
                        key={fmt.id} 
                        onClick={() => fmt.id === 'pdf' ? handleExportPdf() : handleDownload(fmt.id as any)} 
                        className="w-full text-left px-4 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-2xl flex items-center gap-4 group/item"
                      >
                        <div className={`p-2.5 rounded-xl transition-transform group-hover/item:scale-110 ${fmt.bg} ${fmt.color}`}>
                          <fmt.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{fmt.label}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{fmt.sub}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>
      
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-100/98 dark:bg-slate-950/98 backdrop-blur-3xl flex flex-col animate-in fade-in duration-500">
            <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
                <div className="flex flex-col">
                   <h2 className="text-slate-900 dark:text-white font-display font-bold text-2xl tracking-tighter">Detailed Analysis View</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{image.prompt}</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-xl">
                        <button onClick={handleZoomOut} className="p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-slate-800 dark:text-slate-200 transition-all hover:scale-110 active:scale-90" title="Decrease Magnification">
                            <ZoomOut className="w-6 h-6" />
                        </button>
                        <div className="px-4 border-l border-r border-slate-200 dark:border-white/5">
                           <button onClick={handleResetZoom} className="text-sm font-black text-slate-800 dark:text-slate-200 hover:text-cyan-500 transition-colors">
                               {Math.round(zoomLevel * 100)}%
                           </button>
                        </div>
                        <button onClick={handleZoomIn} className="p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl text-slate-800 dark:text-slate-200 transition-all hover:scale-110 active:scale-90" title="Increase Magnification">
                            <ZoomIn className="w-6 h-6" />
                        </button>
                    </div>

                    <button 
                        onClick={handleCloseFullscreen}
                        className="p-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl hover:rotate-90 active:scale-90"
                    >
                        <X className="w-7 h-7" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-12 lg:p-24 bg-dots">
                <img 
                    src={image.data} 
                    alt={image.prompt}
                    style={{ 
                        transform: `scale(${zoomLevel})`,
                        transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                    className="max-w-full max-h-full object-contain shadow-[0_60px_120px_rgba(0,0,0,0.5)] rounded-2xl origin-center ring-1 ring-white/10"
                />
            </div>
        </div>
      )}
    </div>
  );
};

export default Infographic;
