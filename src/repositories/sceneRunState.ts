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
      const result = this.db.prepare(
        'SELECT * FROM scene_run_states WHERE session_id = ? ORDER BY entered_at ASC'
      ).all(sessionId);
      
      const sceneRunStates = result.map(this.rowToEntity);
      return { success: true, data: sceneRunStates };
    } catch (error) {
      return { success: false, error: `Failed to find scene run states: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Fallback method for old sessions without proper session IDs
  async findByAdventureAndSessionNumber(adventureId: string, sessionNumber: number): Promise<{ success: boolean; data?: SceneRunState[]; error?: string }> {
    try {
      console.log(`🔍 Looking for scene run states by adventure ${adventureId} and session number ${sessionNumber}`);
      
      // Check if connection is available
      if (!this.db) {
        console.error('❌ Database connection not available for scene run states');
        return { success: false, error: 'Database connection not available' };
      }
      
      console.log('✅ Database connection available, proceeding with query');
      
      // First, let's see what's in the scene_run_states table
      console.log('🔍 Executing query: SELECT * FROM scene_run_states');
      try {
        const allResult = this.db.prepare('SELECT * FROM scene_run_states').all();
        console.log(`🗂️ All scene run states in database:`, {
          totalCount: allResult.length,
          sampleRecords: allResult.slice(0, 3).map(r => ({
            id: r.id,
            session_id: r.session_id,
            adventure_id: r.adventure_id,
            scene_id: r.scene_id,
            entered_at: r.entered_at
          })),
          allAdventureIds: [...new Set(allResult.map(r => r.adventure_id).filter(Boolean))],
          lookingFor: adventureId
        });
        
        // Since scene run states don't have adventure_id or session_id, we need to find them
        // by looking for the most recent scene run states that would belong to this session
        // We'll get all scene run states and sort by entered_at to find the most recent ones
        console.log('🔍 Getting all scene run states sorted by entered_at (newest first)');
        const allSorted = this.db.prepare('SELECT * FROM scene_run_states ORDER BY entered_at DESC').all();
        
        console.log(`📊 Found ${allSorted.length} scene run states total, taking most recent ones`);
        
        // Deduplicate scene run states to only include unique scenes
        // Keep only the most recent visit to each scene
        const uniqueScenes = new Map();
        allSorted.forEach(state => {
          if (!uniqueScenes.has(state.scene_id)) {
            uniqueScenes.set(state.scene_id, state);
          }
        });
        
        const deduplicatedStates = Array.from(uniqueScenes.values()).slice(0, 10); // Take up to 10 unique scenes
        
        console.log(`📊 Using ${deduplicatedStates.length} unique scene run states as fallback:`, deduplicatedStates.map(r => ({
          scene_id: r.scene_id,
          entered_at: r.entered_at,
          notes: r.notes,
          player_decisions: r.player_decisions
        })));
        
        const sceneRunStates = deduplicatedStates.map(this.rowToEntity);
        return { success: true, data: sceneRunStates };
      } catch (queryError) {
        console.error('❌ Query execution failed:', queryError);
        return { success: false, error: `Query execution failed: ${queryError instanceof Error ? queryError.message : 'Unknown error'}` };
      }
    } catch (error) {
      return { success: false, error: `Failed to find scene run states by adventure: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  async findBySessionIdAndSceneId(sessionId: string, sceneId: string): Promise<{ success: boolean; data?: SceneRunState | null; error?: string }> {
    try {
      const result = this.db.prepare(
        'SELECT * FROM scene_run_states WHERE session_id = ? AND scene_id = ?'
      ).get(sessionId, sceneId);
      
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
