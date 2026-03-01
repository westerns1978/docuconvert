import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-3.1-pro-preview";

function getGeminiClient() {
  // Try process.env first (standard for AI Studio), then fallback to Vite's import.meta.env
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  console.log('[Gemini Auth] Initializing Gemini Client. Key exists?', !!apiKey);
  
  if (!apiKey) {
    console.warn("[Gemini Auth] Gemini API key is missing! Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function convertPdfToMarkdown(
  file: File,
  onProgress?: (status: string) => void
): Promise<string> {
  const ai = getGeminiClient();
  
  onProgress?.("Reading file...");
  const base64Data = await fileToBase64(file);
  
  onProgress?.("Analyzing document with Gemini 3.1 Pro...");
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          {
            text: `Convert this PDF document into high-quality Markdown. 
            - Preserve the document structure (headings, lists, tables).
            - Use appropriate Markdown formatting for bold, italic, and links.
            - If there are images, describe them briefly in alt text if possible, or just note their presence.
            - Ensure tables are rendered as proper Markdown tables.
            - Do not include any preamble or postamble, just the Markdown content.`,
          },
        ],
      },
    ],
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate markdown content.");
  }

  return text;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}

export interface ResearchResponse {
  text: string;
  sources: { uri: string; title: string }[];
}

export async function askResearchAssistant(
  documentContext: string,
  query: string
): Promise<ResearchResponse> {
  const ai = getGeminiClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Document Context:\n${documentContext.substring(0, 50000)}\n\nUser Question:\n${query}\n\nPlease answer the user's question using the provided document context and up-to-date information from Google Search.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "No answer generated.";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  const sources: {uri: string, title: string}[] = [];
  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ uri: chunk.web.uri, title: chunk.web.title });
      }
    }
  }

  // Deduplicate sources by URI
  const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

  return { text, sources: uniqueSources };
}

export interface LocationResponse {
  text: string;
  places: { uri: string; title: string }[];
}

export async function askLocationAssistant(
  documentContext: string,
  query: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<LocationResponse> {
  const ai = getGeminiClient();
  
  const config: any = {
    tools: [{ googleMaps: {} }],
  };

  if (userLocation) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Document Context:\n${documentContext.substring(0, 50000)}\n\nUser Question:\n${query}\n\nPlease answer the user's question using the provided document context and up-to-date information from Google Maps.`,
    config,
  });

  const text = response.text || "No answer generated.";
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  const places: {uri: string, title: string}[] = [];
  if (chunks) {
    for (const chunk of chunks) {
      if (chunk.maps?.uri && chunk.maps?.title) {
        places.push({ uri: chunk.maps.uri, title: chunk.maps.title });
      }
    }
  }

  // Deduplicate places by URI
  const uniquePlaces = Array.from(new Map(places.map(item => [item.uri, item])).values());

  return { text, places: uniquePlaces };
}

export async function analyzeDocument(
  documentContext: string,
  taskPrompt: string
): Promise<string> {
  const ai = getGeminiClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Document Context:\n${documentContext.substring(0, 50000)}\n\nTask:\n${taskPrompt}\n\nPlease perform the task based ONLY on the provided document context.`,
  });

  return response.text || "No result generated.";
}
