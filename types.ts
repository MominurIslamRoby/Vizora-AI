
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
export type AspectRatio = '16:9' | '9:16' | '1:1';
export type ComplexityLevel = 'Elementary' | 'High School' | 'College' | 'Expert';
export type VisualStyle = 'Default' | 'Minimalist' | 'Realistic' | 'Cartoon' | 'Vintage' | 'Futuristic' | '3D Render' | 'Sketch';
export type Language = 'English' | 'Spanish' | 'French' | 'German' | 'Mandarin' | 'Japanese' | 'Hindi' | 'Arabic' | 'Portuguese' | 'Russian' | 'Bengali';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: SearchResultItem[];
}

export interface TimelineItem {
  year: string;
  event: string;
  description: string;
}

export interface KnowledgeEntry {
  topic: string;
  level: ComplexityLevel;
  concepts: string[];
  timestamp: number;
}

export interface UserMemory {
  knowledgeGraph: KnowledgeEntry[];
  preferredLevel: ComplexityLevel;
}

export interface GeneratedImage {
  id: string;
  data: string;
  prompt: string;
  timestamp: number;
  level?: ComplexityLevel;
  style?: VisualStyle;
  language?: Language;
  detailedSummary?: string;
  isDeepDive?: boolean;
  timeline?: TimelineItem[];
}

export interface SearchResultItem {
  title: string;
  url: string;
}

export interface ResearchResult {
  imagePrompt: string;
  facts: string[];
  detailedSummary: string;
  searchResults: SearchResultItem[];
  timeline: TimelineItem[];
}
