import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { createCat, createTerrain, CatEntity } from '../services/physicsFactory';
import { SimpleNeuralNetwork } from '../services/neuralNet';
import { GenerationStats, SimulationConfig, Genome, NeuralNetworkConfig } from '../types';
import { WORKER_SCRIPT } from '../services/workerScript';
import { renderScene } from '../services/renderService';

export const DEFAULT_CONFIG: SimulationConfig = {
  populationSize: 12, 
  mutationRate: 0.05,
  mutationAmount: 0.3,
  simulationTimeSteps: 60 * 60, 
  timeScale: 1,
  elitsmCount: 2
};

// Deep Network Config: 3 Hidden Layers (14 -> 20 -> 16 -> 12 -> 9)
const NN_CONFIG: NeuralNetworkConfig = {
  inputNodes: 14, 
  hiddenLayers: [20, 16, 12],
  outputNodes: 9, 
};

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e',
  '#fb7185'
];

type AppState = 'START' | 'RUNNING' | 'TRANSITION' | 'PAUSED';

interface CatAgent {
    entity: CatEntity;
    brain: SimpleNeuralNetwork;
    fitness: number;
    penalty: number; 
    active: boolean; 
    hasTouchedGroundBody: boolean; 
    prevVelocity: number; 
    distanceTraveled: number; 
}

