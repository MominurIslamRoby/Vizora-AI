
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language, ChatMessage, TimelineItem } from "../types";
import { getContextForPrompt } from "./memoryService";

/**
 * Safely retrieves the API key from the environment.
 * Uses process.env.API_KEY directly to allow bundlers to inject it at build time.
 */
const getAi = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: The Google GenAI API key is not defined in the environment (process.env.API_KEY).");
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
      
      // Retry on rate limits or internal server errors
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
    const ai = getAi();
    const memoryContext = getContextForPrompt(topic);
    
    const systemPrompt = `
      You are an expert researcher for Vizora.
      Your goal is to research the topic: "${topic}" using Google Search.
      Target Audience: ${level}.
      
      ${memoryContext}

      Provide a comprehensive response in the following format EXACTLY:
      
      FACTS:
      - [Brief Fact 1]
      - [Brief Fact 2]
      - [Brief Fact 3]
      
      TIMELINE:
      - [Year or Period] | [Short Title] | [Detailed description of the event]
      - [Year or Period] | [Short Title] | [Detailed description of the event]
      - [Year or Period] | [Short Title] | [Detailed description of the event]

      DETAILED_SUMMARY:
      [Provide a structured answer in ${language}. Use Markdown for headings and lists.]
      
      IMAGE_PROMPT:
      [Detailed image prompt. Style: ${style}.]
    `;

    // Attempt to use Flash if Pro fails or on later retries to ensure delivery
    const modelToUse = (isDeepDive && attempt === 0) ? PRO_MODEL : FLASH_MODEL;

    const config: any = {
      tools: [{ googleSearch: {} }],
    };

    if (modelToUse === PRO_MODEL) {
      config.thinkingConfig = { thinkingBudget: 16000 };
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: systemPrompt,
      config,
    });

    const text = response.text || "";
    
    // Improved regex to handle markdown bolding or slight formatting variations
    const factsMatch = text.match(/(?:\*\*|#)*FACTS:?(?:\*\*|#)*\s*([\s\S]*?)(?=(?:\*\*|#)*TIMELINE:?|(?:\*\*|#)*DETAILED_SUMMARY:?|(?:\*\*|#)*IMAGE_PROMPT:?|$)/i);
    const timelineMatch = text.match(/(?:\*\*|#)*TIMELINE:?(?:\*\*|#)*\s*([\s\S]*?)(?=(?:\*\*|#)*DETAILED_SUMMARY:?|(?:\*\*|#)*IMAGE_PROMPT:?|$)/i);
    const summaryMatch = text.match(/(?:\*\*|#)*DETAILED_SUMMARY:?(?:\*\*|#)*\s*([\s\S]*?)(?=(?:\*\*|#)*IMAGE_PROMPT:?|$)/i);
    const promptMatch = text.match(/(?:\*\*|#)*IMAGE_PROMPT:?(?:\*\*|#)*\s*([\s\S]*?)$/i);

    const facts = factsMatch ? factsMatch[1].trim().split('\n').map(f => f.replace(/^[-*]\s*/, '').trim()).filter(f => f) : [];
    
    const timeline: TimelineItem[] = [];
    if (timelineMatch) {
      const lines = timelineMatch[1].trim().split('\n');
      lines.forEach(line => {
        const cleanLine = line.replace(/^[-*]\s*/, '');
        const parts = cleanLine.split('|');
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
    const imagePrompt = promptMatch ? promptMatch[1].trim() : `High quality technical infographic about ${topic}, ${style} style`;

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
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio } }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) return `data:image/png;base64,${part.inlineData.data}`;
    throw new Error("IMAGE_GEN_FAILED: The model did not return image data.");
  });
};

export const editInfographicImage = async (currentImageBase64: string, editInstruction: string, aspectRatio: AspectRatio = "16:9"): Promise<string> => {
  return await callWithRetry(async () => {
    const ai = getAi();
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
    throw new Error("IMAGE_EDIT_FAILED: Image modification returned no data.");
  });
};

export const synthesizeNeuralSpeech = async (text: string, voice: 'Kore' | 'Zephyr' = 'Kore'): Promise<string> => {
  return await callWithRetry(async () => {
    const sanitizedText = text
      .replace(/[#*_~`>]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .slice(0, 3000)
      .trim();

    if (!sanitizedText) throw new Error("TTS_EMPTY_TEXT: No readable text found for synthesis.");

    const ai = getAi();
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: sanitizedText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("TTS_DATA_MISSING: Audio synthesis returned no data.");
    return base64Audio;
  });
};

export const streamChatWithGrounding = async (
  topic: string,
  history: ChatMessage[],
  onChunk: (text: string) => void,
  onComplete: (finalText: string, sources: SearchResultItem[]) => void
): Promise<void> => {
  return await callWithRetry(async () => {
    const ai = getAi();
    
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const responseStream = await ai.models.generateContentStream({
      model: PRO_MODEL,
      contents,
      config: {
        systemInstruction: `You are a research assistant for Vizora. Research topic: "${topic}". Ground your answers in facts via Google Search.`,
        tools: [{ googleSearch: {} }],
      },
    });

    let fullText = "";
    const sources: SearchResultItem[] = [];

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
      
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach(c => {
          if (c.web?.uri && c.web?.title) {
            sources.push({ title: c.web.title, url: c.web.uri });
          }
        });
      }
    }

    const uniqueSources = Array.from(new Map(sources.map(s => [s.url, s])).values());
    onComplete(fullText, uniqueSources);
  });
};
