
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Play, Activity, Database, Network, Heart, Zap } from 'lucide-react';
import Logo from './Logo';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0); 
  // 0: Initial Core Pulsation
  // 1: Data Stream Extraction
  // 2: Matrix Reveal (HUD Card)
  // 3: Interface Ready (Branding + Button)

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 600);
    const timer2 = setTimeout(() => setPhase(2), 1800);
    const timer3 = setTimeout(() => setPhase(3), 3200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleEnter = () => {
    onComplete();
  };

  const strands = Array.from({ length: 24 });

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center overflow-y-auto overflow-x-hidden font-display transition-all duration-1000">
      <style>{`
        @keyframes data-extract {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          20% { opacity: 1; }
          100% { transform: translateY(-200px) scale(1.5); opacity: 0; }
        }
        @keyframes scan-line {
          0% { top: -20%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 120%; opacity: 0; }
        }
        @keyframes floating-card {
          0%, 100% { transform: translateY(0) rotateX(0deg); }
          50% { transform: translateY(-10px) rotateX(2deg); }
        }
        @keyframes grid-drift {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes bar-pulse-refined {
          0%, 100% { height: 20%; opacity: 0.3; }
          50% { height: 90%; opacity: 1; }
        }
        @keyframes radial-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        .cubic-bezier-fluid {
          transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
        }
      `}</style>

      {/* Dynamic Background */}
      <div className="fixed inset-0 opacity-[0.05] pointer-events-none animate-[grid-drift_10s_linear_infinite]" style={{
          backgroundImage: `linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
      }}></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-black pointer-events-none"></div>
      
      {/* Ambience Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] animate-[radial-pulse_8s_infinite]"></div>
      </div>

      <div className="h-12 md:h-20 shrink-0"></div>

      {/* CENTRAL VISUAL CONTAINER */}
      <div className="relative flex flex-col items-center justify-center w-full max-w-lg px-4 flex-1">
        
        {/* PHASE 0-1: BRANDED LOGO CORE */}
        <div className={`absolute transition-all duration-1000 cubic-bezier-fluid ${phase >= 2 ? 'opacity-0 -translate-y-32 scale-50 blur-lg' : 'opacity-100 translate-y-0 scale-100'}`}>
          <div className="relative">
            <Logo size="xl" showText={false} />
            
            {/* Data Extraction Strands */}
            {phase >= 1 && strands.map((_, i) => (
              <div key={i} className="absolute left-1/2 top-1/2 w-0 h-0" style={{ transform: `rotate(${i * (360 / strands.length)}deg)` }}>
                 <div className="absolute w-[2px] h-[2px] bg-white rounded-full shadow-[0_0_15px_cyan]" style={{ animation: `data-extract 2.5s ease-out infinite ${i * 0.08}s` }}>
                   <div className="w-[1px] h-32 bg-gradient-to-t from-cyan-400 to-transparent absolute bottom-0 left-1/2 -translate-x-1/2"></div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* PHASE 2: HUD STATUS MATRIX (CARD) */}
        <div className={`transition-all duration-1000 cubic-bezier-fluid ${phase >= 2 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-20 blur-md'}`}>
           <div className={`relative w-64 h-80 md:w-72 md:h-96 bg-slate-900/60 backdrop-blur-3xl border border-cyan-500/20 rounded-[3rem] shadow-[0_0_120px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col items-center ring-1 ring-white/10 ${phase === 2 ? 'animate-[floating-card_6s_ease-in-out_infinite]' : ''}`}>
              
              <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
                <svg width="100%" height="100%">
                  <pattern id="hex-intro-refined" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M20 0L37.3205 10V30L20 40L2.67949 30V10L20 0Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-cyan-400" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#hex-intro-refined)" />
                </svg>
              </div>

              {/* Enhanced Scan Line */}
              <div className="absolute w-full h-24 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-[scan-line_3s_linear_infinite] pointer-events-none z-20"></div>

              <div className="mt-12 relative z-10 flex items-center justify-center">
                <Logo size="sm" showText={false} className="animate-pulse" />
              </div>

              {/* Data Visualizer Bars */}
              <div className="flex items-end gap-1.5 h-12 mt-12 z-10">
                 {[...Array(12)].map((_, i) => (
                   <div key={i} className="w-1.5 bg-gradient-to-t from-indigo-500/80 to-cyan-400 rounded-full" style={{ animation: `bar-pulse-refined 1.5s ease-in-out infinite ${i * 0.1}s` }}></div>
                 ))}
              </div>

              <div className="mt-10 font-mono text-[10px] text-cyan-400/80 uppercase tracking-[0.25em] text-center px-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
                  <span>SYNTHESIZING_NODE</span>
                </div>
                <div className="font-bold flex items-center justify-center gap-1.5 bg-cyan-500/10 py-1 rounded-full px-4 border border-cyan-500/20">
                  <span className="text-white/90">VIZORA_OS_BETA</span>
                  <span className="w-1.5 h-3.5 bg-cyan-500 animate-[pulse_0.8s_infinite]"></span>
                </div>
              </div>
              
              <div className="absolute bottom-6 inset-x-8 flex justify-between items-center opacity-40">
                 <Database className="w-4 h-4 text-cyan-400" />
                 <div className="flex-1 mx-4 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                 <Network className="w-4 h-4 text-cyan-400" />
              </div>
           </div>
        </div>

        {/* PHASE 3: STAGGERED BRANDING AND START BUTTON */}
        <div className="mt-12 flex flex-col items-center w-full">
           <div className={`transition-all duration-1000 cubic-bezier-fluid delay-100 ${phase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 blur-sm'}`}>
              <Logo size="md" showText={true} />
           </div>
           
           <div className={`transition-all duration-1000 cubic-bezier-fluid delay-300 ${phase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 blur-sm'}`}>
             <button 
                onClick={handleEnter}
                className="group relative px-14 py-5 bg-transparent overflow-hidden rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(6,182,212,0.15)] hover:shadow-[0_0_80px_rgba(6,182,212,0.3)] mt-8 ring-1 ring-white/10"
             >
                {/* Button Internal Shimmer */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-600 via-indigo-600 to-blue-700 opacity-20 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-45 group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                
                <div className="relative flex items-center gap-5">
                    <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400 group-hover:animate-bounce" />
                    <span className="text-white font-black tracking-[0.3em] text-xs transition-all uppercase group-hover:tracking-[0.4em]">Initialize Vision</span>
                    <Play className="w-4 h-4 text-white fill-current transition-transform group-hover:translate-x-1" />
                </div>
             </button>
           </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={`mt-auto pt-16 pb-12 transition-all duration-1000 cubic-bezier-fluid delay-500 ${phase === 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10 shadow-2xl">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.35em] whitespace-nowrap">Neural Architect</span>
          <span className="font-display font-bold text-sm text-cyan-400 tracking-widest hover:text-white transition-colors cursor-default">Roby</span>
          <div className="flex items-center">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-[pulse_1.5s_infinite]" />
          </div>
        </div>
      </div>

      {/* Skip Button */}
      <button 
        onClick={onComplete}
        className="fixed top-10 right-10 text-[10px] text-slate-500 hover:text-cyan-400 transition-all uppercase tracking-[0.5em] flex items-center gap-3 group z-50 py-2 px-4 rounded-full bg-slate-900/50 backdrop-blur-md border border-white/5"
      >
        <span className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">Skip Neural Sync</span>
        <div className="w-8 h-[1px] bg-slate-800 group-hover:bg-cyan-500 transition-colors"></div>
      </button>

    </div>
  );
};

export default IntroScreen;