export const useSimulation = () => {
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
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [populationData, setPopulationData] = useState<Genome[]>([]);
  
  // Zoom State
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1); // Use ref for render loop performance

  // Fix for stale config in loop: Use a Ref
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // --- Helpers ---
  const updateConfig = (key: keyof SimulationConfig, value: number) => {
      setConfig(prev => ({...prev, [key]: value}));
  };

  const handleZoom = (delta: number) => {
      const newZoom = Math.max(0.5, Math.min(2.5, zoomRef.current + delta));
      zoomRef.current = newZoom;
      setZoom(newZoom);
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

                if ((isTerrainA && bodyB === head) || (isTerrainB && bodyA === head)) {
                    cat.penalty += 100; 
                }
                
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

  const createPopulation = useCallback((populationWeights?: {weights: Float32Array, biases: Float32Array}[]) => {
    if (!engineRef.current) return;
    Matter.Composite.clear(engineRef.current.world, false, true);
    Matter.Composite.add(engineRef.current.world, terrainRef.current);

    const newCats: CatAgent[] = [];
    const size = configRef.current.populationSize;

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
  }, []);

  // Worker Setup
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

  const handleGenerationEnd = () => {
      appStateRef.current = 'TRANSITION';
      setAppState('TRANSITION');

      const currentConfig = configRef.current; 

      const maxFit = Math.max(...catsRef.current.map(c => c.fitness));
      const avgFit = catsRef.current.reduce((a,b) => a + b.fitness, 0) / currentConfig.populationSize;
      const avgLoss = catsRef.current.reduce((a,b) => a + b.penalty, 0) / currentConfig.populationSize;
      
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
              config: currentConfig,
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

  const update = () => {
    if (!engineRef.current || appStateRef.current !== 'RUNNING') return;

    const startTime = Date.now();
    const TIMEOUT_CAP = 200; 
    const inputs = inputBufferRef.current; 
    
    // Use REF to get latest config without closure staleness
    const currentConfig = configRef.current;

    for (let s = 0; s < speedRef.current; s++) {
        catsRef.current.forEach(c => c.hasTouchedGroundBody = false);

        Matter.Engine.update(engineRef.current, 1000 / 60);
        frameCountRef.current++;
        const oscillator = Math.sin(frameCountRef.current * 0.1); 

        const cats = catsRef.current;
        const len = cats.length;
        
        for (let i = 0; i < len; i++) {
            const cat = cats[i];
            
            // --- Sensors ---
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

            // --- Predict (Deep Network) ---
            const outputs = cat.brain.predict(inputs);
            
            // --- Actuate ---
            const TORQUE_STRENGTH = 0.5; 
            const SPINE_STRENGTH = 0.3;
            const spineTorque = outputs[0] * SPINE_STRENGTH;
            Matter.Body.setAngularVelocity(cat.entity.torsoFront, cat.entity.torsoFront.angularVelocity + spineTorque * 0.1);
            Matter.Body.setAngularVelocity(cat.entity.torsoBack, cat.entity.torsoBack.angularVelocity - spineTorque * 0.1);
            for(let j=1; j<9; j++) {
                const joint = cat.entity.joints[j]; 
                const output = outputs[j];
                const torque = output * TORQUE_STRENGTH;
                Matter.Body.setAngularVelocity(joint.bodyA, joint.bodyA.angularVelocity - torque * 0.05);
                Matter.Body.setAngularVelocity(joint.bodyB, joint.bodyB.angularVelocity + torque * 0.05);
            }
            
            // --- Evaluate ---
            const currentX = cat.entity.torsoFront.position.x;
            const currentY = cat.entity.torsoFront.position.y;
            const currentVelocity = cat.entity.torsoFront.velocity.x;
            cat.distanceTraveled = Math.max(0, currentX - 200);
            
            if (cat.hasTouchedGroundBody) cat.penalty += 1; 

            // Fall Penalty Check (Fallen out of world)
            if (currentY > 1000) {
                 cat.penalty += 100; // Large internal penalty
                 cat.fitness -= 1; // Explicit Fitness Penalty as requested
            }

            const acceleration = Math.abs(currentVelocity - cat.prevVelocity);
            const consistencyReward = (currentVelocity > 1 && acceleration < 0.2) ? 1.0 : 0;
            const motionReward = currentVelocity > 0.5 ? currentVelocity * 0.5 : 0;
            cat.prevVelocity = currentVelocity;
            
            let rawFitness = cat.distanceTraveled + consistencyReward + motionReward - (cat.penalty * 0.1);
            rawFitness += 0.1; // Living reward
            cat.fitness = rawFitness > 0 ? rawFitness : 0;
        }

        // Check time using CURRENT config
        if (frameCountRef.current >= currentConfig.simulationTimeSteps) {
            handleGenerationEnd();
            break; 
        }

        if (Date.now() - startTime > TIMEOUT_CAP) break; 
    }
  };

  const render = () => {
      if (!canvasRef.current || !engineRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Update UI Stats occasionally
      if (frameCountRef.current % 10 === 0) {
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

          setBestDist(maxX - 200);
          setActiveCount(catsRef.current.filter(c => c.active).length); 
          setTimeLeft(Math.ceil((configRef.current.simulationTimeSteps - frameCountRef.current) / 60));
          
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

      renderScene({
          ctx,
          width: canvasRef.current.width,
          height: canvasRef.current.height,
          engine: engineRef.current,
          terrain: terrainRef.current,
          cats: catsRef.current,
          selectedCatId,
          zoom: zoomRef.current
      });
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

  const handleReset = () => {
      setStats([]);
      generationRef.current = 1;
      setCurrentGen(1);
      createPopulation(); 
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !engineRef.current) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Calculate World Coordinates based on Camera logic in RenderService
      // This is an approximation because we need the current FocusCat position
      // For picking, it's easier to iterate screen-space if we projected, 
      // but here we just try to inverse the translation.
      
      let bestCat = catsRef.current[0];
      let maxX = -Infinity;
      catsRef.current.forEach(c => {
         if (c.entity.torsoFront.position.x > maxX) {
             maxX = c.entity.torsoFront.position.x;
             bestCat = c;
         }
      });
      const focusCat = selectedCatId ? catsRef.current.find(c => c.entity.id === selectedCatId) : bestCat;
      const camX = focusCat ? (-focusCat.entity.torsoFront.position.x + canvasRef.current.width / (2 * zoomRef.current)) : 0;
      
      // x_screen = (x_world + camX) * zoom
      // x_world = (x_screen / zoom) - camX
      const worldX = (x / zoomRef.current) - camX;
      const worldY = y / zoomRef.current;

      const bodies = catsRef.current.map(c => c.entity.torsoFront);
      const hits = Matter.Query.point(bodies, { x: worldX, y: worldY });
      
      if (hits.length > 0) {
          const body = hits[0];
          const cat = catsRef.current.find(c => c.entity.torsoFront === body);
          if (cat) setSelectedCatId(cat.entity.id);
      } else {
          // If click empty space, maybe deselect? Optional.
          // setSelectedCatId(null);
      }
  };

  return {
      canvasRef,
      config,
      updateConfig,
      appState,
      speed,
      setSpeed: (s: number) => { setSpeed(s); speedRef.current = s; },
      stats,
      currentGen,
      activeCount,
      bestDist,
      timeLeft,
      leaderGenome,
      leaderColor,
      leaderVelocity,
      populationData,
      selectedCatId,
      handleStart,
      handleTogglePlay,
      handleReset,
      handleCanvasClick,
      setStats,
      handleZoom
  };
};