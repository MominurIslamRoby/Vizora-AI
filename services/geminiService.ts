
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language, ChatMessage, TimelineItem } from "../types";
import { getContextForPrompt } from "./memoryService";

/**
 * Returns a fresh GoogleGenAI instance.
 * Strictly adheres to guidelines: uses process.env.API_KEY directly.
 */
const getAiInstance = () => {
  const apiKey = process.env.API_KEY;
  
  // Robust check for various 'empty' states that can occur in CI/CD environments
  if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey.trim() === "") {
    console.error("CRITICAL: API_KEY is missing from the environment. Check Netlify Environment Variables.");
    throw new Error("API_KEY_MISSING: The neural engine failed to detect the API_KEY variable. Ensure the key is named exactly 'API_KEY' in Netlify and trigger a 'Clear cache and deploy'.");
  }
  
  return new GoogleGenAI({ apiKey });
};

const FLASH_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

async function callWithRetry<T>(fn: (attempt: number) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn(i);
    } catch (err: any) {
      lastError = err;
      const status = err.status || err.code;
      const message = err.message?.toLowerCase() || "";
      
      // Retry on transient errors or rate limits
      if ((status === 429 || status === 500 || status === 503 || message.includes("quota") || message.includes("exhausted")) && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language,
  isDeepDive: boolean = false
): Promise<ResearchResult> => {
  
  return await callWithRetry(async (attempt) => {
    const ai = getAiInstance();
    const memoryContext = getContextForPrompt(topic);
    
    const systemInstruction = `You are an expert researcher for Vizora. Research the topic: "${topic}" using Google Search for a ${level} audience. Style: ${style}. Language: ${language}. ${memoryContext}`;

    const prompt = `
      Perform comprehensive research and provide the following:
      
      FACTS:
      - [Key Fact 1]
      - [Key Fact 2]
      - [Key Fact 3]
      
      TIMELINE:
      - [Timeframe] | [Title] | [Deep Description]
      
      DETAILED_SUMMARY:
      [Structured Markdown Analysis]
      
      IMAGE_PROMPT:
      [Visual directive for infographic generation]
    `;

    const modelToUse = (isDeepDive && attempt === 0) ? PRO_MODEL : FLASH_MODEL;
    const config: any = { 
      tools: [{ googleSearch: {} }],
      systemInstruction: systemInstruction
    };

    if (modelToUse === PRO_MODEL) {
      config.thinkingConfig = { thinkingBudget: 16000 };
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config,
    });

    const text = response.text || "";
    
    const factsMatch = text.match(/FACTS:?([\s\S]*?)(?=TIMELINE:?|DETAILED_SUMMARY:?|IMAGE_PROMPT:?|$)/i);
    const timelineMatch = text.match(/TIMELINE:?([\s\S]*?)(?=DETAILED_SUMMARY:?|IMAGE_PROMPT:?|$)/i);
    const summaryMatch = text.match(/DETAILED_SUMMARY:?([\s\S]*?)(?=IMAGE_PROMPT:?|$)/i);
    const promptMatch = text.match(/IMAGE_PROMPT:?([\s\S]*?)$/i);

    const facts = factsMatch ? factsMatch[1].trim().split('\n').map(f => f.replace(/^[-*]\s*/, '').trim()).filter(f => f) : [];
    const timeline: TimelineItem[] = [];
    if (timelineMatch) {
      const lines = timelineMatch[1].trim().split('\n');
      lines.forEach(line => {
        const parts = line.replace(/^[-*]\s*/, '').split('|');
        if (parts.length >= 2) {
          timeline.push({
            year: parts[0].trim(),
            event: parts[1].trim(),
            description: parts[2]?.trim() || parts[1].trim()
          });
        }
      });
    }

    const detailedSummary = summaryMatch ? summaryMatch[1].trim() : text.slice(0, 1000);
    const imagePrompt = promptMatch ? promptMatch[1].trim() : `Scientific infographic about ${topic}, ${style} style`;

    const searchResults: SearchResultItem[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web?.uri && chunk.web?.title) {
          searchResults.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      });
    }

    return {
      imagePrompt,
      facts: facts.slice(0, 5),
      detailedSummary,
      timeline,
      searchResults: Array.from(new Map(searchResults.map(item => [item.url, item])).values())
    };
  });
};

export const generateInfographicImage = async (prompt: string, aspectRatio: AspectRatio = "16:9"): Promise<string> => {
  return await callWithRetry(async () => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("IMAGE_GEN_FAILED");
  });
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string, aspectRatio: AspectRatio = "16:9"): Promise<string> => {
  return await callWithRetry(async () => {
    const ai = getAiInstance();
    const cleanBase64 = currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL, 
      contents: {
        parts: [
           { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
           { text: editInstruction }
        ]
      },
      config: { imageConfig: { aspectRatio } }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("IMAGE_EDIT_FAILED");
  });
};

export const synthesizeNeuralSpeech = async (text: string, voice: 'Kore' | 'Zephyr' = 'Kore'): Promise<string> => {
  return await callWithRetry(async () => {
    const sanitizedText = text.replace(/[#*_~`>]/g, '').slice(0, 3000).trim();
    if (!sanitizedText) throw new Error("TTS_EMPTY_TEXT");
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: sanitizedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("TTS_DATA_MISSING");
    return base64Audio;
  });
};

export const streamChatWithGrounding = async (topic: string, history: ChatMessage[], onChunk: (text: string) => void, onComplete: (finalText: string, sources: SearchResultItem[]) => void): Promise<void> => {
  return await callWithRetry(async () => {
    const ai = getAiInstance();
    const contents = history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
    const responseStream = await ai.models.generateContentStream({
      model: PRO_MODEL,
      contents,
      config: {
        systemInstruction: `You are a research assistant for Vizora. Topic: "${topic}". Ground answers in Google Search.`,
        tools: [{ googleSearch: {} }],
      },
    });
    let fullText = "";
    const sources: SearchResultItem[] = [];
    for await (const chunk of responseStream) {
      if (chunk.text) { fullText += chunk.text; onChunk(fullText); }
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach(c => { if (c.web?.uri && c.web?.title) sources.push({ title: c.web.title, url: c.web.uri }); });
      }
    }
    onComplete(fullText, Array.from(new Map(sources.map(s => [s.url, s])).values()));
  });
};
