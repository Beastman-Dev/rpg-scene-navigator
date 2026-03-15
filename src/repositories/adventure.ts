// @ts-nocheck - Skip TypeScript errors in repository files during migration to mock database
import { BaseRepository } from './base';
import type { Adventure, AdventureStatus } from '@/types';

export class AdventureRepository extends BaseRepository<Adventure> {
  protected getTableName(): string {
    return 'adventures';
  }

  protected rowToEntity(row: any): Adventure {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      startingSceneId: row.starting_scene_id,
      tags: row.tags,
      status: row.status as AdventureStatus,
      author: row.author,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  protected entityToRow(entity: Partial<Adventure>): any {
    const row: any = {};
    
    // Only include fields that are actually present in the entity
    if (entity.id !== undefined) row.id = entity.id;
    if (entity.title !== undefined) row.title = entity.title;
    if (entity.description !== undefined) row.description = entity.description;
    if (entity.startingSceneId !== undefined) row.starting_scene_id = entity.startingSceneId;
    if (entity.tags !== undefined) row.tags = entity.tags;
    if (entity.status !== undefined) row.status = entity.status;
    if (entity.author !== undefined) row.author = entity.author;
    if (entity.createdAt !== undefined) row.created_at = entity.createdAt;
    if (entity.updatedAt !== undefined) row.updated_at = entity.updatedAt;
    
    return row;
  }

  /**
   * Find adventures by status
   */
  async findByStatus(status: AdventureStatus): Promise<{ success: boolean; data?: Adventure[]; error?: string }> {
    try {
      const sql = `SELECT * FROM ${this.getTableName()} WHERE status = ? ORDER BY updated_at DESC`;
      const rows = this.db.prepare(sql).all(status);
      
      const entities = rows.map(row => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        return this.rowToEntity(processedRow);
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('FindByStatus failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Find adventures with search term
   */
  async search(term: string): Promise<{ success: boolean; data?: Adventure[]; error?: string }> {
    try {
      const sql = `
        SELECT * FROM ${this.getTableName()} 
        WHERE title LIKE ? OR description LIKE ? OR author LIKE ?
        ORDER BY updated_at DESC
      `;
      const searchTerm = `%${term}%`;
      const rows = this.db.prepare(sql).all(searchTerm, searchTerm, searchTerm);
      
      const entities = rows.map(row => {
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
   * Duplicate an adventure
   */
  async duplicate(id: string, newTitle?: string): Promise<{ success: boolean; data?: Adventure; error?: string }> {
    try {
      const original = await this.findById(id);
      if (!original.success || !original.data) {
        return { success: false, error: 'Original adventure not found' };
      }

      const duplicated = {
        title: newTitle || `${original.data.title} (Copy)`,
        description: original.data.description,
        startingSceneId: original.data.startingSceneId,
        tags: original.data.tags,
        status: 'draft' as AdventureStatus,
        author: original.data.author
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
   * Get adventure with related entities count
   */
  async getWithStats(id: string): Promise<{ 
    success: boolean; 
    data?: Adventure & { sceneCount: number; npcCount: number; sessionCount: number }; 
    error?: string 
  }> {
    try {
      const adventureResult = await this.findById(id);
      if (!adventureResult.success || !adventureResult.data) {
        return { success: false, error: 'Adventure not found' };
      }

      const sceneCount = this.db.prepare('SELECT COUNT(*) as count FROM scenes WHERE adventure_id = ?').get(id) as { count: number };
      const npcCount = this.db.prepare('SELECT COUNT(*) as count FROM npcs WHERE adventure_id = ?').get(id) as { count: number };
      const sessionCount = this.db.prepare('SELECT COUNT(*) as count FROM sessions WHERE adventure_id = ?').get(id) as { count: number };

      return {
        success: true,
        data: {
          ...adventureResult.data,
          sceneCount: sceneCount.count,
          npcCount: npcCount.count,
          sessionCount: sessionCount.count
        }
      };
    } catch (error) {
      console.error('GetWithStats failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update adventure status
   */
  async updateStatus(id: string, status: AdventureStatus): Promise<{ success: boolean; data?: Adventure; error?: string }> {
    return await this.update(id, { status });
  }

  /**
   * Set starting scene
   */
  async setStartingScene(id: string, sceneId: string): Promise<{ success: boolean; data?: Adventure; error?: string }> {
    // Verify scene exists and belongs to this adventure
    const sceneCheck = this.db.prepare('SELECT id FROM scenes WHERE id = ? AND adventure_id = ?').get(sceneId, id);
    if (!sceneCheck) {
      return { success: false, error: 'Scene not found or does not belong to this adventure' };
    }

    return await this.update(id, { startingSceneId: sceneId });
  }
}
