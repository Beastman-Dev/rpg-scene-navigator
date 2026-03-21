import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionRepository } from '@/repositories/session';
import type { Session } from '@/types';

// Create a proper mock connection that simulates the database interface
const createMockConnection = () => {
  return {
    all: vi.fn((sql: string, params?: any[]) => {
      console.log('Mock all called with:', sql, params);
      // Return empty array by default, can be customized in tests
      return Promise.resolve([]);
    }),
    get: vi.fn((sql: string, params?: any[]) => {
      console.log('Mock get called with:', sql, params);
      return Promise.resolve(undefined);
    }),
    run: vi.fn((sql: string, params?: any[]) => {
      console.log('Mock run called with:', sql, params);
      return Promise.resolve({ changes: 1, lastInsertRowid: 'test-id' });
    }),
    prepare: vi.fn((sql: string) => ({
      run: vi.fn((...params: any[]) => {
        console.log('Mock prepare.run called with:', sql, params);
        return Promise.resolve({ changes: 1, lastInsertRowid: 'test-id' });
      })
    })),
    exec: vi.fn((sql: string) => {
      console.log('Mock exec called with:', sql);
      return Promise.resolve([]);
    })
  };
};

describe('SessionRepository', () => {
  let repo: SessionRepository;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = createMockConnection();
    repo = new SessionRepository(mockConnection);
  });

  describe('rowToEntity', () => {
    it('should convert snake_case database row to camelCase entity', () => {
      const row = {
        id: 'session-123',
        adventure_id: 'adventure-456',
        session_number: 1,
        started_at: '2023-01-01T10:00:00Z',
        ended_at: '2023-01-01T12:00:00Z',
        starting_scene_id: 'scene-789',
        current_scene_id: 'scene-012',
        ending_scene_id: 'scene-345',
        is_adventure_complete: 1,
        summary: 'Session summary',
        created_at: '2023-01-01T09:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
      };

      // Access protected method through type assertion
      const entity = (repo as any).rowToEntity(row);

      expect(entity).toEqual({
        id: 'session-123',
        adventureId: 'adventure-456',
        sessionNumber: 1,
        startedAt: '2023-01-01T10:00:00Z',
        endedAt: '2023-01-01T12:00:00Z',
        startingSceneId: 'scene-789',
        currentSceneId: 'scene-012',
        endingSceneId: 'scene-345',
        isAdventureComplete: true,
        summary: 'Session summary',
        createdAt: '2023-01-01T09:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
      });
    });

    it('should handle null/undefined fields correctly', () => {
      const row = {
        id: 'session-123',
        adventure_id: 'adventure-456',
        session_number: 1,
        started_at: null,
        ended_at: undefined,
        starting_scene_id: 'scene-789',
        current_scene_id: 'scene-012',
        ending_scene_id: null,
        is_adventure_complete: 0,
        summary: undefined,
        created_at: '2023-01-01T09:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
      };

      const entity = (repo as any).rowToEntity(row);

      expect(entity).toEqual({
        id: 'session-123',
        adventureId: 'adventure-456',
        sessionNumber: 1,
        startedAt: null,
        endedAt: undefined,
        startingSceneId: 'scene-789',
        currentSceneId: 'scene-012',
        endingSceneId: null,
        isAdventureComplete: false,
        summary: undefined,
        createdAt: '2023-01-01T09:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
      });
    });

    it('should handle boolean conversion correctly', () => {
      const rowTrue = {
        id: 'session-123',
        adventure_id: 'adventure-456',
        session_number: 1,
        is_adventure_complete: 1,
      };

      const rowFalse = {
        id: 'session-456',
        adventure_id: 'adventure-789',
        session_number: 2,
        is_adventure_complete: 0,
      };

      const entityTrue = (repo as any).rowToEntity(rowTrue);
      const entityFalse = (repo as any).rowToEntity(rowFalse);

      expect(entityTrue.isAdventureComplete).toBe(true);
      expect(entityFalse.isAdventureComplete).toBe(false);
    });
  });

  describe('entityToRow', () => {
    it('should convert camelCase entity to snake_case database row', () => {
      const entity: Session = {
        id: 'session-123',
        adventureId: 'adventure-456',
        sessionNumber: 1,
        startedAt: '2023-01-01T10:00:00Z',
        endedAt: '2023-01-01T12:00:00Z',
        startingSceneId: 'scene-789',
        currentSceneId: 'scene-012',
        endingSceneId: 'scene-345',
        isAdventureComplete: true,
        summary: 'Session summary',
        createdAt: '2023-01-01T09:00:00Z',
        updatedAt: '2023-01-01T12:00:00Z',
      };

      const row = (repo as any).entityToRow(entity);

      expect(row).toEqual({
        adventure_id: 'adventure-456',
        session_number: 1,
        started_at: '2023-01-01T10:00:00Z',
        ended_at: '2023-01-01T12:00:00Z',
        starting_scene_id: 'scene-789',
        current_scene_id: 'scene-012',
        ending_scene_id: 'scene-345',
        is_adventure_complete: 1,
        summary: 'Session summary',
      });
    });

    it('should only include defined fields', () => {
      const entity: Partial<Session> = {
        adventureId: 'adventure-456',
        sessionNumber: 1,
        startingSceneId: 'scene-789',
        currentSceneId: 'scene-012',
        isAdventureComplete: false,
      };

      const row = (repo as any).entityToRow(entity as Session);

      expect(row).toEqual({
        adventure_id: 'adventure-456',
        session_number: 1,
        starting_scene_id: 'scene-789',
        current_scene_id: 'scene-012',
        is_adventure_complete: 0,
      });

      // Should not include undefined fields
      expect(row).not.toHaveProperty('started_at');
      expect(row).not.toHaveProperty('ended_at');
      expect(row).not.toHaveProperty('ending_scene_id');
      expect(row).not.toHaveProperty('summary');
    });

    it('should convert boolean to integer correctly', () => {
      const entityTrue = {
        adventureId: 'adventure-456',
        sessionNumber: 1,
        startingSceneId: 'scene-789',
        currentSceneId: 'scene-012',
        isAdventureComplete: true,
      };

      const entityFalse = {
        adventureId: 'adventure-789',
        sessionNumber: 2,
        startingSceneId: 'scene-012',
        currentSceneId: 'scene-345',
        isAdventureComplete: false,
      };

      const rowTrue = (repo as any).entityToRow(entityTrue as Session);
      const rowFalse = (repo as any).entityToRow(entityFalse as Session);

      expect(rowTrue.is_adventure_complete).toBe(1);
      expect(rowFalse.is_adventure_complete).toBe(0);
    });
  });

  describe('getTableName', () => {
    it('should return correct table name', () => {
      const tableName = (repo as any).getTableName();
      expect(tableName).toBe('sessions');
    });
  });

  // Integration-style tests that verify the methods work correctly
  describe('Session Operations', () => {
    it('should handle session creation workflow', async () => {
      const sessionData = {
        adventureId: 'adventure-123',
        sessionNumber: 1,
        startingSceneId: 'scene-456',
        currentSceneId: 'scene-456',
        isAdventureComplete: false,
        startedAt: '2023-01-01T10:00:00Z',
      };

      const result = await repo.create(sessionData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.adventureId).toBe('adventure-123');
      expect(result.data?.sessionNumber).toBe(1);
      expect(mockConnection.prepare).toHaveBeenCalled();
    });

    it('should handle session update workflow', async () => {
      const updateData = {
        endedAt: '2023-01-01T12:00:00Z',
        isAdventureComplete: true,
      };

      // Mock findById to return a session
      mockConnection.get.mockReturnValue({
        id: 'session-123',
        adventure_id: 'adventure-123',
        session_number: 1,
        is_adventure_complete: 0,
        created_at: '2023-01-01T09:00:00Z',
        updated_at: '2023-01-01T09:00:00Z'
      });

      const result = await repo.update('session-123', updateData);

      expect(result.success).toBe(true);
      expect(mockConnection.prepare).toHaveBeenCalled();
    });
  });

  // Test specific repository methods
  describe('Repository Methods', () => {
    it('should find sessions by adventure ID', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          adventure_id: 'adventure-123',
          session_number: 2,
          started_at: '2023-01-01T10:00:00Z',
          is_adventure_complete: 0,
          created_at: '2023-01-01T09:00:00Z',
          updated_at: '2023-01-01T09:00:00Z'
        },
        {
          id: 'session-2',
          adventure_id: 'adventure-123',
          session_number: 1,
          started_at: '2023-01-01T08:00:00Z',
          is_adventure_complete: 1,
          created_at: '2023-01-01T08:00:00Z',
          updated_at: '2023-01-01T11:00:00Z'
        }
      ];

      mockConnection.all.mockResolvedValue(mockSessions);

      try {
        const result = await repo.findByAdventureId('adventure-123');
        console.log('Result:', result);
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(mockConnection.all).toHaveBeenCalledWith(
          'SELECT * FROM sessions WHERE adventure_id = ? ORDER BY session_number DESC',
          ['adventure-123']
        );
      } catch (error) {
        console.error('Error in test:', error);
        throw error;
      }
    });

    it('should find latest session by adventure ID', async () => {
      const mockSession = {
        id: 'session-1',
        adventure_id: 'adventure-123',
        session_number: 2,
        started_at: '2023-01-01T10:00:00Z',
        is_adventure_complete: 0,
        created_at: '2023-01-01T09:00:00Z',
        updated_at: '2023-01-01T09:00:00Z'
      };

      mockConnection.get.mockResolvedValue(mockSession);

      const result = await repo.findLatestByAdventureId('adventure-123');

      expect(result.success).toBe(true);
      expect(result.data?.sessionNumber).toBe(2);
      expect(mockConnection.get).toHaveBeenCalledWith(
        'SELECT * FROM sessions WHERE adventure_id = ? ORDER BY session_number DESC LIMIT 1',
        ['adventure-123']
      );
    });

    it('should return null when no sessions exist', async () => {
      mockConnection.get.mockResolvedValue(undefined);

      const result = await repo.findLatestByAdventureId('adventure-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should get next session number', async () => {
      mockConnection.get.mockResolvedValue([{ max_number: 2 }]);

      const result = await repo.getNextSessionNumber('adventure-123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
      expect(mockConnection.get).toHaveBeenCalledWith(
        'SELECT MAX(session_number) as max_number FROM sessions WHERE adventure_id = ?',
        ['adventure-123']
      );
    });

    it('should return 1 for first session', async () => {
      mockConnection.get.mockResolvedValue([{ max_number: null }]);

      const result = await repo.getNextSessionNumber('adventure-123');

      expect(result.success).toBe(true);
      expect(result.data).toBe(1);
    });
  });
});
