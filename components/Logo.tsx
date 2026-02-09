
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-24 h-24',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64 md:w-80 md:h-80'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeMap[size]}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <defs>
            <radialGradient id="globeGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="60%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#0e7490" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Back Orbit */}
          <ellipse 
            cx="100" cy="100" rx="90" ry="30" 
            fill="none" stroke="#67e8f9" strokeWidth="1" strokeOpacity="0.4"
            transform="rotate(-15 100 100)"
          />

          {/* Globe Shadow / Background */}
          <circle cx="100" cy="100" r="65" fill="#083344" />
          
          {/* Internal Mesh / Constellation */}
          <g opacity="0.4">
            <path d="M70 70 L130 130 M70 130 L130 70 M100 35 L100 165 M35 100 L165 100" stroke="#67e8f9" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="#67e8f9" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="2" fill="#fff" />
            <circle cx="70" cy="70" r="1.5" fill="#fff" />
            <circle cx="130" cy="130" r="1.5" fill="#fff" />
            <circle cx="130" cy="70" r="1.5" fill="#fff" />
            <circle cx="70" cy="130" r="1.5" fill="#fff" />
          </g>

          {/* The Globe Body */}
          <circle cx="100" cy="100" r="60" fill="url(#globeGradient)" opacity="0.9" />
          
          {/* Front Orbit */}
          <path 
            d="M20 120 Q10 100 100 80 T180 120" 
            fill="none" stroke="#fff" strokeWidth="1.5" 
            filter="url(#glow)"
            transform="rotate(-15 100 100)"
            className="animate-pulse"
          />

          {/* Highlight Shine */}
          <ellipse cx="80" cy="75" rx="20" ry="15" fill="#fff" opacity="0.3" transform="rotate(-30 80 75)" />
        </svg>
      </div>

      {showText && (
        <div className="mt-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-slate-900 dark:text-white flex items-center justify-center gap-1">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Viz</span>
            <span>ora</span>
          </h1>
          <p className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-cyan-600 dark:text-cyan-400 font-black mt-2">
            Explore the Universe of Information
          </p>
        </div>
      )}
    </div>
  );
};

export default Logo;
