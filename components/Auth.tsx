
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, Zap, Info, Heart, Github, Linkedin, Globe, Facebook } from 'lucide-react';
import Logo from './Logo';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Check your email for confirmation!");
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center overflow-y-auto bg-slate-950">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/40 via-slate-950 to-black pointer-events-none"></div>
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none animate-[grid-drift_10s_linear_infinite]" style={{
          backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
          backgroundSize: '100px 100px'
      }}></div>

      <div className="flex-1 flex items-center justify-center w-full p-4 relative z-10 py-10 md:py-20">
        <div className="relative w-full max-w-md animate-in zoom-in-95 duration-700">
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 rounded-[3rem] blur-2xl opacity-20"></div>
          
          <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden">
            
            <div className="flex flex-col items-center mb-8 select-none">
              <Logo size="sm" showText={false} className="mb-4" />
              <h1 className="text-2xl font-display font-bold text-white tracking-tight">
                Viz<span className="text-cyan-400">ora</span> Matrix
              </h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Initialize Security Sync</p>
            </div>

            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 mb-8">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Log In
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-400 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Secure Password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 animate-in fade-in duration-300">
                  <Info className="w-4 h-4 shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {isLogin ? 'Establish Link' : 'Register Identity'}
                {!isLoading && <ArrowRight className="w-3 h-3 ml-1" />}
              </button>
            </form>

            {/* INTEGRATED DEVELOPER CREDIT */}
            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <a href="https://github.com/MominurIslamRoby" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-white transition-all group">
                  <Github className="w-4 h-4 group-hover:scale-110" />
                </a>
                <a href="https://www.linkedin.com/in/mominur-islam-roby/" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-blue-400 transition-all group">
                  <Linkedin className="w-4 h-4 group-hover:scale-110" />
                </a>
                
                <div className="relative group mx-1">
                   <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                   <div className="relative w-12 h-12 rounded-full border-2 border-slate-800 overflow-hidden shadow-xl group-hover:scale-105 transition-transform duration-500">
                      <img 
                        src="https://lh3.googleusercontent.com/d/1bwxaJYUo25mN06Grx3QHhi-Httce3e4o" 
                        alt="Roby" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://ui-avatars.com/api/?name=Roby&background=06b6d4&color=fff";
                        }}
                      />
                   </div>
                </div>

                <a href="https://www.facebook.com/mominur.roby.00000007" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-blue-500 transition-all group">
                  <Facebook className="w-4 h-4 group-hover:scale-110" />
                </a>
                <a href="https://mominurislamroby.github.io/roby-portfolio/index.html" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-500 hover:text-cyan-400 transition-all group">
                  <Globe className="w-4 h-4 group-hover:scale-110" />
                </a>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Architected with passion by Roby</span>
                </div>
                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-[0.4em] opacity-40">© 2026 VIZORA MATRIX SYSTEM</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
