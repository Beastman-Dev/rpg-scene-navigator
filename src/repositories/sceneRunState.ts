// @ts-nocheck
import { BaseRepository } from './base';
import type { SceneRunState, CreateResult, UpdateResult, DeleteResult } from '@/types';

export class SceneRunStateRepository extends BaseRepository<SceneRunState> {
  constructor(connection: any) {
    super(connection);
  }

  protected getTableName(): string {
    return 'scene_run_states';
  }

  async findBySessionId(sessionId: string): Promise<{ success: boolean; data?: SceneRunState[]; error?: string }> {
    try {
      const result = await this.connection.all(
        'SELECT * FROM scene_run_states WHERE session_id = ? ORDER BY entered_at ASC',
        [sessionId]
      );
      
      const sceneRunStates = result.map(this.rowToEntity);
      return { success: true, data: sceneRunStates };
    } catch (error) {
      return { success: false, error: `Failed to find scene run states: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async findBySessionIdAndSceneId(sessionId: string, sceneId: string): Promise<{ success: boolean; data?: SceneRunState | null; error?: string }> {
    try {
      const result = await this.connection.get(
        'SELECT * FROM scene_run_states WHERE session_id = ? AND scene_id = ?',
        [sessionId, sceneId]
      );
      
      if (!result) {
        return { success: true, data: null };
      }
      
      const sceneRunState = this.rowToEntity(result);
      return { success: true, data: sceneRunState };
    } catch (error) {
      return { success: false, error: `Failed to find scene run state: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async enterScene(sessionId: string, sceneId: string): Promise<CreateResult<SceneRunState>> {
    try {
      // Check if scene run state already exists for this session and scene
      const existingResult = await this.findBySessionIdAndSceneId(sessionId, sceneId);
      
      if (existingResult.success && existingResult.data) {
        // Scene already entered in this session, update the entered_at time
        const updateResult = await this.update(existingResult.data.id, {
          enteredAt: new Date().toISOString(),
          exitedAt: undefined, // Reset exit time since re-entering
        });
        
        if (updateResult.success && updateResult.data) {
          return { success: true, data: updateResult.data };
        } else {
          return { success: false, error: updateResult.error || 'Failed to update existing scene run state' };
        }
      }

      // Create new scene run state
      const sceneRunState: Omit<SceneRunState, 'id'> = {
        sceneId,
        enteredAt: new Date().toISOString(),
        notes: '',
        playerDecisions: [],
        outcome: '',
        unresolvedThreads: [],
        loreUpdates: [],
        npcStateChanges: [],
        lootAndRewards: [],
        worldStateChanges: [],
      };

      return await this.create(sceneRunState);
    } catch (error) {
      return { success: false, error: `Failed to enter scene: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async exitScene(sessionId: string, sceneId: string, chosenExitOptionId?: string): Promise<UpdateResult<SceneRunState>> {
    try {
      const existingResult = await this.findBySessionIdAndSceneId(sessionId, sceneId);
      
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: 'Scene run state not found' };
      }

      const updateData: any = {
        exitedAt: new Date().toISOString(),
      };

      if (chosenExitOptionId) {
        updateData.chosenExitOptionId = chosenExitOptionId;
      }

      return await this.update(existingResult.data.id, updateData);
    } catch (error) {
      return { success: false, error: `Failed to exit scene: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async updateNotes(sessionId: string, sceneId: string, notes: string): Promise<UpdateResult<SceneRunState>> {
    try {
      const existingResult = await this.findBySessionIdAndSceneId(sessionId, sceneId);
      
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: 'Scene run state not found' };
      }

      return await this.update(existingResult.data.id, { notes });
    } catch (error) {
      return { success: false, error: `Failed to update scene notes: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async addPlayerDecision(sessionId: string, sceneId: string, decision: string): Promise<UpdateResult<SceneRunState>> {
    try {
      const existingResult = await this.findBySessionIdAndSceneId(sessionId, sceneId);
      
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: 'Scene run state not found' };
      }

      const currentDecisions = existingResult.data.playerDecisions || [];
      const updatedDecisions = [...currentDecisions, decision];

      return await this.update(existingResult.data.id, { playerDecisions: updatedDecisions });
    } catch (error) {
      return { success: false, error: `Failed to add player decision: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async updateOutcome(sessionId: string, sceneId: string, outcome: string): Promise<UpdateResult<SceneRunState>> {
    try {
      const existingResult = await this.findBySessionIdAndSceneId(sessionId, sceneId);
      
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: 'Scene run state not found' };
      }

      return await this.update(existingResult.data.id, { outcome });
    } catch (error) {
      return { success: false, error: `Failed to update scene outcome: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async addLoreUpdate(sessionId: string, sceneId: string, loreUpdate: string): Promise<UpdateResult<SceneRunState>> {
    try {
      const existingResult = await this.findBySessionIdAndSceneId(sessionId, sceneId);
      
      if (!existingResult.success || !existingResult.data) {
        return { success: false, error: 'Scene run state not found' };
      }

      const currentLoreUpdates = existingResult.data.loreUpdates || [];
      const updatedLoreUpdates = [...currentLoreUpdates, loreUpdate];

      return await this.update(existingResult.data.id, { loreUpdates: updatedLoreUpdates });
    } catch (error) {
      return { success: false, error: `Failed to add lore update: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Convert database row to SceneRunState entity
  protected rowToEntity(row: any): SceneRunState {
    return {
      sceneId: row.scene_id,
      enteredAt: row.entered_at,
      exitedAt: row.exited_at,
      notes: row.notes,
      playerDecisions: row.player_decisions ? JSON.parse(row.player_decisions) : [],
      outcome: row.outcome,
      chosenExitOptionId: row.chosen_exit_option_id,
      unresolvedThreads: row.unresolved_threads ? JSON.parse(row.unresolved_threads) : [],
      loreUpdates: row.lore_updates ? JSON.parse(row.lore_updates) : [],
      npcStateChanges: row.npc_state_changes ? JSON.parse(row.npc_state_changes) : [],
      lootAndRewards: row.loot_and_rewards ? JSON.parse(row.loot_and_rewards) : [],
      worldStateChanges: row.world_state_changes ? JSON.parse(row.world_state_changes) : [],
    };
  }

  // Convert SceneRunState entity to database row
  protected entityToRow(entity: SceneRunState): any {
    const row: any = {
      scene_id: entity.sceneId,
    };

    if (entity.enteredAt !== undefined) row.entered_at = entity.enteredAt;
    if (entity.exitedAt !== undefined) row.exited_at = entity.exitedAt;
    if (entity.notes !== undefined) row.notes = entity.notes;
    if (entity.playerDecisions !== undefined) row.player_decisions = JSON.stringify(entity.playerDecisions);
    if (entity.outcome !== undefined) row.outcome = entity.outcome;
    if (entity.chosenExitOptionId !== undefined) row.chosen_exit_option_id = entity.chosenExitOptionId;
    if (entity.unresolvedThreads !== undefined) row.unresolved_threads = JSON.stringify(entity.unresolvedThreads);
    if (entity.loreUpdates !== undefined) row.lore_updates = JSON.stringify(entity.loreUpdates);
    if (entity.npcStateChanges !== undefined) row.npc_state_changes = JSON.stringify(entity.npcStateChanges);
    if (entity.lootAndRewards !== undefined) row.loot_and_rewards = JSON.stringify(entity.lootAndRewards);
    if (entity.worldStateChanges !== undefined) row.world_state_changes = JSON.stringify(entity.worldStateChanges);

    return row;
  }
}
