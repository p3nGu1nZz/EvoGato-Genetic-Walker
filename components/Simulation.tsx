import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { createCat, createTerrain, CatEntity, shadeColor } from '../services/physicsFactory';
import { SimpleNeuralNetwork } from '../services/neuralNet';
import { GenerationStats, SimulationConfig, Genome } from '../types';
import { StatsPanel } from './StatsPanel';
import { ControlBar } from './ControlBar';
import { GenomePanel } from './GenomePanel';
import { LeaderStats } from './LeaderStats';
import { TransitionScreen } from './TransitionScreen';
import { StartScreen } from './StartScreen';
import { SettingsPanel } from './SettingsPanel';
import { ResearchPanel } from './ResearchPanel';

// --- Configuration ---
const DEFAULT_CONFIG: SimulationConfig = {
  populationSize: 12, 
  mutationRate: 0.05,
  mutationAmount: 0.3,
  simulationTimeSteps: 60 * 60, // 60 Seconds (at 60 physics steps per second)
  timeScale: 1,
  elitsmCount: 2
};

const NN_CONFIG = {
  inputNodes: 14, 
  hiddenNodes: 18,
  outputNodes: 9, 
};

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
  '#fb7185'
];

// --- Worker Script Definition ---
const WORKER_SCRIPT = `
class SimpleNeuralNetwork {
  constructor(config, weights, biases) {
    this.config = config;
    const weightsCount = (config.inputNodes * config.hiddenNodes) + (config.hiddenNodes * config.outputNodes);
    const biasesCount = config.hiddenNodes + config.outputNodes;

    if (weights) {
      this.weights = weights;
    } else {
      this.weights = new Float32Array(weightsCount);
      for (let i = 0; i < weightsCount; i++) {
        this.weights[i] = Math.random() * 2 - 1;
      }
    }

    if (biases) {
      this.biases = biases;
    } else {
      this.biases = new Float32Array(biasesCount);
      for (let i = 0; i < biasesCount; i++) {
        this.biases[i] = Math.random() * 2 - 1;
      }
    }
  }

  static mutate(network, rate, amount) {
    const newWeights = new Float32Array(network.weights.length);
    const newBiases = new Float32Array(network.biases.length);

    for (let i = 0; i < network.weights.length; i++) {
      if (Math.random() < rate) {
        newWeights[i] = network.weights[i] + (Math.random() * 2 - 1) * amount;
      } else {
        newWeights[i] = network.weights[i];
      }
    }

    for (let i = 0; i < network.biases.length; i++) {
      if (Math.random() < rate) {
        newBiases[i] = network.biases[i] + (Math.random() * 2 - 1) * amount;
      } else {
        newBiases[i] = network.biases[i];
      }
    }

    return new SimpleNeuralNetwork(network.config, newWeights, newBiases);
  }
  
  static crossover(parentA, parentB) {
      const lenW = parentA.weights.length;
      const newWeights = new Float32Array(lenW);
      for(let i=0; i<lenW; i++) {
        newWeights[i] = Math.random() < 0.5 ? parentA.weights[i] : parentB.weights[i];
      }

      const lenB = parentA.biases.length;
      const newBiases = new Float32Array(lenB);
      for(let i=0; i<lenB; i++) {
        newBiases[i] = Math.random() < 0.5 ? parentA.biases[i] : parentB.biases[i];
      }
      
      return new SimpleNeuralNetwork(parentA.config, newWeights, newBiases);
  }
}

self.onmessage = (e) => {
  const { type, payload } = e.data;
  if (type === 'EVOLVE') {
    const { oldPopulation, config, nnConfig } = payload;
    const newPopulationData = evolvePopulation(oldPopulation, config, nnConfig);
    self.postMessage({ type: 'EVOLVE_COMPLETE', payload: newPopulationData });
  }
};

function evolvePopulation(oldPopulation, config, nnConfig) {
    const sortedPop = oldPopulation.sort((a, b) => b.fitness - a.fitness);
    const newPopData = [];

    // Elitism
    for(let i=0; i<config.elitsmCount; i++) {
        if (i < sortedPop.length) {
            newPopData.push({
                weights: sortedPop[i].brain.weights,
                biases: sortedPop[i].brain.biases,
                isElite: true
            });
        }
    }

    // Reproduction
    while(newPopData.length < config.populationSize) {
        const p1 = tournamentSelect(sortedPop);
        const p2 = tournamentSelect(sortedPop);
        
        const brain1 = new SimpleNeuralNetwork(nnConfig, p1.brain.weights, p1.brain.biases);
        const brain2 = new SimpleNeuralNetwork(nnConfig, p2.brain.weights, p2.brain.biases);
        
        let childBrain = SimpleNeuralNetwork.crossover(brain1, brain2);
        childBrain = SimpleNeuralNetwork.mutate(childBrain, config.mutationRate, config.mutationAmount);

        newPopData.push({
            weights: childBrain.weights,
            biases: childBrain.biases,
            isElite: false
        });
    }

    return newPopData;
}

function tournamentSelect(pop) {
    const k = 3;
    let best = pop[Math.floor(Math.random() * pop.length)];
    for(let i=0; i<k; i++) {
        const candidate = pop[Math.floor(Math.random() * pop.length)];
        if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
}
`;

