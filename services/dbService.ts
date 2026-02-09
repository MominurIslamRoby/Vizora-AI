
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { supabase } from './supabase';
import { GeneratedImage } from '../types';

export const saveVisionToDb = async (vision: GeneratedImage, userId: string) => {
  const { data, error } = await supabase
    .from('visions')
    .insert([
      {
        user_id: userId,
        data: vision.data,
        prompt: vision.prompt,
        detailed_summary: vision.detailedSummary,
        level: vision.level,
        style: vision.style,
        language: vision.language,
        timeline: vision.timeline,
        is_deep_dive: vision.isDeepDive,
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
};

export const fetchUserVisions = async (userId: string) => {
  const { data, error } = await supabase
    .from('visions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map((v: any) => ({
    id: v.id,
    data: v.data,
    prompt: v.prompt,
    timestamp: new Date(v.created_at).getTime(),
    level: v.level,
    style: v.style,
    language: v.language,
    detailedSummary: v.detailed_summary,
    timeline: v.timeline,
    isDeepDive: v.is_deep_dive,
  }));
};

export const deleteVision = async (visionId: string) => {
  const { error } = await supabase
    .from('visions')
    .delete()
    .eq('id', visionId);
  if (error) throw error;
};

export const toggleWorkspaceItem = async (userId: string, visionId: string) => {
  const { data: existing } = await supabase
    .from('workspace')
    .select('id')
    .eq('user_id', userId)
    .eq('vision_id', visionId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('workspace')
      .delete()
      .eq('id', existing.id);
    if (error) throw error;
    return false; // Removed
  } else {
    const { error } = await supabase
      .from('workspace')
      .insert([{ user_id: userId, vision_id: visionId }]);
    if (error) throw error;
    return true; // Added
  }
};

export const fetchWorkspaceVisions = async (userId: string) => {
  const { data, error } = await supabase
    .from('workspace')
    .select(`
      vision_id,
      visions (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return data
    .filter((item: any) => item.visions) 
    .map((item: any) => ({
      id: item.visions.id,
      data: item.visions.data,
      prompt: item.visions.prompt,
      timestamp: new Date(item.visions.created_at).getTime(),
      level: item.visions.level,
      style: item.visions.style,
      language: item.visions.language,
    }));
};

/**
 * Deletes all visions for a user EXCEPT for the specified current vision ID.
 */
export const clearArchivesFromDb = async (userId: string, excludeVisionId: string) => {
  // We use the 'not' filter explicitly to avoid type mismatch issues with some UUID implementations
  const { error } = await supabase
    .from('visions')
    .delete()
    .match({ user_id: userId })
    .not('id', 'eq', excludeVisionId);
  
  if (error) throw error;
};

export const clearAllUserHistory = async (userId: string) => {
  const { error } = await supabase
    .from('visions')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
};
