import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to access Gemini safely and prompt missing key errors at runtime
function getAIClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your Gemini API key in the Secrets panel in AI Studio Settings."
    );
  }
  return ai;
}

// Schemas for structured JSON responses
const identificationSchema = {
  type: Type.OBJECT,
  properties: {
    commonName: { type: Type.STRING, description: "Common name of the plant" },
    botanicalName: { type: Type.STRING, description: "Scientific or botanical name of the plant" },
    family: { type: Type.STRING, description: "Botanical family of the plant" },
    confidenceScore: { type: Type.INTEGER, description: "Confidence score as an integer percentage from 0 to 100" },
    description: { type: Type.STRING, description: "Detailed summary description of the plant, its natural traits, and native habitat" },
    toxicity: {
      type: Type.OBJECT,
      properties: {
        cats: { type: Type.STRING, description: "Toxicity to cats. e.g. Safe, Toxic, Mildly Toxic" },
        dogs: { type: Type.STRING, description: "Toxicity to dogs. e.g. Safe, Toxic, Mildly Toxic" },
        humans: { type: Type.STRING, description: "Toxicity to humans. e.g. Safe, Toxic, Mildly Toxic" }
      },
      required: ["cats", "dogs", "humans"]
    },
    careGuide: {
      type: Type.OBJECT,
      properties: {
        watering: { type: Type.STRING, description: "Watering frequency instructions, visual soil depth check tips, and overwatering indicators" },
        light: { type: Type.STRING, description: "Specific lighting requirements (intensity, orientation, indirect vs direct sun, duration)" },
        soil: { type: Type.STRING, description: "Drainage requirements, ideal soil mixture ingredients, and pH preferences" },
        temperature: { type: Type.STRING, description: "Ideal temperature ranges in Celsius (e.g. 18-24°C) and Fahrenheit (e.g. 65-75°F)" },
        humidity: { type: Type.STRING, description: "Optimal humidity percentage or misting requirements" },
        fertilizer: { type: Type.STRING, description: "Feeding schedule, suitable fertilizer types, and winter dormant guidelines" }
      },
      required: ["watering", "light", "soil", "temperature", "humidity", "fertilizer"]
    },
    propagation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of common propagation methods (e.g., stem cuttings, division, soil layering) and concise steps"
    },
    commonProblems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symptom: { type: Type.STRING, description: "Observable plant symptom (e.g., crispy leaf tips, dropping leaves, pale color)" },
          cause: { type: Type.STRING, description: "Root cause of the symptom" },
          solution: { type: Type.STRING, description: "Actionable solution or remedy" }
        },
        required: ["symptom", "cause", "solution"]
      },
      description: "List of typical problems, causes, and solutions for this plant species"
    },
    funFact: { type: Type.STRING, description: "A surprising, unique, or historical botanical fact about this plant" }
  },
  required: [
    "commonName",
    "botanicalName",
    "family",
    "confidenceScore",
    "description",
    "toxicity",
    "careGuide",
    "propagation",
    "commonProblems",
    "funFact"
  ]
};

const diagnosisSchema = {
  type: Type.OBJECT,
  properties: {
    issueName: { type: Type.STRING, description: "Primary diagnostic name of the disease, pest infestation, or environmental problem" },
    severity: { type: Type.STRING, description: "Estimated severity of the issue. Must be exactly 'low', 'medium', or 'high'" },
    diagnosis: { type: Type.STRING, description: "Detailed clinical description explaining what is happening to the plant" },
    possibleCauses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of potential triggers, conditions, or causes for this illness"
    },
    solutions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step actionable therapeutic procedures to fix or control the issue"
    },
    preventiveMeasures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Preventative cultivation habits to avoid future occurrences of this issue"
    }
  },
  required: ["issueName", "severity", "diagnosis", "possibleCauses", "solutions", "preventiveMeasures"]
};

