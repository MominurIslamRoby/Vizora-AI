
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { UserMemory, ComplexityLevel, KnowledgeEntry } from '../types';

const STORAGE_KEY = 'vizora_neural_memory';

const DEFAULT_MEMORY: UserMemory = {
  knowledgeGraph: [],
  preferredLevel: 'High School'
};

export const getMemory = (): UserMemory => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_MEMORY;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_MEMORY;
  }
};

export const saveMemory = (memory: UserMemory) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
};

export const resetMemory = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const updateMemoryFromResearch = (topic: string, level: ComplexityLevel, concepts: string[]) => {
  const memory = getMemory();
  
  // Update Knowledge Graph
  const existing = memory.knowledgeGraph.find(e => e.topic.toLowerCase() === topic.toLowerCase());
  if (existing) {
    existing.concepts = Array.from(new Set([...existing.concepts, ...concepts]));
    existing.level = level;
    existing.timestamp = Date.now();
  } else {
    memory.knowledgeGraph.push({
      topic,
      level,
      concepts,
      timestamp: Date.now()
    });
  }

  // Determine Preferred Level based on last 5 entries
  const lastEntries = memory.knowledgeGraph.slice(-5);
  const levels = lastEntries.map(e => e.level);
  const mostFrequent = levels.sort((a,b) =>
    levels.filter(v => v===a).length - levels.filter(v => v===b).length
  ).pop();
  
  if (mostFrequent) memory.preferredLevel = mostFrequent;
  
  saveMemory(memory);
};

export const getContextForPrompt = (topic: string): string => {
  const memory = getMemory();
  const relevant = memory.knowledgeGraph.find(e => 
    topic.toLowerCase().includes(e.topic.toLowerCase()) || 
    e.topic.toLowerCase().includes(topic.toLowerCase())
  );

  if (!relevant) return "";

  return `
    CONTINUITY CONTEXT: 
    The user has already explored this or a related topic at a ${relevant.level} level. 
    Known concepts: ${relevant.concepts.join(', ')}. 
    Avoid repeating basic definitions for these concepts. Bridge your research to this existing knowledge.
  `;
};
