import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionRepository } from '@/repositories/session';
import type { Session } from '@/types';

describe('SessionRepository', () => {
  let repo: SessionRepository;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn(),
      prepare: vi.fn(),
      exec: vi.fn(),
    };
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
      // Mock the database operations
      const mockPrepare = vi.fn().mockReturnValue({
        run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 })
      });
      mockConnection.prepare = mockPrepare;

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
      expect(mockPrepare).toHaveBeenCalled();
    });

    it('should handle session update workflow', async () => {
      const mockPrepare = vi.fn().mockReturnValue({
        run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 })
      });
      mockConnection.prepare = mockPrepare;

      const updateData = {
        endedAt: '2023-01-01T12:00:00Z',
        isAdventureComplete: true,
      };

      const result = await repo.update('session-123', updateData);

      expect(result.success).toBe(true);
      expect(mockPrepare).toHaveBeenCalled();
    });
  });
});