async function startServer() {
  // Set generous payload limits for base64 image uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API 1: Plant Identification from Image
  app.post("/api/identify", async (req, res) => {
    try {
      const aiClient = getAIClient();
      const { image, mimeType, lang } = req.body;

      if (!image) {
        return res.status(400).json({ error: "No image payload supplied." });
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: image,
        },
      };

      const languageInstruction = lang === "id" 
        ? "IMPORTANT: You must write the entire JSON response fields in Indonesian (Bahasa Indonesia) except for biological names (botanicalName, family) which should stay in scientific Latin formats."
        : "IMPORTANT: Write the entire JSON response fields in English.";

      const textPart = {
        text: `Analyze this image and identify the plant. Fill out the response schema meticulously. If the image does not depict a plant or any recognizable plant part, set commonName to 'Unknown', botanicalName to 'Unknown', confidenceScore to 0, and state clearly in the description that the uploaded image does not appear to contain a plant. ${languageInstruction}`,
      };

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: identificationSchema,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from the Gemini AI model.");
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (err: any) {
      console.error("API Error in /api/identify:", err);
      res.status(500).json({ error: err.message || "Failed to identify plant." });
    }
  });

  // API 2: Plant Disease/Health Diagnosis
  app.post("/api/diagnose", async (req, res) => {
    try {
      const aiClient = getAIClient();
      const { description, image, mimeType, lang } = req.body;

      if (!description && !image) {
        return res.status(400).json({ error: "Either a text description or an image is required for diagnosis." });
      }

      const parts: any[] = [];
      if (image) {
        parts.push({
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: image,
          },
        });
      }

      const languageInstruction = lang === "id"
        ? "IMPORTANT: Write all structured JSON descriptions, diagnosis, solutions, and preventiveMeasures in Indonesian (Bahasa Indonesia)."
        : "IMPORTANT: Write all structured JSON diagnostic responses in English.";

      parts.push({
        text: `You are an expert plant pathologist. Diagnose the health problem of the plant.
User Description of Symptoms: ${description || "None provided"}
Analyze the symptoms shown visually in the photo (if provided) and cross-reference with the text description. Conform strictly to the required output schema. ${languageInstruction}`,
      });

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: parts,
        config: {
          responseMimeType: "application/json",
          responseSchema: diagnosisSchema,
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from the Gemini AI model.");
      }

      res.json(JSON.parse(responseText.trim()));
    } catch (err: any) {
      console.error("API Error in /api/diagnose:", err);
      res.status(500).json({ error: err.message || "Failed to diagnose plant health." });
    }
  });

  // API 3: Care Expert AI Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const aiClient = getAIClient();
      const { messages, plantContext, lang } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "A valid list of conversation messages is required." });
      }

      const contextInstruction = plantContext
        ? `The user is currently viewing/asking about a plant called: "${plantContext}". Tailor your answers and advice to this specific plant whenever suitable.`
        : "The user is asking general plant care, gardening, landscaping, or indoor plant questions.";

      const languageReplyInstruction = lang === "id"
        ? "IMPORTANT: You MUST reply entirely in Indonesian (Bahasa Indonesia)."
        : "IMPORTANT: You MUST reply entirely in English.";

      const systemInstruction = `You are 'Plant Doc', an expert horticulturist and friendly botanical companion.
Your goal is to guide users to be successful plant parents. You troubleshoot leaf discoloration, discuss pruning, advise on light/watering, recommend soil types, and explain propagation.
${contextInstruction}
${languageReplyInstruction}
Provide comprehensive, warm, helpful, and highly clear botanical guidance. Structure your answers with clean markdown (lists, bold words, header titles). Avoid raw HTML tags.`;

      // Format messages into Gemini role structure ('user' or 'model')
      const formattedContents = messages.map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
        },
      });

      const responseText = response.text;
      res.json({ text: responseText || "I'm sorry, I couldn't process that question. Could you please rephrase?" });
    } catch (err: any) {
      console.error("API Error in /api/chat:", err);
      res.status(500).json({ error: err.message || "Failed to generate AI assistant reply." });
    }
  });

  // Express Static & Vite Serving Configuration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Plant Identifier API running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
