import React, { useEffect, useState, useRef } from 'react';
import { X, BookOpen, Calculator, Network, Library } from 'lucide-react';
import { MATH_DEFINITIONS } from '../services/neuralNet';

interface ResearchPanelProps {
  onClose: () => void;
}

export const ResearchPanel: React.FC<ResearchPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'math' | 'algo' | 'refs'>('overview');
  const contentRef = useRef<HTMLDivElement>(null);

  // Trigger MathJax typeset on render and tab change
  useEffect(() => {
    // We use a slight timeout to ensure React has fully painted the DOM
    const t = setTimeout(() => {
        if ((window as any).MathJax && contentRef.current) {
            // Clear any previous processing markers if needed, though MathJax 3 usually handles this
            // Force a re-typeset of the specific container
            (window as any).MathJax.typesetPromise([contentRef.current])
                .then(() => {
                    // console.log("MathJax Typeset Complete");
                })
                .catch((err: any) => console.log('MathJax error', err));
        }
    }, 50);
    return () => clearTimeout(t);
  }, [activeTab]);

  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-8">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BookOpen className="text-indigo-500" />
                    Research & Documentation
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <div className="flex border-b border-slate-800 overflow-x-auto">
                {[
                    {id: 'overview', label: 'Overview', icon: BookOpen},
                    {id: 'math', label: 'Mathematics', icon: Calculator},
                    {id: 'algo', label: 'Genetic Algorithm', icon: Network},
                    {id: 'refs', label: 'References', icon: Library},
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div ref={contentRef} className="flex-1 overflow-y-auto p-8 text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
                        <section>
                            <h3 className="text-2xl font-bold text-white mb-4">Project Abstract</h3>
                            <p className="mb-4">
                                EvoGato is a real-time stochastic simulation demonstrating the emergence of locomotion in quadrupedal agents through evolutionary reinforcement learning. 
                                Unlike traditional keyframe animation, the motion here is entirely procedural, driven by a neural network controller that learns to manipulate joint torques to maximize forward velocity while maintaining balance.
                            </p>
                            <p>
                                The system utilizes a custom-built Entity-Component-System (ECS) physics engine powered by Matter.js, allowing for 12+ concurrent agents to interact with a procedurally generated, non-deterministic terrain.
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-white mb-4">Neural Architecture</h3>
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
                                <h4 className="text-indigo-400 font-mono text-sm mb-2">TOPOLOGY: DEEP FEED-FORWARD</h4>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>Input Layer (Sensors)</span>
                                        <span className="font-mono text-white">14 Nodes</span>
                                    </li>
                                    <li className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>Hidden Layer 1 (Dense)</span>
                                        <span className="font-mono text-white">20 Nodes</span>
                                    </li>
                                    <li className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>Hidden Layer 2 (Dense)</span>
                                        <span className="font-mono text-white">16 Nodes</span>
                                    </li>
                                     <li className="flex justify-between border-b border-slate-800 pb-2">
                                        <span>Hidden Layer 3 (Dense)</span>
                                        <span className="font-mono text-white">12 Nodes</span>
                                    </li>
                                    <li className="flex justify-between pt-2">
                                        <span>Output Layer (Actuators)</span>
                                        <span className="font-mono text-white">9 Nodes</span>
                                    </li>
                                </ul>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'math' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
                         <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg text-sm text-blue-200">
                            <strong>Note:</strong> Equations are rendered using MathJax. If they do not appear immediately, try refreshing the tab.
                        </div>

                        <section>
                            <h3 className="text-xl font-bold text-white mb-4">Activation Function</h3>
                            <p className="mb-4 text-sm">
                                We utilize the Hyperbolic Tangent (tanh) activation function for all hidden and output nodes. 
                                This maps the infinite domain of input sums to a bounded range of $[-1, 1]$. This is crucial for motor control, where $-1$ represents full reverse torque and $1$ represents full forward torque.
                            </p>
                            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 flex justify-center py-8">
                                <div className="text-lg" dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.tanh} $$` }}></div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-white mb-4">Fitness Function (Loss)</h3>
                            <p className="mb-4 text-sm">
                                The evolutionary pressure is driven by a composite fitness function $J$. Agents maximize $J$ over the simulation lifespan $T$.
                            </p>
                            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 flex justify-center py-8 mb-4">
                                <div className="text-lg" dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.loss} $$` }}></div>
                            </div>
                            <ul className="space-y-2 text-sm text-slate-400 list-disc pl-5">
                                <li>{'$d_{total}$'}: Euclidean distance from start vector.</li>
                                <li>{'$\\beta \\cdot \\text{collision}$'}: Penalty coefficient for torso ground contact.</li>
                                <li>{'$\\gamma \\cdot |\\Delta v|$'}: Velocity smoothness regularization (penalizes jerky movement).</li>
                                <li>{'$P_{fall}$'}: Huge penalty for falling off the world map ({'$y > 1000$'}).</li>
                            </ul>
                        </section>
                    </div>
                )}

                {activeTab === 'algo' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4">Genetic Algorithm Pipeline</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">1</div>
                                    <div>
                                        <h4 className="font-bold text-white">Evaluation</h4>
                                        <p className="text-sm text-slate-400">The entire population runs in parallel in the physics engine. Fitness is calculated per frame.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">2</div>
                                    <div>
                                        <h4 className="font-bold text-white">Selection (Elitism + Tournament)</h4>
                                        <p className="text-sm text-slate-400">
                                            Top $N$ agents (Elites) are copied directly to the next generation to preserve best traits. 
                                            The rest are selected via Tournament Selection ($k=3$), favoring higher fitness but allowing stochastic diversity.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">3</div>
                                    <div>
                                        <h4 className="font-bold text-white">Uniform Crossover</h4>
                                        <p className="text-sm text-slate-400 mb-2">
                                            Parent genomes are combined. Unlike single-point crossover, uniform crossover treats every weight as an independent locus with a 50% probability of inheritance from either parent.
                                        </p>
                                        <div className="bg-slate-950 p-4 rounded border border-slate-800 text-center">
                                            <div dangerouslySetInnerHTML={{ __html: `$$ ${MATH_DEFINITIONS.crossover} $$` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'refs' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto">
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4">Bibliography & Resources</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-indigo-500">
                                    <h4 className="font-bold text-white">Evolving Neural Networks through Augmenting Topologies (NEAT)</h4>
                                    <p className="text-sm text-slate-400 italic">Stanley, K. O., & Miikkulainen, R. (2002).</p>
                                    <p className="text-xs text-slate-500 mt-1">Foundational paper on evolving network structures, though this sim uses fixed topology for performance.</p>
                                </div>
                                
                                <div className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-emerald-500">
                                    <h4 className="font-bold text-white">Flexible Muscle-Based Locomotion for Bipedal Creatures</h4>
                                    <p className="text-sm text-slate-400 italic">Geijtenbeek, T., van de Panne, M., & van der Stappen, A. F. (2013).</p>
                                    <p className="text-xs text-slate-500 mt-1">Inspiration for muscle-based torque control and optimization targets.</p>
                                </div>

                                <div className="p-4 bg-slate-800/50 rounded-lg border-l-4 border-blue-500">
                                    <h4 className="font-bold text-white">Matter.js Physics Engine</h4>
                                    <p className="text-sm text-slate-400 italic">brm.io/matter-js</p>
                                    <p className="text-xs text-slate-500 mt-1">Rigid body physics solver used for the ECS implementation.</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};