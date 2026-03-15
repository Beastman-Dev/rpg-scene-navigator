// @ts-nocheck
import { BaseRepository } from './base';
import type { NPC, StatBlock } from '@/types';

export class NPCRepository extends BaseRepository<NPC> {
  protected getTableName(): string {
    return 'npcs';
  }

  protected rowToEntity(row: any): NPC {
    return {
      id: row.id,
      name: row.name,
      role: row.role,
      description: row.description,
      faction: row.faction,
      statBlock: row.stat_block,
      notes: row.notes,
      tags: row.tags,
      adventureId: row.adventure_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  protected entityToRow(entity: Partial<NPC>): any {
    return {
      id: entity.id,
      name: entity.name,
      role: entity.role,
      description: entity.description,
      faction: entity.faction,
      stat_block: entity.statBlock,
      notes: entity.notes,
      tags: entity.tags,
      adventure_id: entity.adventureId,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Find NPCs by adventure ID
   */
  async findByAdventure(adventureId: string): Promise<{ success: boolean; data?: NPC[]; error?: string }> {
    try {
      const sql = `SELECT * FROM ${this.getTableName()} WHERE adventure_id = ? ORDER BY name`;
      const rows = this.db.prepare(sql).all(adventureId);
      
      const entities = rows.map((row: any) => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
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
   * Find NPCs by faction
   */
  async findByFaction(faction: string): Promise<{ success: boolean; data?: NPC[]; error?: string }> {
    try {
      const sql = `SELECT * FROM ${this.getTableName()} WHERE faction = ? ORDER BY adventure_id, name`;
      const rows = this.db.prepare(sql).all(faction);
      
      const entities = rows.map((row: any) => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        return this.rowToEntity(processedRow);
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('FindByFaction failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Search NPCs by name or description
   */
  async search(adventureId: string, term: string): Promise<{ success: boolean; data?: NPC[]; error?: string }> {
    try {
      const sql = `
        SELECT * FROM ${this.getTableName()} 
        WHERE adventure_id = ? AND (name LIKE ? OR description LIKE ? OR role LIKE ?)
        ORDER BY name
      `;
      const searchTerm = `%${term}%`;
      const rows = this.db.prepare(sql).all(adventureId, searchTerm, searchTerm, searchTerm);
      
      const entities = rows.map((row: any) => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        return this.rowToEntity(processedRow);
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('Search failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update NPC stat block
   */
  async updateStatBlock(id: string, statBlock: StatBlock): Promise<{ success: boolean; data?: NPC; error?: string }> {
    return await this.update(id, { 
      statBlock,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get all unique factions across all adventures
   */
  async getAllFactions(): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const sql = `SELECT DISTINCT faction FROM ${this.getTableName()} WHERE faction IS NOT NULL AND faction != '' ORDER BY faction`;
      const rows = this.db.prepare(sql).all() as { faction: string }[];
      
      const factions = rows.map(row => row.faction);
      return { success: true, data: factions };
    } catch (error) {
      console.error('GetAllFactions failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get NPCs that appear in a specific scene
   */
  async findByScene(sceneId: string): Promise<{ success: boolean; data?: (NPC & { sceneNpcRef: any })[]; error?: string }> {
    try {
      const sql = `
        SELECT n.*, 
               sn.presence_role,
               sn.is_hostile,
               sn.notes as scene_notes
        FROM npcs n
        INNER JOIN scene_npcs sn ON n.id = sn.npc_id
        WHERE sn.scene_id = ?
        ORDER BY n.name
      `;
      
      const rows = this.db.prepare(sql).all(sceneId);
      
      const entities = rows.map((row: any) => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        const npc = this.rowToEntity(processedRow);
        
        return {
          ...npc,
          sceneNpcRef: {
            presenceRole: row.presence_role,
            isHostile: Boolean(row.is_hostile),
            notes: row.scene_notes
          }
        };
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('FindByScene failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Duplicate an NPC (useful for creating similar NPCs)
   */
  async duplicate(id: string, newName?: string): Promise<{ success: boolean; data?: NPC; error?: string }> {
    try {
      const original = await this.findById(id);
      if (!original.success || !original.data) {
        return { success: false, error: 'Original NPC not found' };
      }

      const duplicated = {
        name: newName || `${original.data.name} (Copy)`,
        role: original.data.role,
        description: original.data.description,
        faction: original.data.faction,
        statBlock: original.data.statBlock,
        notes: original.data.notes,
        tags: original.data.tags,
        adventureId: original.data.adventureId
      };

      return await this.create(duplicated);
    } catch (error) {
      console.error('Duplicate failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get NPCs count by adventure
   */
  async getCountByAdventure(adventureId: string): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${this.getTableName()} WHERE adventure_id = ?`;
      const result = this.db.prepare(sql).get(adventureId) as { count: number };
      return result.count;
    } catch (error) {
      console.error('GetCountByAdventure failed:', error);
      return 0;
    }
  }

  /**
   * Get NPCs with their scene appearances
   */
  async getWithSceneAppearances(adventureId: string): Promise<{ 
    success: boolean; 
    data?: (NPC & { sceneAppearances: { sceneId: string; sceneName: string; presenceRole?: string }[] })[]; 
    error?: string 
  }> {
    try {
      const sql = `
        SELECT n.*, 
               JSON_GROUP_ARRAY(
                 JSON_OBJECT(
                   'sceneId', s.id,
                   'sceneName', s.name,
                   'presenceRole', sn.presence_role
                 )
               ) as scene_appearances
        FROM npcs n
        LEFT JOIN scene_npcs sn ON n.id = sn.npc_id
        LEFT JOIN scenes s ON sn.scene_id = s.id
        WHERE n.adventure_id = ?
        GROUP BY n.id
        ORDER BY n.name
      `;
      
      const rows = this.db.prepare(sql).all(adventureId);
      
      const entities = rows.map((row: any) => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        const npc = this.rowToEntity(processedRow);
        
        // Parse scene appearances
        let sceneAppearances = [];
        if (row.scene_appearances) {
          sceneAppearances = JSON.parse(row.scene_appearances).filter((appearance: any) => appearance.sceneId);
        }
        
        return {
          ...npc,
          sceneAppearances
        };
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('GetWithSceneAppearances failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
