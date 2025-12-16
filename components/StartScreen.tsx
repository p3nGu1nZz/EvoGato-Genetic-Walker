import React from 'react';
import { Play, Info } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 animate-in fade-in duration-700 overflow-hidden">
        {/* Background Animated Cats */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
             {/* Ghost Cat Left to Right */}
             <div className="absolute top-1/3 left-[-100px] w-20 h-12 bg-slate-700 rounded-lg animate-[moveRight_15s_linear_infinite]">
                <div className="absolute -top-4 left-0 w-8 h-8 bg-slate-700 rounded-full"></div> {/* Head */}
                <div className="absolute top-10 left-2 w-4 h-12 bg-slate-700 rounded-full animate-[swing_0.5s_infinite_alternate]"></div> {/* Leg */}
                <div className="absolute top-10 right-2 w-4 h-12 bg-slate-700 rounded-full animate-[swing_0.5s_infinite_alternate_reverse]"></div> {/* Leg */}
             </div>
             
             {/* Ghost Cat Right to Left */}
             <div className="absolute bottom-1/3 right-[-100px] w-24 h-14 bg-indigo-900/50 rounded-lg animate-[moveLeft_20s_linear_infinite]" style={{animationDelay: '2s'}}>
                <div className="absolute -top-5 right-0 w-10 h-10 bg-indigo-900/50 rounded-full"></div> 
             </div>

              {/* Ghost Cat Slow */}
             <div className="absolute bottom-10 left-[-200px] w-16 h-10 bg-emerald-900/30 rounded-lg animate-[moveRight_30s_linear_infinite]" style={{animationDelay: '5s'}}></div>
        </div>

        <div className="relative mb-6 z-10 flex flex-col items-center">
            <div className="absolute -inset-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse"></div>
            <h1 className="relative text-6xl font-black text-white tracking-tighter italic">
                EVO<span className="text-indigo-500">GATO</span>
            </h1>
            <p className="text-center text-indigo-400 font-bold tracking-widest text-xs mt-2 uppercase">Created by p3nGu1nZz</p>
        </div>

        {/* About Box */}
        <div className="relative max-w-lg bg-slate-900/80 backdrop-blur-md border border-indigo-500/30 p-6 rounded-xl shadow-2xl mb-12 z-10 mx-4 transform transition-all hover:scale-105 duration-500 group">
             <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-indigo-500"></div>
             <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-indigo-500"></div>
             
             <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                <Info size={14} /> System Architecture
             </h3>
             <p className="text-slate-300 text-sm leading-relaxed text-justify">
                This simulation utilizes a Modeling Engine with an embedded Simulator and Updater loop. 
                Agents are trained via an Objective Function optimizing for distance and stance stability. 
                The population evolves through genetic crossover and mutation over successive generations.
             </p>
             <div className="mt-4 flex gap-2 text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                 <span>• Neural Net</span>
                 <span>• Physics Engine</span>
                 <span>• Genetic Alg</span>
             </div>
        </div>

        <button 
            onClick={onStart}
            className="group relative px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold tracking-wider transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] flex items-center gap-3 overflow-hidden z-10"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <Play size={24} fill="currentColor" />
            INITIATE SIMULATION
        </button>
        
        <div className="absolute bottom-6 text-slate-600 text-[10px] tracking-wide uppercase z-10">
            © 2026 Cat Game Research
        </div>

        <style>{`
            @keyframes moveRight {
                0% { transform: translateX(0); }
                100% { transform: translateX(120vw); }
            }
            @keyframes moveLeft {
                0% { transform: translateX(0); }
                100% { transform: translateX(-120vw); }
            }
        `}</style>
    </div>
  );
};