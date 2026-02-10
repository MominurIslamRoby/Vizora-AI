
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { GeneratedImage, ComplexityLevel, VisualStyle, Language, SearchResultItem, AspectRatio } from './types';
import { 
  researchTopicForPrompt, 
  generateInfographicImage, 
  editInfographicImage,
} from './services/geminiService';
import { updateMemoryFromResearch, resetMemory } from './services/memoryService';
import { supabase, signOut } from './services/supabase';
import { saveVisionToDb, fetchUserVisions, clearArchivesFromDb, deleteVision } from './services/dbService';
import Auth from './components/Auth';
import Infographic from './components/Infographic';
import Loading from './components/Loading';
import SearchResults from './components/SearchResults';
import DetailedReport from './components/DetailedReport';
import Logo from './components/Logo';
import { 
  Search, AlertCircle, History, GraduationCap, Palette, Microscope, 
  Compass, Sun, Moon, Heart, LayoutTemplate, Globe, Zap, Trash2,
  Facebook, Github, Linkedin, BrainCircuit, ChevronDown, LogOut, User as UserIcon,
  Loader2, Info
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [complexityLevel, setComplexityLevel] = useState<ComplexityLevel>('High School');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('Default');
  const [language, setLanguage] = useState<Language>('English');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isDeepDive, setIsDeepDive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [loadingFacts, setLoadingFacts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [currentSearchResults, setCurrentSearchResults] = useState<SearchResultItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) await loadHistory(session.user.id);
      setIsInitialLoading(false);
    };
    initializeAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadHistory(session.user.id);
      else setImageHistory([]);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadHistory = async (userId: string) => {
    try {
      const history = await fetchUserVisions(userId);
      setImageHistory(history);
    } catch (err) { console.error("History load error:", err); }
  };

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !topic.trim()) {
      if (!topic.trim()) setError("Please enter a topic to visualize.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setLoadingStep(1);
    setLoadingFacts([]);
    setCurrentSearchResults([]);
    setLoadingMessage(isDeepDive ? `Deep Reasoning in progress...` : `Exploring the Vizora universe...`);

    try {
      const researchResult = await researchTopicForPrompt(topic, complexityLevel, visualStyle, language, isDeepDive);
      updateMemoryFromResearch(topic, complexityLevel, researchResult.facts);
      setLoadingFacts(researchResult.facts);
      setCurrentSearchResults(researchResult.searchResults);
      
      setLoadingStep(2);
      setLoadingMessage(`Synthesizing Visuals...`);
      let base64Data = await generateInfographicImage(researchResult.imagePrompt, aspectRatio);
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        data: base64Data,
        prompt: topic,
        timestamp: Date.now(),
        level: complexityLevel,
        style: visualStyle,
        language: language,
        detailedSummary: researchResult.detailedSummary,
        timeline: researchResult.timeline,
        isDeepDive
      };

      if (session?.user?.id) {
        try {
          const dbVision = await saveVisionToDb(newImage, session.user.id);
          newImage.id = dbVision.id;
        } catch (dbErr) { console.warn("Cloud sync deferred:", dbErr); }
      }
      setImageHistory([newImage, ...imageHistory]);
    } catch (err: any) {
      let userFriendlyMessage = 'Synthesis Disrupted: Neural link lost.';
      if (err.message?.includes('API_KEY_MISSING')) {
        userFriendlyMessage = 'Configuration Error: API variables not synced. Ensure you have triggered a new deploy on Netlify after adding the API_KEY.';
      } else if (err.status === 429) {
        userFriendlyMessage = 'System Overloaded: Rate limit reached.';
      } else if (err.message) {
        userFriendlyMessage = `Engine Error: ${err.message}`;
      }
      setError(userFriendlyMessage);
    } finally {
      setIsLoading(false);
      setLoadingStep(0);
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (imageHistory.length === 0) return;
    const currentImage = imageHistory[0];
    setIsLoading(true);
    setError(null);
    setLoadingStep(2);
    setLoadingMessage(`Refining Matrix: "${editPrompt}"...`);
    try {
      const base64Data = await editInfographicImage(currentImage.data, editPrompt, aspectRatio);
      const newImage: GeneratedImage = { ...currentImage, id: Date.now().toString(), data: base64Data, prompt: editPrompt, timestamp: Date.now() };
      if (session?.user?.id) await saveVisionToDb(newImage, session.user.id);
      setImageHistory([newImage, ...imageHistory]);
    } catch (err: any) { setError(`Modification failed: ${err.message}`); }
    finally { setIsLoading(false); setLoadingStep(0); }
  };

  const restoreImage = (img: GeneratedImage) => {
    setImageHistory([img, ...imageHistory.filter(i => i.id !== img.id)]);
  };

  const handleClearHistory = async () => {
    if (imageHistory.length <= 1) return;
    if (confirm("Clear archived visions?")) {
      const currentVision = imageHistory[0];
      try {
        setImageHistory([currentVision]);
        if (session?.user?.id && currentVision.id) await clearArchivesFromDb(session.user.id, currentVision.id);
      } catch (err) { setError("Sync failed."); }
    }
  };

  const handlePageRefresh = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setTopic('');
    setImageHistory([]);
    setCurrentSearchResults([]);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isInitialLoading) return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-6">
      <Logo size="md" showText={false} className="animate-pulse" />
      <div className="flex items-center gap-3 text-cyan-500 font-black uppercase tracking-[0.3em] text-[10px]">
        <Loader2 className="w-5 h-5 animate-spin" /> Syncing Neural Session...
      </div>
    </div>
  );

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-cyan-500 selection:text-white pb-2 relative overflow-x-hidden transition-colors">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white dark:from-slate-900/60 dark:via-slate-950 dark:to-black z-0"></div>
      <header className="border-b border-slate-200 dark:border-white/5 sticky top-0 z-50 backdrop-blur-xl bg-white/60 dark:bg-slate-950/40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 group cursor-pointer active:scale-95 transition-all" onClick={handlePageRefresh}>
            <Logo size="sm" showText={false} className="group-hover:rotate-12 transition-transform duration-500" />
            <div className="flex flex-col">
                <span className="font-display font-bold text-lg md:text-2xl tracking-tight">Viz<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400">ora</span></span>
                <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">AI Grounded Knowledge</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
              <button onClick={() => setIsMemoryOpen(!isMemoryOpen)} className={`p-3 rounded-2xl border transition-all ${isMemoryOpen ? 'bg-cyan-500 text-white' : 'bg-white/50 dark:bg-slate-900/50 dark:border-white/10'}`}><BrainCircuit className="w-5 h-5" /></button>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 dark:border-white/10"><Sun className="w-5 h-5" /></button>
              <button onClick={() => signOut()} className="p-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 dark:border-white/10 hover:bg-rose-500 hover:text-white transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>
      <main className="px-4 sm:px-8 py-6 md:py-12 relative z-10 min-h-[calc(100vh-160px)]">
        <div className={`max-w-[1300px] mx-auto transition-all duration-1000 ${imageHistory.length > 0 ? 'mb-8' : 'min-h-[60vh] flex flex-col justify-center'}`}>
          {!imageHistory.length && (
            <div className="text-center mb-12 space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <h1 className="text-4xl sm:text-6xl md:text-9xl font-display font-bold tracking-tighter leading-[0.9]">Visualize the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400">Knowledge.</span></h1>
              <p className="text-sm md:text-2xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-light">Research-backed infographics generated with live search grounding.</p>
            </div>
          )}
          <form onSubmit={handleGenerate} className={`relative z-20 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="relative bg-white/95 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200 dark:border-white/10 p-3 rounded-[2.5rem] shadow-2xl">
                <div className="relative flex items-center px-4">
                    <Search className="absolute left-8 w-6 h-6 text-slate-300" />
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Search a topic..." className="w-full pl-14 md:pl-20 pr-6 py-4 md:py-8 bg-transparent border-none outline-none text-xl md:text-3xl font-bold" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-white/5 px-4 py-3 flex items-center gap-3">
                      <GraduationCap className="w-5 h-5 text-indigo-500" />
                      <select value={complexityLevel} onChange={(e) => setComplexityLevel(e.target.value as any)} className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 appearance-none">
                        <option value="Elementary">Elementary School</option>
                        <option value="High School">High School</option>
                        <option value="College">University</option>
                        <option value="Expert">Domain Expert</option>
                      </select>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-white/5 px-4 py-3 flex items-center gap-3">
                      <Palette className="w-5 h-5 text-rose-500" />
                      <select value={visualStyle} onChange={(e) => setVisualStyle(e.target.value as any)} className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 appearance-none">
                        <option value="Default">Scientific Chart</option>
                        <option value="Minimalist">Minimalist Flat</option>
                        <option value="Realistic">Realistic Photos</option>
                        <option value="Futuristic">Neon Holographic</option>
                        <option value="3D Render">3D Isometric</option>
                      </select>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-white/5 px-4 py-3 flex items-center gap-3">
                      <LayoutTemplate className="w-5 h-5 text-cyan-500" />
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 appearance-none">
                        <option value="16:9">Landscape (16:9)</option>
                        <option value="1:1">Square (1:1)</option>
                        <option value="9:16">Portrait (9:16)</option>
                      </select>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-white/5 px-4 py-3 flex items-center gap-3">
                      <Globe className="w-5 h-5 text-amber-500" />
                      <select value={language} onChange={(e) => setLanguage(e.target.value as any)} className="w-full bg-transparent border-none text-sm font-bold focus:ring-0 appearance-none">
                        <option value="English">English</option>
                        <option value="Spanish">Español</option>
                        <option value="French">Français</option>
                        <option value="Mandarin">中文</option>
                      </select>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <button type="button" onClick={() => setIsDeepDive(!isDeepDive)} className={`flex items-center gap-2 px-4 py-3 rounded-2xl transition-all border ${isDeepDive ? 'bg-purple-600/10 border-purple-500 text-purple-500' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400'}`}>
                      <Zap className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Deep Dive</span>
                    </button>
                    <button type="submit" disabled={isLoading} className="flex-1 sm:min-w-[200px] h-[58px] rounded-2xl font-bold tracking-widest bg-gradient-to-br from-indigo-600 to-slate-950 dark:from-cyan-600 dark:to-indigo-900 text-white uppercase text-xs flex items-center justify-center gap-2 px-6">
                        <Microscope className="w-4 h-4" /> <span>Generate Vision</span>
                    </button>
                </div>
            </div>
          </form>
        </div>
        {isLoading && <Loading status={loadingMessage} step={loadingStep} facts={loadingFacts} />}
        {error && (
          <div className="max-w-3xl mx-auto mt-12 p-8 bg-white dark:bg-slate-900 border-2 border-rose-500/30 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-rose-500/10 rounded-2xl"><AlertCircle className="w-8 h-8 text-rose-500" /></div>
              <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Synthesis Disrupted</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-medium">{error}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleGenerate({ preventDefault: () => {} } as any)} className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Retry Connection</button>
                    <div className="flex items-center gap-2 text-slate-400"><Info className="w-3.5 h-3.5" /><span className="text-[9px] font-bold uppercase tracking-widest">Verification Required: Trigger a new Netlify deploy</span></div>
                  </div>
              </div>
            </div>
          </div>
        )}
        {imageHistory.length > 0 && !isLoading && (
            <div className="space-y-16">
                <Infographic image={imageHistory[0]} onEdit={handleEdit} isEditing={isLoading} userId={session.user.id} />
                <DetailedReport content={imageHistory[0].detailedSummary || ''} />
                <SearchResults results={currentSearchResults} />
            </div>
        )}

        {imageHistory.length > 1 && (
            <div className="max-w-[1600px] mx-auto mt-24 md:mt-40 border-t border-slate-200 dark:border-white/5 pt-16">
                <div className="flex items-center justify-between mb-12 px-4">
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] flex items-center gap-3">
                        <History className="w-4 h-4" />
                        Archived Vision Matrix
                    </h3>
                    <button 
                      onClick={handleClearHistory}
                      className="group flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 transition-colors bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-white/5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Clear Archives</span>
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8 px-4 pb-12">
                    {imageHistory.slice(1).map((img) => (
                        <div 
                            key={img.id} 
                            onClick={() => restoreImage(img)}
                            className="group relative cursor-pointer rounded-[2rem] overflow-hidden border border-slate-200 dark:border-white/5 transition-all duration-500 shadow-lg bg-white dark:bg-slate-900/40 backdrop-blur-sm"
                        >
                            <img src={img.data} alt={img.prompt} className="w-full aspect-video object-cover dark:opacity-70 group-hover:opacity-100 transition-all duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent p-6 flex flex-col justify-end">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[10px] text-white font-bold truncate tracking-wider uppercase">{img.prompt}</p>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); deleteVision(img.id).then(() => setImageHistory(prev => prev.filter(i => i.id !== img.id))); }}
                                    className="p-1.5 bg-black/40 hover:bg-rose-600 rounded-lg text-white/50 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </main>

      <footer className="relative z-10 w-full py-16 border-t border-slate-200 dark:border-white/5 mt-32 bg-white/40 dark:bg-slate-950/20 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
          
          <div className="flex flex-col gap-2 order-2 md:order-1">
             <div 
               className="flex items-center gap-3 justify-center md:justify-start cursor-pointer group active:scale-95 transition-all duration-300"
               onClick={handlePageRefresh}
             >
                <Logo size="sm" showText={false} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                <span className="font-display font-bold text-xl text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Vizora</span>
             </div>
             <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.4em]">Knowledge Mapping Redefined</p>
          </div>

          <div className="flex items-center justify-center order-1 md:order-2">
            <div className="flex items-center gap-3 md:gap-4 bg-slate-100/30 dark:bg-slate-950/60 backdrop-blur-3xl px-6 md:px-8 py-4 md:py-6 rounded-[3.5rem] border border-slate-200/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.5)] transition-all">
              <a href="https://www.facebook.com/mominur.roby.00000007" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl md:rounded-3xl bg-slate-900/90 border border-white/5 text-slate-400 hover:text-blue-500 transition-all hover:border-white/20 shadow-inner group">
                <Facebook className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
              </a>
              <a href="https://github.com/MominurIslamRoby" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl md:rounded-3xl bg-slate-900/90 border border-white/5 text-slate-400 hover:text-white transition-all hover:border-white/20 shadow-inner group">
                <Github className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
              </a>
              <div className="mx-3 md:mx-6 relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-full opacity-30 blur-md group-hover:opacity-60 transition-opacity"></div>
                <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-slate-900 dark:border-slate-800 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-105 duration-500">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1bwxaJYUo25mN06Grx3QHhi-Httce3e4o" 
                    alt="Developer Signature" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Roby&background=06b6d4&color=fff";
                    }}
                  />
                </div>
              </div>
              <a href="https://www.linkedin.com/in/mominur-islam-roby/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl md:rounded-3xl bg-slate-900/90 border border-white/5 text-slate-400 hover:text-blue-400 transition-all hover:border-white/20 shadow-inner group">
                <Linkedin className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
              </a>
              <a href="https://mominurislamroby.github.io/roby-portfolio/index.html" target="_blank" rel="noopener noreferrer" className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl md:rounded-3xl bg-slate-900/90 border border-white/5 text-slate-400 hover:text-cyan-400 transition-all hover:border-white/20 shadow-inner group">
                <Globe className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          <div className="text-center md:text-right order-3">
             <div className="flex items-center justify-center md:justify-end gap-2 mb-1">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Built with passion & love</span>
             </div>
             <p className="text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.5em]">© 2026 VIZORA • Mominur Islam Roby </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