type AppState = 'START' | 'RUNNING' | 'TRANSITION' | 'PAUSED';

interface CatAgent {
    entity: CatEntity;
    brain: SimpleNeuralNetwork;
    fitness: number;
    penalty: number; 
    active: boolean; // Kept for type compatibility, but agents won't set this to false on collision anymore
    hasTouchedGroundBody: boolean; 
    prevVelocity: number; 
    distanceTraveled: number; 
}

export const Simulation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const evolutionWorkerRef = useRef<Worker | null>(null);
  
  // Logic Refs
  const engineRef = useRef<Matter.Engine | null>(null);
  const catsRef = useRef<CatAgent[]>([]);
  const terrainRef = useRef<Matter.Body[]>([]);
  const frameCountRef = useRef(0);
  const generationRef = useRef(1);
  const animationFrameRef = useRef<number>(0);
  const speedRef = useRef(1);
  const appStateRef = useRef<AppState>('START');
  
  // Optimization Buffers
  const inputBufferRef = useRef<Float32Array>(new Float32Array(NN_CONFIG.inputNodes));

  // UI State
  const [appState, setAppState] = useState<AppState>('START');
  const [speed, setSpeed] = useState(1);
  const [stats, setStats] = useState<GenerationStats[]>([]);
  const [currentGen, setCurrentGen] = useState(1);
  const [activeCount, setActiveCount] = useState(DEFAULT_CONFIG.populationSize);
  const [bestDist, setBestDist] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [leaderGenome, setLeaderGenome] = useState<number[]>([]);
  const [leaderColor, setLeaderColor] = useState(COLORS[0]);
  const [leaderVelocity, setLeaderVelocity] = useState(0);
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [populationData, setPopulationData] = useState<Genome[]>([]);

  // --- Engine ---
  const simulator = useRef({
      step: (engine: Matter.Engine) => {
          Matter.Engine.update(engine, 1000 / 60);
      }
  });

  const comparator = useRef({
      evaluate: (cat: CatAgent): number => {
          if (!cat.active) return cat.fitness;

          const currentX = cat.entity.torsoFront.position.x;
          const currentVelocity = cat.entity.torsoFront.velocity.x;
          cat.distanceTraveled = Math.max(0, currentX - 200);
          
          // 1. Distance Reward (Primary)
          const distance = cat.distanceTraveled;
          
          // 2. Penalty (Accumulated in collision handling)
          if (cat.hasTouchedGroundBody) {
             cat.penalty += 1; 
          }

          // 3. Constant Speed Reward (Consistency)
          const acceleration = Math.abs(currentVelocity - cat.prevVelocity);
          const consistencyReward = (currentVelocity > 1 && acceleration < 0.2) ? 1.0 : 0;
          
          // 4. Forward Motion Reward (Velocity)
          const motionReward = currentVelocity > 0.5 ? currentVelocity * 0.5 : 0;

          // Update state for next frame
          cat.prevVelocity = currentVelocity;

          let rawFitness = distance + consistencyReward + motionReward - (cat.penalty * 0.1);
          
          // Small living reward
          rawFitness += 0.1;

          return rawFitness > 0 ? rawFitness : 0;
      }
  });

  const updater = useRef({
      actuate: (cat: CatAgent, outputs: number[]) => {
            const TORQUE_STRENGTH = 0.5; 
            const SPINE_STRENGTH = 0.3;
            const spineTorque = outputs[0] * SPINE_STRENGTH;
            
            Matter.Body.setAngularVelocity(cat.entity.torsoFront, cat.entity.torsoFront.angularVelocity + spineTorque * 0.1);
            Matter.Body.setAngularVelocity(cat.entity.torsoBack, cat.entity.torsoBack.angularVelocity - spineTorque * 0.1);

            for(let i=1; i<9; i++) {
                const joint = cat.entity.joints[i]; 
                const output = outputs[i];
                const torque = output * TORQUE_STRENGTH;
                Matter.Body.setAngularVelocity(joint.bodyA, joint.bodyA.angularVelocity - torque * 0.05);
                Matter.Body.setAngularVelocity(joint.bodyB, joint.bodyB.angularVelocity + torque * 0.05);
            }
      }
  });

  // --- Initialization ---
  const initPhysics = useCallback(() => {
    if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
    }
    const engine = Matter.Engine.create({
        positionIterations: 8, 
        velocityIterations: 6,
        constraintIterations: 4,
    });
    engine.gravity.y = 1; 
    engineRef.current = engine;
    
    // Death/Collision Handler
    Matter.Events.on(engine, 'collisionStart', (event) => {
        // Grace period to prevent penalties on spawn (first 2s / 120 frames)
        if (frameCountRef.current < 120) return;

        event.pairs.forEach(pair => {
            const bodyA = pair.bodyA;
            const bodyB = pair.bodyB;
            
            catsRef.current.forEach(cat => {
                if (!cat.active) return;
                
                const head = cat.entity.head;
                const torsos = [cat.entity.torsoFront, cat.entity.torsoBack];
                
                const isTerrainA = bodyA.isStatic;
                const isTerrainB = bodyB.isStatic;

                // Check Head (Severe Penalty)
                if ((isTerrainA && bodyB === head) || (isTerrainB && bodyA === head)) {
                    // We DO NOT set active=false here anymore. This ensures sim runs full length.
                    cat.penalty += 100; 
                }
                
                // Check Torsos (Drag Penalty flag)
                if ((isTerrainA && torsos.includes(bodyB)) || (isTerrainB && torsos.includes(bodyA))) {
                    cat.hasTouchedGroundBody = true; 
                }
            });
        });
    });

    Matter.Events.on(engine, 'collisionActive', (event) => {
         event.pairs.forEach(pair => {
            catsRef.current.forEach(cat => {
                if (!cat.active) return;
                const torsos = [cat.entity.torsoFront, cat.entity.torsoBack];
                const isTerrainA = pair.bodyA.isStatic;
                const isTerrainB = pair.bodyB.isStatic;
                
                if ((isTerrainA && torsos.includes(pair.bodyB)) || (isTerrainB && torsos.includes(pair.bodyA))) {
                    cat.hasTouchedGroundBody = true;
                }
            });
         });
    });
    
    const terrain = createTerrain(0, 50);
    terrainRef.current = terrain;
    Matter.Composite.add(engine.world, terrain);
  }, []);

  useEffect(() => {
      const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      evolutionWorkerRef.current = new Worker(workerUrl);
      
      evolutionWorkerRef.current.onmessage = (e) => {
          if (e.data.type === 'EVOLVE_COMPLETE') {
              applyNewGeneration(e.data.payload);
          }
      };

      return () => {
          evolutionWorkerRef.current?.terminate();
          URL.revokeObjectURL(workerUrl);
      };
  }, []);

  const createPopulation = (populationWeights?: {weights: Float32Array, biases: Float32Array}[]) => {
    if (!engineRef.current) return;
    Matter.Composite.clear(engineRef.current.world, false, true);
    Matter.Composite.add(engineRef.current.world, terrainRef.current);

    const newCats: typeof catsRef.current = [];
    const size = config.populationSize;

    if (!populationWeights) {
      for (let i = 0; i < size; i++) {
        const color = COLORS[i % COLORS.length];
        const entity = createCat(200, 450, `cat-${i}`, color);
        const brain = new SimpleNeuralNetwork(NN_CONFIG);
        newCats.push({ 
            entity, 
            brain, 
            fitness: 0, 
            penalty: 0,
            active: true, 
            hasTouchedGroundBody: false,
            prevVelocity: 0,
            distanceTraveled: 0
        });
        Matter.Composite.add(engineRef.current.world, entity.composite);
      }
    } else {
        populationWeights.forEach((dna, i) => {
             const color = COLORS[i % COLORS.length]; 
             const entity = createCat(200, 450, `cat-${i}`, color);
             const brain = new SimpleNeuralNetwork(NN_CONFIG, dna.weights, dna.biases);
             newCats.push({ 
                 entity, 
                 brain, 
                 fitness: 0, 
                 penalty: 0,
                 active: true, 
                 hasTouchedGroundBody: false,
                 prevVelocity: 0,
                 distanceTraveled: 0
             });
             Matter.Composite.add(engineRef.current.world, entity.composite);
        });
    }

    catsRef.current = newCats;
    frameCountRef.current = 0;
    setActiveCount(size);
    setSelectedCatId(null); 
  };

  // --- Main Loop ---
  const update = () => {
    if (!engineRef.current || appStateRef.current !== 'RUNNING') return;

    const startTime = Date.now();
    const TIMEOUT_CAP = 200; 
    const inputs = inputBufferRef.current; 

    for (let s = 0; s < speedRef.current; s++) {
        // Reset per-frame flags before physics step
        catsRef.current.forEach(c => c.hasTouchedGroundBody = false);

        simulator.current.step(engineRef.current);
        frameCountRef.current++;
        const oscillator = Math.sin(frameCountRef.current * 0.1); 

        // Batch update
        const cats = catsRef.current;
        const len = cats.length;
        
        for (let i = 0; i < len; i++) {
            const cat = cats[i];
            
            // Sensors
            const tf = cat.entity.torsoFront;
            const tb = cat.entity.torsoBack;
            const spineAngle = tf.angle - tb.angle;
            
            inputs[0] = tf.angle / Math.PI;
            inputs[1] = tb.angle / Math.PI;
            inputs[2] = spineAngle / Math.PI;
            inputs[3] = (600 - tf.position.y) / 200;
            inputs[4] = tf.angularVelocity;
            inputs[5] = oscillator;
            
            let bufIdx = 6;
            for(let L=0; L<4; L++) {
                const leg = cat.entity.legs[L];
                inputs[bufIdx++] = (leg.upper.angle - leg.jointHip.bodyA.angle) / Math.PI;
                inputs[bufIdx++] = (leg.lower.angle - leg.upper.angle) / Math.PI;
            }

            const outputs = cat.brain.predict(inputs);
            updater.current.actuate(cat, outputs);
            
            // Calculate Fitness
            cat.fitness = comparator.current.evaluate(cat);
        }

        // Only end if time is up. 
        // We no longer end early if everyone falls (because active=true always).
        if (frameCountRef.current >= config.simulationTimeSteps) {
            handleGenerationEnd();
            break; 
        }

        if (Date.now() - startTime > TIMEOUT_CAP) {
            break; 
        }
    }
  };

  const handleGenerationEnd = () => {
      appStateRef.current = 'TRANSITION';
      setAppState('TRANSITION');

      const maxFit = Math.max(...catsRef.current.map(c => c.fitness));
      const avgFit = catsRef.current.reduce((a,b) => a + b.fitness, 0) / config.populationSize;
      const avgLoss = catsRef.current.reduce((a,b) => a + b.penalty, 0) / config.populationSize;
      
      const bestCat = catsRef.current.reduce((prev, current) => (prev.fitness > current.fitness) ? prev : current);

      setStats(prev => [...prev, {
          generation: generationRef.current,
          maxFitness: Math.floor(maxFit),
          avgFitness: Math.floor(avgFit),
          avgLoss: Math.floor(avgLoss),
          bestDistance: Math.floor(bestCat.distanceTraveled), 
          bestGenomeWeights: Array.from(bestCat.brain.weights) 
      }]);
      
      const oldPop = catsRef.current.map(c => ({ 
          brain: { weights: c.brain.weights, biases: c.brain.biases }, 
          fitness: c.fitness 
      }));

      evolutionWorkerRef.current?.postMessage({
          type: 'EVOLVE',
          payload: {
              oldPopulation: oldPop,
              config: config,
              nnConfig: NN_CONFIG
          }
      });
  };

  const applyNewGeneration = (newPopData: any[]) => {
      Matter.Composite.remove(engineRef.current!.world, terrainRef.current);
      const newTerrain = createTerrain(0, 50 + generationRef.current * 5); 
      terrainRef.current = newTerrain;

      generationRef.current++;
      setCurrentGen(generationRef.current);

      setTimeout(() => {
          createPopulation(newPopData);
          appStateRef.current = 'RUNNING';
          setAppState('RUNNING');
      }, 1000);
  };

  const handleSaveSession = () => {
      const sessionData = {
          stats,
          config,
          generation: generationRef.current,
          population: catsRef.current.map(c => ({
              weights: Array.from(c.brain.weights),
              biases: Array.from(c.brain.biases),
              fitness: c.fitness
          }))
      };
      
      const blob = new Blob([JSON.stringify(sessionData)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evogato-gen${generationRef.current}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleLoadSession = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              if (data.population && data.stats) {
                  setAppState('PAUSED'); // Pause first
                  setStats(data.stats);
                  setConfig(data.config || config);
                  generationRef.current = data.generation;
                  setCurrentGen(data.generation);
                  
                  Matter.Composite.remove(engineRef.current!.world, terrainRef.current);
                  const newTerrain = createTerrain(0, 50 + data.generation * 5); 
                  terrainRef.current = newTerrain;
                  
                  const loadedPop = data.population.map((p: any) => ({
                      weights: new Float32Array(p.weights),
                      biases: new Float32Array(p.biases)
                  }));
                  createPopulation(loadedPop);
                  
                  alert(`Session Loaded: Gen ${data.generation}`);
              }
          } catch(err) {
              console.error(err);
              alert("Invalid session file");
          }
      };
      reader.readAsText(file);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !engineRef.current) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      let camX = 0;
      let trackedCat = selectedCatId ? catsRef.current.find(c => c.entity.id === selectedCatId) : null;
      if (!trackedCat) {
          let bestCat = catsRef.current[0];
          let maxX = -Infinity;
          catsRef.current.forEach(c => {
             if (c.entity.torsoFront.position.x > maxX) {
                 maxX = c.entity.torsoFront.position.x;
                 bestCat = c;
             }
          });
          trackedCat = bestCat;
      }

      if (trackedCat && canvasRef.current) {
           camX = -trackedCat.entity.torsoFront.position.x + canvasRef.current.width * 0.3;
      }
      
      const worldX = x - camX;
      const worldY = y;

      const bodies = catsRef.current.map(c => c.entity.torsoFront);
      const hits = Matter.Query.point(bodies, { x: worldX, y: worldY });
      
      if (hits.length > 0) {
          const body = hits[0];
          const cat = catsRef.current.find(c => c.entity.torsoFront === body);
          if (cat) setSelectedCatId(cat.entity.id);
      }
  };

  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !engineRef.current) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (catsRef.current.length === 0) return;

    let bestCat = catsRef.current[0];
    let maxX = -Infinity;
    catsRef.current.forEach(c => {
        if (c.entity.torsoFront.position.x > maxX) {
            maxX = c.entity.torsoFront.position.x;
            bestCat = c;
        }
    });

    const focusCat = selectedCatId 
        ? catsRef.current.find(c => c.entity.id === selectedCatId) || bestCat 
        : bestCat;

    if (frameCountRef.current % 10 === 0) {
        setBestDist(maxX - 200);
        setActiveCount(catsRef.current.filter(c => c.active).length); 
        setTimeLeft(Math.ceil((config.simulationTimeSteps - frameCountRef.current) / 60));
        
        setPopulationData(catsRef.current.map(c => ({
            id: c.entity.id,
            weights: Array.from(c.brain.weights), 
            bias: Array.from(c.brain.biases),
            fitness: c.fitness,
            color: c.entity.torsoFront.render.fillStyle as string
        })));

        if (focusCat) {
            setLeaderGenome(Array.from(focusCat.brain.weights));
            setLeaderColor((focusCat.entity.torsoFront.render.fillStyle as string));
            setLeaderVelocity(focusCat.entity.torsoFront.velocity.x);
        }
    }

    ctx.save();
    
    if (focusCat) {
        const camX = -focusCat.entity.torsoFront.position.x + canvas.width * 0.3;
        ctx.translate(camX, 0);
    }

    // Render Terrain
    ctx.fillStyle = '#334155';
    terrainRef.current.forEach(block => {
        ctx.beginPath();
        const v = block.vertices;
        ctx.moveTo(v[0].x, v[0].y);
        for(let j=1; j<v.length; j++) ctx.lineTo(v[j].x, v[j].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
    });

    // Render Cats
    const sortedCats = [...catsRef.current].sort((a,b) => {
        if (a === focusCat) return 1;
        return -1;
    });

    sortedCats.forEach(cat => {
        const isSelected = cat === focusCat;
        const alpha = isSelected ? 1 : (selectedCatId ? 0.2 : 0.5);
        const finalAlpha = alpha; 
        const color = cat.entity.torsoFront.render.fillStyle as string;

        cat.entity.tail.forEach(seg => drawBody(ctx, seg, color, finalAlpha));
        cat.entity.legs.forEach(leg => {
             drawBody(ctx, leg.upper, (leg.upper.render.fillStyle as string), finalAlpha);
             drawBody(ctx, leg.lower, (leg.lower.render.fillStyle as string), finalAlpha);
        });

        drawBody(ctx, cat.entity.torsoBack, color, finalAlpha);
        drawBody(ctx, cat.entity.torsoFront, color, finalAlpha);
        drawBody(ctx, cat.entity.head, color, finalAlpha);

        // Draw Ears
        const head = cat.entity.head;
        const earColor = shadeColor(color, -20);
        ctx.fillStyle = earColor;
        ctx.globalAlpha = finalAlpha;
        
        const headR = 18 * 0.7; 
        const earH = 12;
        const angle = head.angle;
        
        const drawEar = (angleOffset: number) => {
             ctx.beginPath();
             const cx = head.position.x;
             const cy = head.position.y;
             const baseAngle = angle - Math.PI/2 + angleOffset;
             const bx = cx + Math.cos(baseAngle) * headR;
             const by = cy + Math.sin(baseAngle) * headR;
             const tipAngle = angle - Math.PI/2 + angleOffset * 1.2;
             const tx = cx + Math.cos(tipAngle) * (headR + earH);
             const ty = cy + Math.sin(tipAngle) * (headR + earH);
             const baseAngle2 = angle - Math.PI/2 + angleOffset + (angleOffset > 0 ? 0.3 : -0.3);
             const b2x = cx + Math.cos(baseAngle2) * headR;
             const b2y = cy + Math.sin(baseAngle2) * headR;
             ctx.moveTo(bx, by);
             ctx.lineTo(tx, ty);
             ctx.lineTo(b2x, b2y);
             ctx.fill();
        };

        drawEar(-0.6);
        drawEar(0.6);

        if (isSelected) {
            ctx.strokeStyle = selectedCatId ? '#fbbf24' : '#fbbf24'; 
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(cat.entity.torsoFront.position.x, cat.entity.torsoFront.position.y, 60, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            const label = selectedCatId ? (cat.entity.id === bestCat.entity.id ? "Leader (Selected)" : "Selected") : "Leader";
            ctx.fillText(label, cat.entity.torsoFront.position.x - 20, cat.entity.torsoFront.position.y - 60);
        }
    });

    ctx.restore();
  };

  const drawBody = (ctx: CanvasRenderingContext2D, body: Matter.Body, color: string, alpha: number) => {
        ctx.beginPath();
        const v = body.vertices;
        ctx.moveTo(v[0].x, v[0].y);
        for(let k=1; k<v.length; k++) ctx.lineTo(v[k].x, v[k].y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();
  };

  const loop = () => {
    update();
    render();
    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
      initPhysics();
      animationFrameRef.current = requestAnimationFrame(loop);

      return () => {
          cancelAnimationFrame(animationFrameRef.current);
          if (engineRef.current) Matter.Engine.clear(engineRef.current);
      };
  }, []);

  const handleStart = () => {
      setAppState('RUNNING');
      appStateRef.current = 'RUNNING';
      createPopulation();
  };

  const handleTogglePlay = () => {
      if (appState === 'RUNNING') {
          setAppState('PAUSED');
          appStateRef.current = 'PAUSED';
      } else if (appState === 'PAUSED') {
          setAppState('RUNNING');
          appStateRef.current = 'RUNNING';
      }
  };
  
  const handleReset = () => {
      setStats([]);
      generationRef.current = 1;
      setCurrentGen(1);
      createPopulation(); 
  };

  const updateConfig = (key: keyof SimulationConfig, value: number) => {
      setConfig(prev => ({...prev, [key]: value}));
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-slate-900 overflow-hidden select-none font-sans">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block cursor-crosshair"
        onClick={handleCanvasClick}
      />
      
      {appState === 'START' && <StartScreen onStart={handleStart} />}
      {appState === 'TRANSITION' && <TransitionScreen generation={currentGen} />}
      {showSettings && <SettingsPanel config={config} onUpdate={updateConfig} onClose={() => setShowSettings(false)} />}
      {showResearch && <ResearchPanel onClose={() => setShowResearch(false)} />}
      
      {appState !== 'START' && (
        <>
            <div className="absolute top-4 left-4 p-4 text-white/50 pointer-events-none z-0">
                <h1 className="text-3xl font-black italic tracking-tighter mb-1 text-white">EVO<span className="text-indigo-500">GATO</span></h1>
                <p className="text-[10px] tracking-widest uppercase">Genetic Neural Network</p>
            </div>

            <StatsPanel 
                stats={stats} 
                generation={currentGen}
                bestDistance={bestDist}
                activeCount={activeCount}
                timeRemaining={timeLeft}
            />
            
            <LeaderStats 
                distance={selectedCatId 
                    ? catsRef.current.find(c => c.entity.id === selectedCatId)?.distanceTraveled || 0 
                    : bestDist
                }
                height={0}
                velocity={leaderVelocity}
                color={leaderColor}
            />

            <GenomePanel 
                population={populationData}
                selectedId={selectedCatId}
                history={stats}
            />
            
            <ControlBar 
                isPlaying={appState === 'RUNNING'} 
                onTogglePlay={handleTogglePlay}
                onReset={handleReset}
                speed={speed}
                onSpeedChange={(s) => { setSpeed(s); speedRef.current = s; }}
                onOpenSettings={() => setShowSettings(true)}
                onOpenResearch={() => setShowResearch(true)}
                onSave={handleSaveSession}
                onLoad={handleLoadSession}
            />
        </>
      )}
    </div>
  );
};