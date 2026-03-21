// @ts-nocheck
import { BaseRepository } from './base';
import type { Session, CreateResult, UpdateResult, DeleteResult } from '@/types';
import { log } from '@/utils/logger';

export class SessionRepository extends BaseRepository<Session> {
  constructor(connection: any) {
    super(connection);
  }

  protected getTableName(): string {
    return 'sessions';
  }

  async findByAdventureId(adventureId: string): Promise<{ success: boolean; data?: Session[]; error?: string }> {
    try {
      log.repository('findByAdventureId', 'sessions', { adventureId });
      
      const result = await this.connection.all(
        'SELECT * FROM sessions WHERE adventure_id = ? ORDER BY session_number DESC',
        [adventureId]
      );
      
      const sessions = result.map(this.rowToEntity);
      log.repository('findByAdventureId', 'sessions', { adventureId, count: sessions.length });
      return { success: true, data: sessions };
    } catch (error) {
      log.error('session', `findByAdventureId failed`, error instanceof Error ? error : new Error(String(error)), { adventureId });
      return { success: false, error: `Failed to find sessions: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async findLatestByAdventureId(adventureId: string): Promise<{ success: boolean; data?: Session | null; error?: string }> {
    try {
      log.repository('findLatestByAdventureId', 'sessions', { adventureId });
      
      const result = await this.connection.get(
        'SELECT * FROM sessions WHERE adventure_id = ? ORDER BY session_number DESC LIMIT 1',
        [adventureId]
      );
      
      if (!result) {
        log.repository('findLatestByAdventureId', 'sessions', { adventureId, found: false });
        return { success: true, data: null };
      }
      
      const session = this.rowToEntity(result);
      log.repository('findLatestByAdventureId', 'sessions', { adventureId, found: true, sessionId: session.id });
      return { success: true, data: session };
    } catch (error) {
      log.error('session', `findLatestByAdventureId failed`, error instanceof Error ? error : new Error(String(error)), { adventureId });
      return { success: false, error: `Failed to find latest session: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async getNextSessionNumber(adventureId: string): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const result = await this.connection.get(
        'SELECT MAX(session_number) as max_number FROM sessions WHERE adventure_id = ?',
        [adventureId]
      );
      
      const nextNumber = (result?.max_number || 0) + 1;
      return { success: true, data: nextNumber };
    } catch (error) {
      return { success: false, error: `Failed to get next session number: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async createWithSessionNumber(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreateResult<Session>> {
    try {
      // Get next session number
      const sessionNumberResult = await this.getNextSessionNumber(session.adventureId);
      if (!sessionNumberResult.success) {
        return { success: false, error: sessionNumberResult.error };
      }

      const sessionWithNumber = {
        ...session,
        sessionNumber: sessionNumberResult.data!,
        startedAt: session.startedAt || new Date().toISOString(),
      };

      return await this.create(sessionWithNumber);
    } catch (error) {
      return { success: false, error: `Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async endSession(sessionId: string, endingSceneId?: string, isAdventureComplete?: boolean): Promise<UpdateResult<Session>> {
    try {
      const updateData: any = {
        endedAt: new Date().toISOString(),
      };

      if (endingSceneId) {
        updateData.endingSceneId = endingSceneId;
      }

      if (isAdventureComplete !== undefined) {
        updateData.isAdventureComplete = isAdventureComplete;
      }

      return await this.update(sessionId, updateData);
    } catch (error) {
      return { success: false, error: `Failed to end session: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async updateCurrentScene(sessionId: string, currentSceneId: string): Promise<UpdateResult<Session>> {
    try {
      return await this.update(sessionId, { currentSceneId });
    } catch (error) {
      return { success: false, error: `Failed to update current scene: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async updateSummary(sessionId: string, summary: string): Promise<UpdateResult<Session>> {
    try {
      return await this.update(sessionId, { summary });
    } catch (error) {
      return { success: false, error: `Failed to update session summary: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Convert database row to Session entity
  protected rowToEntity(row: any): Session {
    return {
      id: row.id,
      adventureId: row.adventure_id,
      sessionNumber: row.session_number,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      startingSceneId: row.starting_scene_id,
      currentSceneId: row.current_scene_id,
      endingSceneId: row.ending_scene_id,
      isAdventureComplete: Boolean(row.is_adventure_complete),
      summary: row.summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Convert Session entity to database row
  protected entityToRow(entity: Session): any {
    const row: any = {
      adventure_id: entity.adventureId,
      session_number: entity.sessionNumber,
      starting_scene_id: entity.startingSceneId,
      current_scene_id: entity.currentSceneId,
      is_adventure_complete: entity.isAdventureComplete ? 1 : 0,
    };

    if (entity.startedAt !== undefined) row.started_at = entity.startedAt;
    if (entity.endedAt !== undefined) row.ended_at = entity.endedAt;
    if (entity.endingSceneId !== undefined) row.ending_scene_id = entity.endingSceneId;
    if (entity.summary !== undefined) row.summary = entity.summary;

    return row;
  }
}
