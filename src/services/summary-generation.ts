// @ts-nocheck
// Service for orchestrating summary generation

import type { Adventure, Session, Scene, NPC, SceneRunState } from '@/types';
import type { SummaryTemplate, TemplateData, GeneratedSummary } from '@/types/summary-templates';
import { SummaryTemplateEngine } from '@/utils/summary-template-engine';
import { log } from '@/utils/logger';

export interface SummaryGenerationOptions {
  templateId?: string;
  includeGmNotes?: boolean;
  customData?: Partial<TemplateData>;
}

export class SummaryGenerationService {
  constructor(
    private templateRepo: any,
    private generatedSummaryRepo: any,
    private adventureRepo: any,
    private sessionRepo: any,
    private sceneRepo: any,
    private npcRepo: any,
    private sceneRunStateRepo: any
  ) {}

  /**
   * Generate a session summary
   */
  async generateSessionSummary(
    adventureId: string,
    sessionId: string,
    options: SummaryGenerationOptions = {}
  ): Promise<{ success: boolean; data?: GeneratedSummary; error?: string }> {
    try {
      log.service('generateSessionSummary', 'summary_generation', { 
        adventureId, 
        sessionId, 
        templateId: options.templateId,
        includeGmNotes: options.includeGmNotes 
      });

      // Get required data
      const adventure = await this.getAdventure(adventureId);
      const session = await this.getSession(sessionId);
      const scenes = await this.getScenes(adventureId);
      const npcs = await this.getNPCs(adventureId);
      const sceneRunStates = await this.getSceneRunStates(sessionId);

      if (!adventure || !session) {
        return { success: false, error: 'Adventure or session not found' };
      }

      // Get template
      const template = await this.getTemplate(options.templateId || 'builtin_standard_session_summary_0', 'session');
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Extract template data
      let templateData = SummaryTemplateEngine.extractTemplateData(
        adventure,
        session,
        scenes,
        sceneRunStates,
        npcs
      );

      // Apply custom options
      if (!options.includeGmNotes) {
        templateData.gmNotes = undefined;
      }

      if (options.customData) {
        templateData = { ...templateData, ...options.customData };
      }

      // Validate template data
      const validation = SummaryTemplateEngine.validateTemplateData(template, templateData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Missing required template data: ${validation.missingVariables.join(', ')}` 
        };
      }

      // Generate summary
      const summary = SummaryTemplateEngine.generateSummary(
        template,
        templateData,
        adventureId,
        sessionId
      );

      // Save summary
      const result = await this.generatedSummaryRepo.createSummary(summary);
      
      log.service('generateSessionSummary', 'summary_generation', { 
        success: result.success,
        summaryId: summary.id,
        templateId: template.id
      });

      return result.success ? { success: true, data: summary } : result;
    } catch (error) {
      log.error('service', 'Session summary generation failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Failed to generate session summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Generate an adventure completion summary
   */
  async generateAdventureCompletionSummary(
    adventureId: string,
    options: SummaryGenerationOptions = {}
  ): Promise<{ success: boolean; data?: GeneratedSummary; error?: string }> {
    try {
      log.service('generateAdventureCompletionSummary', 'summary_generation', { 
        adventureId, 
        templateId: options.templateId,
        includeGmNotes: options.includeGmNotes 
      });

      // Get adventure data
      const adventure = await this.getAdventure(adventureId);
      if (!adventure) {
        return { success: false, error: 'Adventure not found' };
      }

      // Get all sessions for the adventure
      const sessions = await this.getAllSessions(adventureId);
      if (sessions.length === 0) {
        return { success: false, error: 'No sessions found for adventure' };
      }

      // Get related data
      const scenes = await this.getScenes(adventureId);
      const npcs = await this.getNPCs(adventureId);
      const allSceneRunStates = await this.getAllSceneRunStates(adventureId);

      // Get template
      const template = await this.getTemplate(options.templateId || 'builtin_adventure_completion_summary_1', 'adventure_completion');
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Create aggregated template data
      let templateData = this.createAdventureCompletionData(
        adventure,
        sessions,
        scenes,
        npcs,
        allSceneRunStates
      );

      // Apply custom options
      if (!options.includeGmNotes) {
        templateData.gmNotes = undefined;
      }

      if (options.customData) {
        templateData = { ...templateData, ...options.customData };
      }

      // Validate template data
      const validation = SummaryTemplateEngine.validateTemplateData(template, templateData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Missing required template data: ${validation.missingVariables.join(', ')}` 
        };
      }

      // Generate summary
      const summary = SummaryTemplateEngine.generateSummary(
        template,
        templateData,
        adventureId
      );

      // Save summary
      const result = await this.generatedSummaryRepo.createSummary(summary);
      
      log.service('generateAdventureCompletionSummary', 'summary_generation', { 
        success: result.success,
        summaryId: summary.id,
        templateId: template.id,
        totalSessions: sessions.length
      });

      return result.success ? { success: true, data: summary } : result;
    } catch (error) {
      log.error('service', 'Adventure completion summary generation failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Failed to generate adventure completion summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Generate a character development summary
   */
  async generateCharacterDevelopmentSummary(
    adventureId: string,
    sessionId: string,
    options: SummaryGenerationOptions = {}
  ): Promise<{ success: boolean; data?: GeneratedSummary; error?: string }> {
    try {
      log.service('generateCharacterDevelopmentSummary', 'summary_generation', { 
        adventureId, 
        sessionId, 
        templateId: options.templateId,
        includeGmNotes: options.includeGmNotes 
      });

      // Get required data
      const adventure = await this.getAdventure(adventureId);
      const session = await this.getSession(sessionId);
      const scenes = await this.getScenes(adventureId);
      const npcs = await this.getNPCs(adventureId);
      const sceneRunStates = await this.getSceneRunStates(sessionId);

      if (!adventure || !session) {
        return { success: false, error: 'Adventure or session not found' };
      }

      // Get template
      const template = await this.getTemplate(options.templateId || 'builtin_character_development_summary_2', 'character_development');
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Extract template data with focus on character development
      let templateData = SummaryTemplateEngine.extractTemplateData(
        adventure,
        session,
        scenes,
        sceneRunStates,
        npcs
      );

      // Filter for character-focused content
      templateData.playerDecisions = templateData.playerDecisions.filter(decision => 
        decision.toLowerCase().includes('character') || 
        decision.toLowerCase().includes('relationship') ||
        decision.toLowerCase().includes('personal')
      );

      // Apply custom options
      if (!options.includeGmNotes) {
        templateData.gmNotes = undefined;
      }

      if (options.customData) {
        templateData = { ...templateData, ...options.customData };
      }

      // Validate template data
      const validation = SummaryTemplateEngine.validateTemplateData(template, templateData);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: `Missing required template data: ${validation.missingVariables.join(', ')}` 
        };
      }

      // Generate summary
      const summary = SummaryTemplateEngine.generateSummary(
        template,
        templateData,
        adventureId,
        sessionId
      );

      // Save summary
      const result = await this.generatedSummaryRepo.createSummary(summary);
      
      log.service('generateCharacterDevelopmentSummary', 'summary_generation', { 
        success: result.success,
        summaryId: summary.id,
        templateId: template.id
      });

      return result.success ? { success: true, data: summary } : result;
    } catch (error) {
      log.error('service', 'Character development summary generation failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Failed to generate character development summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get available templates for a specific type
   */
  async getAvailableTemplates(type: SummaryTemplate['type']): Promise<{ success: boolean; data?: SummaryTemplate[]; error?: string }> {
    try {
      const result = await this.templateRepo.getTemplatesByType(type);
      return result;
    } catch (error) {
      log.error('service', 'Failed to get available templates', error instanceof Error ? error : new Error(String(error)), { type });
      return { success: false, error: `Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Helper methods

  private async getAdventure(adventureId: string): Promise<Adventure | null> {
    const result = await this.adventureRepo.findById(adventureId);
    return result.success ? result.data || null : null;
  }

  private async getSession(sessionId: string): Promise<Session | null> {
    const result = await this.sessionRepo.findById(sessionId);
    return result.success ? result.data || null : null;
  }

  private async getScenes(adventureId: string): Promise<Scene[]> {
    const result = await this.sceneRepo.findByAdventureId(adventureId);
    return result.success ? result.data || [] : [];
  }

  private async getNPCs(adventureId: string): Promise<NPC[]> {
    const result = await this.npcRepo.findByAdventureId(adventureId);
    return result.success ? result.data || [] : [];
  }

  private async getSceneRunStates(sessionId: string): Promise<SceneRunState[]> {
    const result = await this.sceneRunStateRepo.findBySessionId(sessionId);
    return result.success ? result.data || [] : [];
  }

  private async getAllSessions(adventureId: string): Promise<Session[]> {
    const result = await this.sessionRepo.findByAdventureId(adventureId);
    return result.success ? result.data || [] : [];
  }

  private async getAllSceneRunStates(adventureId: string): Promise<SceneRunState[]> {
    const sessions = await this.getAllSessions(adventureId);
    const allStates: SceneRunState[] = [];
    
    for (const session of sessions) {
      const states = await this.getSceneRunStates(session.id);
      allStates.push(...states);
    }
    
    return allStates;
  }

  private async getTemplate(templateId: string, type: SummaryTemplate['type']): Promise<SummaryTemplate | null> {
    const result = await this.templateRepo.getTemplateById(templateId);
    return result.success ? result.data || null : null;
  }

  private createAdventureCompletionData(
    adventure: Adventure,
    sessions: Session[],
    scenes: Scene[],
    npcs: NPC[],
    sceneRunStates: SceneRunState[]
  ): TemplateData {
    // Aggregate all scene run states
    const allSceneRunStates = sceneRunStates;
    
    // Get all visited scenes
    const visitedSceneIds = allSceneRunStates.map(state => state.sceneId);
    const visitedScenes = scenes.filter(scene => visitedSceneIds.includes(scene.id));
    
    // Get all encountered NPCs
    const encounteredNpcIds = new Set<string>();
    visitedScenes.forEach(scene => {
      if (scene.sceneNpcRefs) {
        scene.sceneNpcRefs.forEach((ref: any) => {
          encounteredNpcIds.add(ref.npcId);
        });
      }
    });
    
    const encounteredNpcs = npcs.filter(npc => encounteredNpcIds.has(npc.id));

    // Calculate total duration
    const totalDuration = this.calculateTotalDuration(sessions);

    // Extract all decisions, achievements, etc.
    const allDecisions = allSceneRunStates.flatMap(state => 
      state.exitChoice ? [`Took ${state.exitChoice}`] : []
    );
    
    const allAchievements = allSceneRunStates.flatMap(state => 
      state.achievements || []
    );
    
    const allLoreUpdates = allSceneRunStates.flatMap(state => 
      state.loreUpdates || []
    );

    return {
      adventureTitle: adventure.title,
      sessionNumber: sessions.length,
      sessionDate: new Date().toLocaleDateString(),
      scenesVisited: visitedScenes.map(scene => scene.name),
      npcsEncountered: encounteredNpcs.map(npc => npc.name),
      playerDecisions: allDecisions,
      duration: totalDuration,
      completionStatus: 'completed',
      achievements: allAchievements,
      loreUpdates: allLoreUpdates,
      nextSteps: ['Adventure completed successfully']
    };
  }

  private calculateTotalDuration(sessions: Session[]): string {
    let totalMinutes = 0;
    
    sessions.forEach(session => {
      if (session.createdAt) {
        const start = new Date(session.createdAt);
        const end = session.endedAt ? new Date(session.endedAt) : new Date();
        const duration = end.getTime() - start.getTime();
        totalMinutes += Math.floor(duration / (1000 * 60));
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m total`;
    }
    return `${minutes}m total`;
  }
}
