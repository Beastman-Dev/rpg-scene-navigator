// @ts-nocheck
// Repository for managing generated summaries

import { BaseRepository } from './base';
import type { GeneratedSummary, CreateResult, UpdateResult, DeleteResult } from '@/types/summary-templates';
import { log } from '@/utils/logger';

export class GeneratedSummaryRepository extends BaseRepository<GeneratedSummary> {
  constructor(connection: any) {
    super(connection);
  }

  protected getTableName(): string {
    return 'generated_summaries';
  }

  /**
   * Get summaries by adventure ID
   */
  async findByAdventureId(adventureId: string): Promise<{ success: boolean; data?: GeneratedSummary[]; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      const result = this.db.prepare(
        'SELECT * FROM generated_summaries WHERE adventure_id = ? ORDER BY generated_at DESC'
      ).all(adventureId);
      
      const summaries = result.map(this.rowToEntity);
      
      log.repository('findByAdventureId', 'generated_summaries', { 
        adventureId,
        count: summaries.length
      });

      return { success: true, data: summaries };
    } catch (error) {
      log.error('repository', 'findByAdventureId failed', error instanceof Error ? error : new Error(String(error)), { adventureId });
      return { success: false, error: `Failed to find summaries: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get summaries by session ID
   */
  async findBySessionId(sessionId: string): Promise<{ success: boolean; data?: GeneratedSummary[]; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      const result = this.db.prepare(
        'SELECT * FROM generated_summaries WHERE session_id = ? ORDER BY generated_at DESC'
      ).all(sessionId);
      
      const summaries = result.map(this.rowToEntity);
      
      log.repository('findBySessionId', 'generated_summaries', { 
        sessionId,
        count: summaries.length
      });

      return { success: true, data: summaries };
    } catch (error) {
      log.error('repository', 'findBySessionId failed', error instanceof Error ? error : new Error(String(error)), { sessionId });
      return { success: false, error: `Failed to find summaries: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get summaries by type
   */
  async findByType(type: GeneratedSummary['type']): Promise<{ success: boolean; data?: GeneratedSummary[]; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      const result = this.db.prepare(
        'SELECT * FROM generated_summaries WHERE type = ? ORDER BY generated_at DESC'
      ).all(type);
      
      const summaries = result.map(this.rowToEntity);
      
      log.repository('findByType', 'generated_summaries', { 
        type,
        count: summaries.length
      });

      return { success: true, data: summaries };
    } catch (error) {
      log.error('repository', 'findByType failed', error instanceof Error ? error : new Error(String(error)), { type });
      return { success: false, error: `Failed to find summaries by type: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get latest summary for an adventure
   */
  async findLatestByAdventureId(adventureId: string): Promise<{ success: boolean; data?: GeneratedSummary | null; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      const result = this.db.prepare(
        'SELECT * FROM generated_summaries WHERE adventure_id = ? ORDER BY generated_at DESC LIMIT 1'
      ).get(adventureId);
      
      if (!result) {
        log.repository('findLatestByAdventureId', 'generated_summaries', { adventureId, found: false });
        return { success: true, data: null };
      }

      const summary = this.rowToEntity(result);
      log.repository('findLatestByAdventureId', 'generated_summaries', { adventureId, found: true, summaryId: summary.id });
      return { success: true, data: summary };
    } catch (error) {
      log.error('repository', 'findLatestByAdventureId failed', error instanceof Error ? error : new Error(String(error)), { adventureId });
      return { success: false, error: `Failed to find latest summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Create a generated summary
   */
  async createSummary(summary: Omit<GeneratedSummary, 'id'>): Promise<CreateResult<GeneratedSummary>> {
    try {
      const result = await this.create(summary);
      
      log.repository('createSummary', 'generated_summaries', { 
        success: result.success,
        summaryId: result.data?.id,
        templateId: summary.templateId,
        adventureId: summary.adventureId,
        type: summary.type
      });

      return result;
    } catch (error) {
      log.error('repository', 'createSummary failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Failed to create summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Update summary content
   */
  async updateSummaryContent(summaryId: string, content: string): Promise<UpdateResult<GeneratedSummary>> {
    try {
      const result = await this.update(summaryId, { content });
      
      log.repository('updateSummaryContent', 'generated_summaries', { 
        success: result.success,
        summaryId,
        contentLength: content.length
      });

      return result;
    } catch (error) {
      log.error('repository', 'updateSummaryContent failed', error instanceof Error ? error : new Error(String(error)), { summaryId });
      return { success: false, error: `Failed to update summary content: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Update summary title
   */
  async updateSummaryTitle(summaryId: string, title: string): Promise<UpdateResult<GeneratedSummary>> {
    try {
      const result = await this.update(summaryId, { title });
      
      log.repository('updateSummaryTitle', 'generated_summaries', { 
        success: result.success,
        summaryId,
        title
      });

      return result;
    } catch (error) {
      log.error('repository', 'updateSummaryTitle failed', error instanceof Error ? error : new Error(String(error)), { summaryId });
      return { success: false, error: `Failed to update summary title: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Delete a summary
   */
  async deleteSummary(summaryId: string): Promise<DeleteResult> {
    try {
      const result = await this.delete(summaryId);
      
      log.repository('deleteSummary', 'generated_summaries', { 
        success: result.success,
        summaryId
      });

      return result;
    } catch (error) {
      log.error('repository', 'deleteSummary failed', error instanceof Error ? error : new Error(String(error)), { summaryId });
      return { success: false, error: `Failed to delete summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get summary statistics
   */
  async getStatistics(adventureId?: string): Promise<{ success: boolean; data?: SummaryStatistics; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      let query = 'SELECT type, COUNT(*) as count FROM generated_summaries';
      let params: any[] = [];
      
      if (adventureId) {
        query += ' WHERE adventure_id = ?';
        params.push(adventureId);
      }
      
      query += ' GROUP BY type';

      const result = this.db.prepare(query).all(...params);
      
      const statistics: SummaryStatistics = {
        totalSummaries: 0,
        sessionSummaries: 0,
        adventureCompletionSummaries: 0,
        characterDevelopmentSummaries: 0
      };

      result.forEach((row: any) => {
        statistics.totalSummaries += row.count;
        
        switch (row.type) {
          case 'session':
            statistics.sessionSummaries = row.count;
            break;
          case 'adventure_completion':
            statistics.adventureCompletionSummaries = row.count;
            break;
          case 'character_development':
            statistics.characterDevelopmentSummaries = row.count;
            break;
        }
      });

      log.repository('getStatistics', 'generated_summaries', { 
        adventureId,
        statistics
      });

      return { success: true, data: statistics };
    } catch (error) {
      log.error('repository', 'getStatistics failed', error instanceof Error ? error : new Error(String(error)), { adventureId });
      return { success: false, error: `Failed to get statistics: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Convert database row to GeneratedSummary entity
  protected rowToEntity(row: any): GeneratedSummary {
    return {
      id: row.id,
      templateId: row.template_id,
      adventureId: row.adventure_id,
      sessionId: row.session_id,
      title: row.title,
      content: row.content,
      templateData: JSON.parse(row.template_data || '{}'),
      generatedAt: row.generated_at,
      type: row.type
    };
  }

  // Convert GeneratedSummary entity to database row
  protected entityToRow(entity: Omit<GeneratedSummary, 'id'>): any {
    const row: any = {
      template_id: entity.templateId,
      adventure_id: entity.adventureId,
      title: entity.title,
      content: entity.content,
      template_data: JSON.stringify(entity.templateData),
      generated_at: entity.generatedAt,
      type: entity.type
    };

    if (entity.sessionId !== undefined) row.session_id = entity.sessionId;

    return row;
  }
}

export interface SummaryStatistics {
  totalSummaries: number;
  sessionSummaries: number;
  adventureCompletionSummaries: number;
  characterDevelopmentSummaries: number;
}
