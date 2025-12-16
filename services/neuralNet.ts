import { NeuralNetworkConfig } from "../types";

// Mathematical Definitions for Research Panel
export const MATH_DEFINITIONS = {
  tanh: "f(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}",
  loss: "J = d_{total} - \\beta \\cdot \\text{collision} - \\gamma \\cdot |\\Delta v|",
  crossover: "w_{child} = \\begin{cases} w_{p1} & \\text{if } r < 0.5 \\\\ w_{p2} & \\text{otherwise} \n\\end{cases}"
};

export class SimpleNeuralNetwork {
  config: NeuralNetworkConfig;
  weights: Float32Array; // Optimized from number[]
  biases: Float32Array;

  constructor(config: NeuralNetworkConfig, weights?: number[] | Float32Array, biases?: number[] | Float32Array) {
    this.config = config;
    
    // Calculate total weights needed: (Input * Hidden) + (Hidden * Output)
    const weightsCount = (config.inputNodes * config.hiddenNodes) + (config.hiddenNodes * config.outputNodes);
    // Calculate total biases needed: Hidden + Output
    const biasesCount = config.hiddenNodes + config.outputNodes;

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
  }

  // Activation function (Tanh for -1 to 1 output)
  // Optimized: no method call overhead inside loops if possible, but kept for clarity
  static activate(x: number): number {
    return Math.tanh(x);
  }

  // Optimized predict function using plain loops and typed arrays
  predict(inputs: number[] | Float32Array): number[] {
    const { inputNodes, hiddenNodes, outputNodes } = this.config;
    // Safety check commented out for raw performance in hot loop
    /* if (inputs.length !== inputNodes) return []; */

    const weights = this.weights;
    const biases = this.biases;
    let wIndex = 0;
    let bIndex = 0;

    // Input -> Hidden Layer
    // We can pre-allocate this array in the class if we want zero GC, 
    // but local var is safer for concurrency conceptually (though JS is single threaded)
    const hiddenOutputs = new Float32Array(hiddenNodes); 
    
    for (let i = 0; i < hiddenNodes; i++) {
      let sum = 0;
      for (let j = 0; j < inputNodes; j++) {
        sum += inputs[j] * weights[wIndex++];
      }
      sum += biases[bIndex++];
      // Inline tanh for slight perf boost
      hiddenOutputs[i] = Math.tanh(sum);
    }

    // Hidden -> Output Layer
    const finalOutputs: number[] = new Array(outputNodes);
    for (let i = 0; i < outputNodes; i++) {
      let sum = 0;
      for (let j = 0; j < hiddenNodes; j++) {
        sum += hiddenOutputs[j] * weights[wIndex++];
      }
      sum += biases[bIndex++];
      finalOutputs[i] = Math.tanh(sum);
    }

    return finalOutputs;
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

  static copy(network: SimpleNeuralNetwork): SimpleNeuralNetwork {
    return new SimpleNeuralNetwork(network.config, new Float32Array(network.weights), new Float32Array(network.biases));
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