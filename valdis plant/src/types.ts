export interface PlantCareGuide {
  watering: string;
  light: string;
  soil: string;
  temperature: string;
  humidity: string;
  fertilizer: string;
}

export interface PlantCommonProblem {
  symptom: string;
  cause: string;
  solution: string;
}

export interface IdentificationResult {
  commonName: string;
  botanicalName: string;
  family: string;
  confidenceScore: number;
  description: string;
  toxicity: {
    cats: string; // e.g., "Toxic", "Safe", "Mildly Toxic"
    dogs: string;
    humans: string;
  };
  careGuide: PlantCareGuide;
  propagation: string[];
  commonProblems: PlantCommonProblem[];
  funFact: string;
}

export interface SavedPlant {
  id: string;
  nickname?: string;
  commonName: string;
  botanicalName: string;
  addedAt: string;
  lastWateredAt?: string;
  wateringFrequencyDays: number;
  notes?: string;
  imageUrl?: string; // Stored base64 image or placeholder
  careGuide: PlantCareGuide;
}

export interface DiagnosisResult {
  issueName: string;
  severity: 'low' | 'medium' | 'high';
  diagnosis: string;
  possibleCauses: string[];
  solutions: string[];
  preventiveMeasures: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
