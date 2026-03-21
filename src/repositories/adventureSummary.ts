// @ts-nocheck
import { BaseRepository } from './base';
import type { AdventureSummary, CreateResult, UpdateResult, DeleteResult } from '@/types';

export class AdventureSummaryRepository extends BaseRepository<AdventureSummary> {
  constructor(connection: any) {
    super(connection);
  }

  protected getTableName(): string {
    return 'adventure_summaries';
  }

  async findByAdventureId(adventureId: string): Promise<{ success: boolean; data?: AdventureSummary[]; error?: string }> {
    try {
      const result = await this.connection.all(
        'SELECT * FROM adventure_summaries WHERE adventure_id = ? ORDER BY generated_at DESC',
        [adventureId]
      );
      
      const summaries = result.map(this.rowToEntity);
      return { success: true, data: summaries };
    } catch (error) {
      return { success: false, error: `Failed to find adventure summaries: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async findLatestByAdventureId(adventureId: string): Promise<{ success: boolean; data?: AdventureSummary | null; error?: string }> {
    try {
      const result = await this.connection.get(
        'SELECT * FROM adventure_summaries WHERE adventure_id = ? ORDER BY generated_at DESC LIMIT 1',
        [adventureId]
      );
      
      if (!result) {
        return { success: true, data: null };
      }
      
      const summary = this.rowToEntity(result);
      return { success: true, data: summary };
    } catch (error) {
      return { success: false, error: `Failed to find latest adventure summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async createForAdventure(adventureId: string, summaryText: string, loreUpdateText?: string): Promise<CreateResult<AdventureSummary>> {
    try {
      const summary: Omit<AdventureSummary, 'id'> = {
        adventureId,
        summaryText,
        loreUpdateText,
        generatedAt: new Date().toISOString(),
      };

      return await this.create(summary);
    } catch (error) {
      return { success: false, error: `Failed to create adventure summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async updateSummaryText(summaryId: string, summaryText: string): Promise<UpdateResult<AdventureSummary>> {
    try {
      return await this.update(summaryId, { summaryText });
    } catch (error) {
      return { success: false, error: `Failed to update summary text: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async updateLoreUpdateText(summaryId: string, loreUpdateText: string): Promise<UpdateResult<AdventureSummary>> {
    try {
      return await this.update(summaryId, { loreUpdateText });
    } catch (error) {
      return { success: false, error: `Failed to update lore update text: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Convert database row to AdventureSummary entity
  protected rowToEntity(row: any): AdventureSummary {
    return {
      id: row.id,
      adventureId: row.adventure_id,
      summaryText: row.summary_text,
      loreUpdateText: row.lore_update_text,
      generatedAt: row.generated_at,
    };
  }

  // Convert AdventureSummary entity to database row
  protected entityToRow(entity: AdventureSummary): any {
    const row: any = {
      adventure_id: entity.adventureId,
      summary_text: entity.summaryText,
      generated_at: entity.generatedAt,
    };

    if (entity.loreUpdateText !== undefined) row.lore_update_text = entity.loreUpdateText;

    return row;
  }
}
