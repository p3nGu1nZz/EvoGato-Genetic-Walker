import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, Calculator, Network, Library } from 'lucide-react';
import { MATH_DEFINITIONS } from '../services/neuralNet';

export const ResearchPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'math' | 'algo' | 'refs'>('overview');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
        if ((window as any).MathJax && contentRef.current) {
            (window as any).MathJax.typesetPromise([contentRef.current])
                .catch((err: any) => console.log('MathJax error', err));
        }
    }, 50);
    return () => clearTimeout(t);
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col">
        <div className="flex border-b border-slate-800 overflow-x-auto shrink-0">
            {[
                {id: 'overview', label: 'Overview', icon: BookOpen},
                {id: 'math', label: 'Math', icon: Calculator},
                {id: 'algo', label: 'Algo', icon: Network},
                {id: 'refs', label: 'Refs', icon: Library},
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-xs font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <tab.icon size={14} />
                    {tab.label}
                </button>
            ))}
        </div>

        <div ref={contentRef} className="flex-1 overflow-y-auto p-6 text-slate-300 leading-relaxed">
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2">Project Abstract</h3>
                        <p className="text-sm mb-3">
                            EvoGato is a real-time stochastic simulation demonstrating the emergence of locomotion in quadrupedal agents through evolutionary reinforcement learning. 
                        </p>
                        <p className="text-sm">
                            The system utilizes a custom-built ECS physics engine powered by Matter.js.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-md font-bold text-white mb-3">Neural Architecture</h3>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <ul className="space-y-2 text-xs">
                                <li className="flex justify-between border-b border-slate-800 pb-2">
                                    <span>Input Layer</span>
                                    <span className="font-mono text-white">14 Nodes</span>
                                </li>
                                <li className="flex justify-between border-b border-slate-800 pb-2">
                                    <span>Hidden Layers</span>
                                    <span className="font-mono text-white">20, 16, 12</span>
                                </li>
                                <li className="flex justify-between pt-2">
                                    <span>Output Layer</span>
                                    <span className="font-mono text-white">9 Nodes</span>
                                </li>
                            </ul>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'math' && (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    <section>
                        <h3 className="text-md font-bold text-white mb-2">Activation</h3>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-center">
                            <div className="text-sm" dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.tanh} $$` }}></div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-md font-bold text-white mb-2">Fitness Function</h3>
                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-center mb-2">
                            <div className="text-sm" dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.loss} $$` }}></div>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'algo' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <section>
                        <h3 className="text-md font-bold text-white mb-4">Pipeline</h3>
                        <div className="flex flex-col gap-4 text-xs">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">1</div>
                                <div><strong className="text-white block">Evaluation</strong>Physics-based fitness calculation.</div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">2</div>
                                <div><strong className="text-white block">Selection</strong>Elitism + Tournament (k=3).</div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">3</div>
                                <div><strong className="text-white block">Crossover</strong>Uniform recombination.</div>
                            </div>
                        </div>
                    </section>
                </div>
            )}
             {activeTab === 'refs' && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="p-3 bg-slate-800/50 rounded border-l-2 border-indigo-500">
                        <h4 className="font-bold text-white text-xs">NEAT (2002)</h4>
                        <p className="text-[10px] text-slate-400">Stanley, K. O., & Miikkulainen, R.</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
