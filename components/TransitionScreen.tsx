import React from 'react';
import { Dna, RefreshCw } from 'lucide-react';

interface TransitionScreenProps {
  generation: number;
}

export const TransitionScreen: React.FC<TransitionScreenProps> = ({ generation }) => {
  return (
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center animate-in fade-in duration-300">
        <div className="bg-slate-900/90 border border-slate-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 relative overflow-hidden">
            {/* Background Effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                <RefreshCw size={48} className="text-emerald-500 animate-spin duration-1000" />
            </div>
            
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">EVOLVING</h2>
                <div className="text-4xl font-mono text-emerald-400 font-bold">GEN {generation}</div>
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs tracking-widest uppercase mt-2">
                    <Dna size={14} />
                    <span>Cross-referencing genes</span>
                </div>
            </div>

            {/* Futuristic Progress Bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500 animate-[progress_1.5s_ease-in-out_infinite]"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 opacity-50">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: `${i * 0.1}s`}}></div>
                ))}
            </div>
        </div>
    </div>
  );
};