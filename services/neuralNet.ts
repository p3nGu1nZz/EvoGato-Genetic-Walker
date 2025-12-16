import { NeuralNetworkConfig } from "../types";

// Mathematical Definitions for Research Panel
export const MATH_DEFINITIONS = {
  tanh: "f(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}",
  loss: "J = d_{total} - \\beta \\cdot \\text{collision} - \\gamma \\cdot |\\Delta v| - P_{fall}",
  crossover: "w_{child} = \\begin{cases} w_{p1} & \\text{if } r < 0.5 \\\\ w_{p2} & \\text{otherwise} \n\\end{cases}"
};

export class SimpleNeuralNetwork {
  config: NeuralNetworkConfig;
  weights: Float32Array;
  biases: Float32Array;
  
  // Optimization: Pre-allocated buffers to prevent GC during prediction
  private layerBuffers: Float32Array[];
  // Optimization: Cached structure to avoid array allocation per predict
  private structure: number[];

  constructor(config: NeuralNetworkConfig, weights?: number[] | Float32Array, biases?: number[] | Float32Array) {
    this.config = config;
    this.structure = [config.inputNodes, ...config.hiddenLayers, config.outputNodes];
    
    // Calculate total weights and biases needed for Deep Network
    let weightsCount = 0;
    let biasesCount = 0;

    const layers = this.structure;

    for (let i = 0; i < layers.length - 1; i++) {
        weightsCount += layers[i] * layers[i+1];
        biasesCount += layers[i+1];
    }

    if (weights && weights.length === weightsCount) {
      this.weights = weights instanceof Float32Array ? weights : new Float32Array(weights);
    } else {
      this.weights = new Float32Array(weightsCount);
      for (let i = 0; i < weightsCount; i++) {
        this.weights[i] = Math.random() * 2 - 1;
      }
    }

    if (biases && biases.length === biasesCount) {
      this.biases = biases instanceof Float32Array ? biases : new Float32Array(biases);
    } else {
      this.biases = new Float32Array(biasesCount);
      for (let i = 0; i < biasesCount; i++) {
        this.biases[i] = Math.random() * 2 - 1;
      }
    }

    // Initialize Layer Buffers
    this.layerBuffers = [];
    for (const size of layers) {
      this.layerBuffers.push(new Float32Array(size));
    }
  }

  // Optimized predict function: Zero allocation
  predict(inputs: number[] | Float32Array): Float32Array {
    // If inputs is a Float32Array and matches size, we can use it as the first buffer implicitly.
    // If it's a number array, we copy it to layerBuffers[0].
    
    let currentActivations: Float32Array;
    
    if (inputs instanceof Float32Array) {
        currentActivations = inputs;
    } else {
        // Fallback for number[]
        const buf = this.layerBuffers[0];
        for (let i = 0; i < inputs.length; i++) buf[i] = inputs[i];
        currentActivations = buf;
    }
    
    let wIndex = 0;
    let bIndex = 0;

    // Use cached structure
    const structure = this.structure;

    // Feed Forward through layers
    for (let i = 0; i < structure.length - 1; i++) {
        const inputSize = structure[i];
        const outputSize = structure[i+1];
        
        // Use pre-allocated buffer for next layer
        const nextActivations = this.layerBuffers[i + 1];

        for (let j = 0; j < outputSize; j++) {
            let sum = this.biases[bIndex++]; 
            // Hot loop
            for (let k = 0; k < inputSize; k++) {
                sum += currentActivations[k] * this.weights[wIndex++];
            }
            nextActivations[j] = Math.tanh(sum);
        }
        currentActivations = nextActivations;
    }

    return currentActivations;
  }

  static mutate(network: SimpleNeuralNetwork, rate: number, amount: number): SimpleNeuralNetwork {
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
  
  static crossover(parentA: SimpleNeuralNetwork, parentB: SimpleNeuralNetwork): SimpleNeuralNetwork {
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
