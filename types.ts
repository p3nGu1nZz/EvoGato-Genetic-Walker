export interface NeuralNetworkConfig {
  inputNodes: number;
  hiddenLayers: number[]; // Changed from single hiddenNodes number to array
  outputNodes: number;
}

export interface Genome {
  id: string;
  weights: number[];
  bias: number[];
  fitness: number;
  color: string;
}

export interface SimulationConfig {
  populationSize: number;
  mutationRate: number;
  mutationAmount: number;
  simulationTimeSteps: number; 
  timeScale: number;
  elitsmCount: number;
}

export interface GenerationStats {
  generation: number;
  maxFitness: number;
  avgFitness: number;
  avgLoss: number;
  bestDistance: number;
  bestGenomeWeights?: number[]; 
}

export interface WeightHistoryPoint {
  generation: number;
  value: number;
}