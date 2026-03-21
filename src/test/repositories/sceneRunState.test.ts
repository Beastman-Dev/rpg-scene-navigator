import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SceneRunStateRepository } from '@/repositories/sceneRunState';
import type { SceneRunState } from '@/types';

// Mock the BaseRepository methods
class MockSceneRunStateRepository extends SceneRunStateRepository {
  constructor() {
    super({
      all: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(undefined),
      run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 'test-id' }),
      prepare: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 'test-id' })
      }),
      exec: vi.fn().mockResolvedValue([]),
    });
  }

  // Implement required abstract method
  getTableName(): string {
    return 'scene_run_states';
  }

  // Expose protected methods for testing
  rowToEntity = super.rowToEntity.bind(this);
  entityToRow = super.entityToRow.bind(this);
}

describe('SceneRunStateRepository', () => {
  let repo: MockSceneRunStateRepository;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn(),
      prepare: vi.fn(),
      exec: vi.fn(),
    };
    repo = new MockSceneRunStateRepository();
  });

  describe('rowToEntity', () => {
    it('should convert snake_case database row to camelCase entity', () => {
      const row = {
        scene_id: 'scene-123',
        entered_at: '2023-01-01T10:00:00Z',
        exited_at: '2023-01-01T12:00:00Z',
        notes: 'Scene notes',
        player_decisions: '["decision1", "decision2"]',
        outcome: 'Scene outcome',
        chosen_exit_option_id: 'exit-456',
        unresolved_threads: '["thread1", "thread2"]',
        lore_updates: '["lore1", "lore2"]',
        npc_state_changes: '["npc1", "npc2"]',
        loot_and_rewards: '["item1", "item2"]',
        world_state_changes: '["change1", "change2"]',
      };

      const entity = repo.rowToEntity(row);

      expect(entity).toEqual({
        sceneId: 'scene-123',
        enteredAt: '2023-01-01T10:00:00Z',
        exitedAt: '2023-01-01T12:00:00Z',
        notes: 'Scene notes',
        playerDecisions: ['decision1', 'decision2'],
        outcome: 'Scene outcome',
        chosenExitOptionId: 'exit-456',
        unresolvedThreads: ['thread1', 'thread2'],
        loreUpdates: ['lore1', 'lore2'],
        npcStateChanges: ['npc1', 'npc2'],
        lootAndRewards: ['item1', 'item2'],
        worldStateChanges: ['change1', 'change2'],
      });
    });

    it('should handle null/undefined fields correctly', () => {
      const row = {
        scene_id: 'scene-123',
        entered_at: null,
        exited_at: undefined,
        notes: null,
        player_decisions: null,
        outcome: undefined,
        chosen_exit_option_id: null,
        unresolved_threads: null,
        lore_updates: null,
        npc_state_changes: null,
        loot_and_rewards: null,
        world_state_changes: null,
      };

      const entity = repo.rowToEntity(row);

      expect(entity).toEqual({
        sceneId: 'scene-123',
        enteredAt: null,
        exitedAt: undefined,
        notes: null,
        playerDecisions: [],
        outcome: undefined,
        chosenExitOptionId: null,
        unresolvedThreads: [],
        loreUpdates: [],
        npcStateChanges: [],
        lootAndRewards: [],
        worldStateChanges: [],
      });
    });

    it('should handle missing JSON fields', () => {
      const row = {
        scene_id: 'scene-123',
        entered_at: '2023-01-01T10:00:00Z',
        exited_at: '2023-01-01T12:00:00Z',
        notes: 'Scene notes',
        // JSON fields missing
      };

      const entity = repo.rowToEntity(row);

      expect(entity).toEqual({
        sceneId: 'scene-123',
        enteredAt: '2023-01-01T10:00:00Z',
        exitedAt: '2023-01-01T12:00:00Z',
        notes: 'Scene notes',
        playerDecisions: [],
        outcome: undefined,
        chosenExitOptionId: undefined,
        unresolvedThreads: [],
        loreUpdates: [],
        npcStateChanges: [],
        lootAndRewards: [],
        worldStateChanges: [],
      });
    });
  });

  describe('entityToRow', () => {
    it('should convert camelCase entity to snake_case database row', () => {
      const entity: SceneRunState = {
        sceneId: 'scene-123',
        enteredAt: '2023-01-01T10:00:00Z',
        exitedAt: '2023-01-01T12:00:00Z',
        notes: 'Scene notes',
        playerDecisions: ['decision1', 'decision2'],
        outcome: 'Scene outcome',
        chosenExitOptionId: 'exit-456',
        unresolvedThreads: ['thread1', 'thread2'],
        loreUpdates: ['lore1', 'lore2'],
        npcStateChanges: ['npc1', 'npc2'],
        lootAndRewards: ['item1', 'item2'],
        worldStateChanges: ['change1', 'change2'],
      };

      const row = repo.entityToRow(entity);

      expect(row).toEqual({
        scene_id: 'scene-123',
        entered_at: '2023-01-01T10:00:00Z',
        exited_at: '2023-01-01T12:00:00Z',
        notes: 'Scene notes',
        player_decisions: '["decision1","decision2"]',
        outcome: 'Scene outcome',
        chosen_exit_option_id: 'exit-456',
        unresolved_threads: '["thread1","thread2"]',
        lore_updates: '["lore1","lore2"]',
        npc_state_changes: '["npc1","npc2"]',
        loot_and_rewards: '["item1","item2"]',
        world_state_changes: '["change1","change2"]',
      });
    });

    it('should only include defined fields', () => {
      const entity: Partial<SceneRunState> = {
        sceneId: 'scene-123',
        enteredAt: '2023-01-01T10:00:00Z',
        notes: 'Scene notes',
        playerDecisions: ['decision1'],
      };

      const row = repo.entityToRow(entity as SceneRunState);

      expect(row).toEqual({
        scene_id: 'scene-123',
        entered_at: '2023-01-01T10:00:00Z',
        notes: 'Scene notes',
        player_decisions: '["decision1"]',
      });

      // Should not include undefined fields
      expect(row).not.toHaveProperty('exited_at');
      expect(row).not.toHaveProperty('outcome');
      expect(row).not.toHaveProperty('chosen_exit_option_id');
    });

    it('should handle empty arrays correctly', () => {
      const entity: SceneRunState = {
        sceneId: 'scene-123',
        enteredAt: '2023-01-01T10:00:00Z',
        notes: 'Scene notes',
        playerDecisions: [],
        unresolvedThreads: [],
        loreUpdates: [],
        npcStateChanges: [],
        lootAndRewards: [],
        worldStateChanges: [],
      };

      const row = repo.entityToRow(entity);

      expect(row.player_decisions).toBe('[]');
      expect(row.unresolved_threads).toBe('[]');
      expect(row.lore_updates).toBe('[]');
      expect(row.npc_state_changes).toBe('[]');
      expect(row.loot_and_rewards).toBe('[]');
      expect(row.world_state_changes).toBe('[]');
    });
  });

  describe('findBySessionId', () => {
    it('should return scene run states for session ordered by entered time', async () => {
      const mockRows = [
        { id: 'state-2', entered_at: '2023-01-01T12:00:00Z' },
        { id: 'state-1', entered_at: '2023-01-01T10:00:00Z' },
      ];
      
      // Access the repository's connection directly
      const repoConnection = (repo as any).db;
      repoConnection.all.mockResolvedValue(mockRows);

      repo.rowToEntity = vi.fn().mockImplementation((row) => ({
        id: row.id,
        enteredAt: row.entered_at,
      }));

      const result = await repo.findBySessionId('session-123');

      expect(repoConnection.all).toHaveBeenCalledWith(
        'SELECT * FROM scene_run_states WHERE session_id = ? ORDER BY entered_at ASC',
        ['session-123']
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle database errors', async () => {
      mockConnection.all.mockRejectedValue(new Error('Database error'));

      const result = await repo.findBySessionId('session-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to find scene run states');
    });
  });

  describe('enterScene', () => {
    it('should create new scene run state for first entry', async () => {
      // Mock that no existing state exists
      vi.spyOn(repo, 'findBySessionIdAndSceneId' as any).mockResolvedValue({ 
        success: true, 
        data: null 
      });

      // Mock create
      vi.spyOn(repo, 'create' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'state-123' } 
      });

      const result = await repo.enterScene('session-123', 'scene-456');

      expect(repo.findBySessionIdAndSceneId).toHaveBeenCalledWith('session-123', 'scene-456');
      expect(repo.create).toHaveBeenCalledWith({
        sceneId: 'scene-456',
        enteredAt: expect.any(String),
        notes: '',
        playerDecisions: [],
        outcome: '',
        unresolvedThreads: [],
        loreUpdates: [],
        npcStateChanges: [],
        lootAndRewards: [],
        worldStateChanges: [],
      });
      expect(result.success).toBe(true);
    });

    it('should update existing scene run state for re-entry', async () => {
      // Mock that existing state exists
      vi.spyOn(repo, 'findBySessionIdAndSceneId' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'state-123', sceneId: 'scene-456' } 
      });

      // Mock update
      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'state-123' } 
      });

      const result = await repo.enterScene('session-123', 'scene-456');

      expect(repo.findBySessionIdAndSceneId).toHaveBeenCalledWith('session-123', 'scene-456');
      expect(repo.update).toHaveBeenCalledWith('state-123', {
        enteredAt: expect.any(String),
        exitedAt: undefined,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('addPlayerDecision', () => {
    it('should add decision to existing decisions', async () => {
      const existingState = {
        id: 'state-123',
        sceneId: 'scene-456',
        playerDecisions: ['existing decision'],
      };

      vi.spyOn(repo, 'findBySessionIdAndSceneId' as any).mockResolvedValue({ 
        success: true, 
        data: existingState 
      });

      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: existingState 
      });

      const result = await repo.addPlayerDecision('session-123', 'scene-456', 'new decision');

      expect(repo.update).toHaveBeenCalledWith('state-123', {
        playerDecisions: ['existing decision', 'new decision'],
      });
      expect(result.success).toBe(true);
    });

    it('should handle empty existing decisions', async () => {
      const existingState = {
        id: 'state-123',
        sceneId: 'scene-456',
        playerDecisions: [],
      };

      vi.spyOn(repo, 'findBySessionIdAndSceneId' as any).mockResolvedValue({ 
        success: true, 
        data: existingState 
      });

      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: existingState 
      });

      const result = await repo.addPlayerDecision('session-123', 'scene-456', 'first decision');

      expect(repo.update).toHaveBeenCalledWith('state-123', {
        playerDecisions: ['first decision'],
      });
      expect(result.success).toBe(true);
    });

    it('should return error if scene run state not found', async () => {
      vi.spyOn(repo, 'findBySessionIdAndSceneId' as any).mockResolvedValue({ 
        success: true, 
        data: null 
      });

      const result = await repo.addPlayerDecision('session-123', 'scene-456', 'decision');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Scene run state not found');
    });
  });

  describe('addLoreUpdate', () => {
    it('should add lore update to existing updates', async () => {
      const existingState = {
        id: 'state-123',
        sceneId: 'scene-456',
        loreUpdates: ['existing lore'],
      };

      vi.spyOn(repo, 'findBySessionIdAndSceneId' as any).mockResolvedValue({ 
        success: true, 
        data: existingState 
      });

      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: existingState 
      });

      const result = await repo.addLoreUpdate('session-123', 'scene-456', 'new lore update');

      expect(repo.update).toHaveBeenCalledWith('state-123', {
        loreUpdates: ['existing lore', 'new lore update'],
      });
      expect(result.success).toBe(true);
    });
  });
});
