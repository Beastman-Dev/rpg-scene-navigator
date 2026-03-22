// @ts-nocheck
// Template engine for processing summary templates

import type { SummaryTemplate, TemplateData, GeneratedSummary } from '@/types/summary-templates';
import { log } from '@/utils/logger';

export class SummaryTemplateEngine {
  /**
   * Process a template with provided data
   */
  static processTemplate(template: string, data: TemplateData): string {
    try {
      log.template('processTemplate', 'template_engine', { templateLength: template.length, dataKeys: Object.keys(data) });
      
      // Simple Handlebars-like template processing
      let result = template;

      // Replace simple variables {{variable}}
      result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = data[key as keyof TemplateData];
        if (value === undefined || value === null) {
          log.warn('template', 'Variable not found in data', { key, availableKeys: Object.keys(data) });
          return `[${key} not found]`;
        }
        
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        
        return String(value);
      });

      // Handle {{#each}} blocks for lists
      result = result.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
        const value = data[key as keyof TemplateData];
        
        if (!Array.isArray(value) || value.length === 0) {
          return '';
        }
        
        return value.map(item => {
          return content.replace(/\{\{this\}\}/g, String(item));
        }).join('\n');
      });

      // Handle {{#if}} blocks
      result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
        const value = data[key as keyof TemplateData];
        
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return '';
        }
        
        return content;
      });

      log.template('processTemplate', 'template_engine', { success: true, resultLength: result.length });
      return result;
    } catch (error) {
      log.error('template', 'Template processing failed', error instanceof Error ? error : new Error(String(error)));
      return `Error processing template: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Generate a summary from a template and data
   */
  static generateSummary(
    template: SummaryTemplate,
    data: TemplateData,
    adventureId: string,
    sessionId?: string
  ): GeneratedSummary {
    try {
      log.template('generateSummary', 'template_engine', { 
        templateId: template.id, 
        templateType: template.type,
        adventureId,
        sessionId 
      });

      const content = this.processTemplate(template.template, data);
      
      const summary: GeneratedSummary = {
        id: `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        templateId: template.id,
        adventureId,
        sessionId,
        title: this.generateTitle(template, data),
        content,
        templateData: data,
        generatedAt: new Date().toISOString(),
        type: template.type
      };

      log.template('generateSummary', 'template_engine', { 
        success: true, 
        summaryId: summary.id,
        contentLength: content.length 
      });

      return summary;
    } catch (error) {
      log.error('template', 'Summary generation failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Generate a title for the summary
   */
  private static generateTitle(template: SummaryTemplate, data: TemplateData): string {
    switch (template.type) {
      case 'session':
        return `Session ${data.sessionNumber || '?'}: ${data.adventureTitle}`;
      case 'adventure_completion':
        return `Adventure Complete: ${data.adventureTitle}`;
      case 'character_development':
        return `Character Development: ${data.adventureTitle}`;
      default:
        return `${data.adventureTitle} - ${template.name}`;
    }
  }

  /**
   * Validate template data against required variables
   */
  static validateTemplateData(template: SummaryTemplate, data: TemplateData): { isValid: boolean; missingVariables: string[] } {
    const missingVariables: string[] = [];
    
    for (const variable of template.variables) {
      if (variable.required) {
        const value = data[variable.name as keyof TemplateData];
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
          missingVariables.push(variable.name);
        }
      }
    }

    const isValid = missingVariables.length === 0;
    
    log.template('validateTemplateData', 'template_engine', { 
      templateId: template.id,
      isValid,
      missingVariables,
      requiredCount: template.variables.filter(v => v.required).length
    });

    return { isValid, missingVariables };
  }

  /**
   * Extract template data from session and adventure data
   */
  static extractTemplateData(
    adventure: any,
    session: any,
    scenes: any[],
    sceneRunStates: any[],
    npcs: any[]
  ): TemplateData {
    try {
      log.template('extractTemplateData', 'template_engine', { 
        adventureId: adventure.id,
        sessionId: session?.id,
        scenesCount: scenes.length,
        npcsCount: npcs.length
      });

      // Extract scenes visited from scene run states
      const visitedSceneIds = sceneRunStates.map(state => state.sceneId);
      const visitedScenes = scenes.filter(scene => visitedSceneIds.includes(scene.id));
      
      // Extract NPCs encountered from visited scenes
      const encounteredNpcIds = new Set<string>();
      visitedScenes.forEach(scene => {
        if (scene.sceneNpcRefs) {
          scene.sceneNpcRefs.forEach((ref: any) => {
            encounteredNpcIds.add(ref.npcId);
          });
        }
      });
      
      const encounteredNpcs = npcs.filter(npc => encounteredNpcIds.has(npc.id));

      // Calculate duration
      const duration = this.calculateDuration(session);

      const data: TemplateData = {
        adventureTitle: adventure.title,
        sessionNumber: session?.sessionNumber,
        sessionDate: session?.createdAt ? new Date(session.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        scenesVisited: visitedScenes.map(scene => scene.name),
        npcsEncountered: encounteredNpcs.map(npc => npc.name),
        playerDecisions: this.extractPlayerDecisions(sceneRunStates),
        duration,
        completionStatus: session?.endedAt ? 'completed' : 'in_progress',
        achievements: this.extractAchievements(sceneRunStates),
        loreUpdates: this.extractLoreUpdates(sceneRunStates),
        nextSteps: this.extractNextSteps(sceneRunStates),
        gmNotes: session?.notes || ''
      };

      log.template('extractTemplateData', 'template_engine', { 
        success: true,
        dataKeys: Object.keys(data),
        scenesVisitedCount: data.scenesVisited.length,
        npcsEncounteredCount: data.npcsEncountered.length
      });

      return data;
    } catch (error) {
      log.error('template', 'Template data extraction failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Calculate session duration
   */
  private static calculateDuration(session: any): string {
    if (!session?.createdAt) return 'Unknown';
    
    const start = new Date(session.createdAt);
    const end = session?.endedAt ? new Date(session.endedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Extract player decisions from scene run states
   */
  private static extractPlayerDecisions(sceneRunStates: any[]): string[] {
    const decisions: string[] = [];
    
    sceneRunStates.forEach(state => {
      if (state.exitChoice) {
        decisions.push(`Took ${state.exitChoice} from ${state.sceneId}`);
      }
    });
    
    return decisions;
  }

  /**
   * Extract achievements from scene run states
   */
  private static extractAchievements(sceneRunStates: any[]): string[] {
    const achievements: string[] = [];
    
    sceneRunStates.forEach(state => {
      if (state.achievements) {
        achievements.push(...state.achievements);
      }
    });
    
    return achievements;
  }

  /**
   * Extract lore updates from scene run states
   */
  private static extractLoreUpdates(sceneRunStates: any[]): string[] {
    const loreUpdates: string[] = [];
    
    sceneRunStates.forEach(state => {
      if (state.loreUpdates) {
        loreUpdates.push(...state.loreUpdates);
      }
    });
    
    return loreUpdates;
  }

  /**
   * Extract next steps from scene run states
   */
  private static extractNextSteps(sceneRunStates: any[]): string[] {
    const nextSteps: string[] = [];
    
    sceneRunStates.forEach(state => {
      if (state.nextSteps) {
        nextSteps.push(...state.nextSteps);
      }
    });
    
    return nextSteps;
  }
}
