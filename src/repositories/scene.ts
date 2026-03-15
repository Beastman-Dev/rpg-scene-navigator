// @ts-nocheck
import { BaseRepository } from './base';
import type { Scene, SceneType, SceneNpcRef, ExitOption } from '@/types';

export class SceneRepository extends BaseRepository<Scene> {
  protected getTableName(): string {
    return 'scenes';
  }

  protected rowToEntity(row: any): Scene {
    return {
      id: row.id,
      name: row.name,
      type: row.type as SceneType,
      location: row.location,
      tags: row.tags,
      summary: row.summary,
      gmDescription: row.gm_description,
      readAloud: row.read_aloud,
      atmosphere: row.atmosphere,
      entryConditions: row.entry_conditions,
      objectives: row.objectives,
      complications: row.complications,
      clues: row.clues,
      interactiveElements: row.interactive_elements,
      failureStates: row.failure_states,
      successStates: row.success_states,
      rewards: row.rewards,
      factions: row.factions,
      sceneNpcRefs: row.scene_npcs,
      exitOptions: row.exit_options,
      canEndSessionHere: row.can_end_session_here,
      sortOrder: row.sort_order,
      adventureId: row.adventure_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  protected entityToRow(entity: Partial<Scene>): any {
    const row: any = {};
    
    // Only include fields that are actually present in the entity
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.name !== undefined) row.name = entity.name;
    if (entity.type !== undefined) row.type = entity.type;
    if (entity.location !== undefined) row.location = entity.location;
    if (entity.tags !== undefined) row.tags = entity.tags;
    if (entity.summary !== undefined) row.summary = entity.summary;
    if (entity.gmDescription !== undefined) row.gm_description = entity.gmDescription;
    if (entity.readAloud !== undefined) row.read_aloud = entity.readAloud;
    if (entity.atmosphere !== undefined) row.atmosphere = entity.atmosphere;
    if (entity.entryConditions !== undefined) row.entry_conditions = entity.entryConditions;
    if (entity.objectives !== undefined) row.objectives = entity.objectives;
    if (entity.complications !== undefined) row.complications = entity.complications;
    if (entity.clues !== undefined) row.clues = entity.clues;
    if (entity.interactiveElements !== undefined) row.interactive_elements = entity.interactiveElements;
    if (entity.failureStates !== undefined) row.failure_states = entity.failureStates;
    if (entity.successStates !== undefined) row.success_states = entity.successStates;
    if (entity.rewards !== undefined) row.rewards = entity.rewards;
    if (entity.factions !== undefined) row.factions = entity.factions;
    if (entity.canEndSessionHere !== undefined) row.can_end_session_here = entity.canEndSessionHere;
    if (entity.sortOrder !== undefined) row.sort_order = entity.sortOrder;
    if (entity.adventureId !== undefined) row.adventure_id = entity.adventureId;
    if (entity.exitOptions !== undefined) row.exit_options = entity.exitOptions;
    if (entity.sceneNpcRefs !== undefined) row.scene_npcs = entity.sceneNpcRefs;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    
    return row;
  }

  /**
   * Find scenes by adventure ID
   */
  async findByAdventure(adventureId: string): Promise<{ success: boolean; data?: Scene[]; error?: string }> {
    try {
      const sql = `SELECT * FROM scenes WHERE adventure_id = ? ORDER BY sort_order, created_at`;
      const rows = this.db.prepare(sql).all(adventureId);
      
      const entities = rows.map(row => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        processedRow = this.parseBooleanFields(processedRow, this.getTableName());
        return this.rowToEntity(processedRow);
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('FindByAdventure failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Find scenes by type
   */
  async findByType(type: SceneType): Promise<{ success: boolean; data?: Scene[]; error?: string }> {
    try {
      const sql = `SELECT * FROM ${this.getTableName()} WHERE type = ? ORDER BY adventure_id, sort_order`;
      const rows = this.db.prepare(sql).all(type);
      
      const entities = rows.map((row: any) => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        processedRow = this.parseBooleanFields(processedRow, this.getTableName());
        return this.rowToEntity(processedRow);
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('FindByType failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Add NPC to scene
   */
  async addNpc(sceneId: string, npcRef: Omit<SceneNpcRef, 'npcId'> & { npcId: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const sql = `
        INSERT OR REPLACE INTO scene_npcs (id, scene_id, npc_id, presence_role, is_hostile, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const id = crypto.randomUUID();
      this.db.prepare(sql).run(
        id,
        sceneId,
        npcRef.npcId,
        npcRef.presenceRole,
        npcRef.isHostile ? 1 : 0,
        npcRef.notes
      );

      return { success: true };
    } catch (error) {
      console.error('AddNpc failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove NPC from scene
   */
  async removeNpc(sceneId: string, npcId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sql = `DELETE FROM scene_npcs WHERE scene_id = ? AND npc_id = ?`;
      const result = this.db.prepare(sql).run(sceneId, npcId);
      
      return { success: true };
    } catch (error) {
      console.error('RemoveNpc failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Add exit option to scene
   */
  async addExitOption(sceneId: string, exitOption: Omit<ExitOption, 'id'>): Promise<{ success: boolean; data?: ExitOption; error?: string }> {
    try {
      // Verify destination scene exists
      const destExists = this.db.prepare('SELECT id FROM scenes WHERE id = ?').get(exitOption.destinationSceneId);
      if (!destExists) {
        return { success: false, error: 'Destination scene not found' };
      }

      const id = crypto.randomUUID();
      const sql = `
        INSERT INTO exit_options (id, scene_id, label, destination_scene_id, condition_text, result_text, state_changes, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      this.db.prepare(sql).run(
        id,
        sceneId,
        exitOption.label,
        exitOption.destinationSceneId,
        exitOption.conditionText,
        exitOption.resultText,
        JSON.stringify(exitOption.stateChanges || []),
        exitOption.sortOrder || 0
      );

      const newExitOption: ExitOption = {
        id,
        ...exitOption
      };

      return { success: true, data: newExitOption };
    } catch (error) {
      console.error('AddExitOption failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update exit option
   */
  async updateExitOption(exitOption: Partial<ExitOption> & { id: string }): Promise<{ success: boolean; error?: string }> {
    try {
      if (exitOption.destinationSceneId) {
        // Verify destination scene exists
        const destExists = this.db.prepare('SELECT id FROM scenes WHERE id = ?').get(exitOption.destinationSceneId);
        if (!destExists) {
          return { success: false, error: 'Destination scene not found' };
        }
      }

      const updates: string[] = [];
      const values: any[] = [];

      if (exitOption.label !== undefined) {
        updates.push('label = ?');
        values.push(exitOption.label);
      }
      if (exitOption.destinationSceneId !== undefined) {
        updates.push('destination_scene_id = ?');
        values.push(exitOption.destinationSceneId);
      }
      if (exitOption.conditionText !== undefined) {
        updates.push('condition_text = ?');
        values.push(exitOption.conditionText);
      }
      if (exitOption.resultText !== undefined) {
        updates.push('result_text = ?');
        values.push(exitOption.resultText);
      }
      if (exitOption.stateChanges !== undefined) {
        updates.push('state_changes = ?');
        values.push(JSON.stringify(exitOption.stateChanges));
      }
      if (exitOption.sortOrder !== undefined) {
        updates.push('sort_order = ?');
        values.push(exitOption.sortOrder);
      }

      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      values.push(exitOption.id);
      
      const sql = `UPDATE exit_options SET ${updates.join(', ')} WHERE id = ?`;
      this.db.prepare(sql).run(...values);

      return { success: true };
    } catch (error) {
      console.error('UpdateExitOption failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove exit option
   */
  async removeExitOption(exitOptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sql = `DELETE FROM exit_options WHERE id = ?`;
      this.db.prepare(sql).run(exitOptionId);
      
      return { success: true };
    } catch (error) {
      console.error('RemoveExitOption failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Reorder scenes
   */
  async reorder(sceneIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = this.db.transaction(() => {
        sceneIds.forEach((sceneId, index) => {
          const sql = `UPDATE ${this.getTableName()} SET sort_order = ?, updated_at = ? WHERE id = ?`;
          this.db.prepare(sql).run(index, new Date().toISOString(), sceneId);
        });
      });

      transaction();
      return { success: true };
    } catch (error) {
      console.error('Reorder failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
