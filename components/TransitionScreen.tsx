import React from 'react';
import { Dna, RefreshCw } from 'lucide-react';

interface TransitionScreenProps {
  generation: number;
}

export const TransitionScreen: React.FC<TransitionScreenProps> = ({ generation }) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl z-40 flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <div className="absolute -inset-4 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                <RefreshCw size={64} className="text-emerald-500 animate-spin duration-1000" />
            </div>
            
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">EVOLVING GENERATION <span className="text-emerald-400">{generation}</span></h2>
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs tracking-widest uppercase">
                    <Dna size={14} />
                    <span>Cross-referencing genetic data</span>
                </div>
            </div>

            {/* Futuristic Progress Bar */}
            <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-emerald-500 animate-[progress_2s_ease-in-out_infinite]"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-8 opacity-50">
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: `${i * 0.1}s`}}></div>
                ))}
            </div>
        </div>
    </div>
  );
};
