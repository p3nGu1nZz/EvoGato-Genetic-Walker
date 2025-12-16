import React, { useEffect, useState, useRef } from 'react';
import { X, BookOpen, Calculator, Network } from 'lucide-react';
import { MATH_DEFINITIONS } from '../services/neuralNet';

interface ResearchPanelProps {
  onClose: () => void;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'math' | 'algo'>('overview');
  const containerRef = useRef<HTMLDivElement>(null);

  // Robust typeset trigger
  useEffect(() => {
    // Small delay to ensure DOM is painted
    const timeout = setTimeout(() => {
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise && containerRef.current) {
             (window as any).MathJax.typesetPromise([containerRef.current]).catch((err: any) => console.log('MathJax error', err));
        }
    }, 100);
    return () => clearTimeout(timeout);
  }, [activeTab]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BookOpen className="text-indigo-500" />
                    Research & Documentation
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <div className="flex border-b border-slate-800">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    System Overview
                </button>
                <button 
                    onClick={() => setActiveTab('math')}
                    className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'math' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Equations
                </button>
                <button 
                    onClick={() => setActiveTab('algo')}
                    className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'algo' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    Genetic Algorithm
                </button>
            </div>

            <div ref={containerRef} className="flex-1 overflow-auto p-8 text-slate-300 leading-relaxed">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        <section>
                            <h3 className="text-xl font-bold text-white mb-2">Agent-Component System</h3>
                            <p className="text-sm">
                                The simulation uses a hybrid ECS (Entity-Component-System) architecture. Each Agent consists of:
                            </p>
                            <ul className="list-disc list-inside mt-2 text-sm text-slate-400 space-y-1 ml-4">
                                <li><strong className="text-indigo-400">Physical Entity:</strong> A complex Matter.js composite body with 8 dynamic joints and 2 spine sections.</li>
                                <li><strong className="text-indigo-400">Neural Brain:</strong> A Feed-Forward Neural Network (14 Inputs, 18 Hidden, 9 Outputs).</li>
                                <li><strong className="text-indigo-400">Genome:</strong> The encoded weights and biases that define the agent's behavior.</li>
                            </ul>
                        </section>
                        <section>
                            <h3 className="text-xl font-bold text-white mb-2">Performance Optimization</h3>
                            <p className="text-sm">
                                Compute is parallelized where possible using Web Workers for the evolutionary steps. The neural network inference engine utilizes typed arrays (Float32Array) for memory efficiency and cache locality.
                            </p>
                        </section>
                    </div>
                )}

                {activeTab === 'math' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                        <section>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Calculator size={18} /> Activation Function
                            </h3>
                            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 flex flex-col items-center">
                                <p className="mb-4 text-sm text-slate-400">The network uses Hyperbolic Tangent (tanh) to map inputs to a range of [-1, 1], suitable for motor torque control.</p>
                                <div className="text-xl" dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.tanh} $$` }}></div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <ActivityIcon /> Objective Function (Loss)
                            </h3>
                            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 flex flex-col items-center">
                                <p className="mb-4 text-sm text-slate-400">The fitness function maximizes distance traveled while penalizing instability (falling over) and encouraging upright posture.</p>
                                <div className="text-xl" dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.loss} $$` }}></div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'algo' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                        <section>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                <Network size={18} /> Uniform Crossover
                            </h3>
                            <p className="text-sm mb-4">
                                Unlike single-point crossover, we treat every weight as an independent gene locus. This allows for higher genetic diversity preservation.
                            </p>
                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-center">
                                <div className="text-lg" dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.crossover} $$` }}></div>
                            </div>
                        </section>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-indigo-400 mb-2">Selection</h4>
                                <p className="text-xs">Tournament selection (k=3) is used to pick parents. This pressure ensures better performing agents reproduce while maintaining some random chance for lower fitness agents to contribute unique traits.</p>
                            </div>
                            <div className="bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="font-bold text-emerald-400 mb-2">Mutation</h4>
                                <p className="text-xs">Gaussian noise is added to weights based on a mutation rate. This introduces new genetic material into the population, preventing local minima stagnation.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

const ActivityIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);