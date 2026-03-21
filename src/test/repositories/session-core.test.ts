import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionRepository } from '@/repositories/session';
import type { Session } from '@/types';

describe('SessionRepository - Core Functionality', () => {
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

  describe('Data Conversion', () => {
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

    it('should return correct table name', () => {
      const tableName = (repo as any).getTableName();
      expect(tableName).toBe('sessions');
    });
  });

  describe('Basic Repository Operations', () => {
    it('should handle session creation', async () => {
      const sessionData = {
        adventureId: 'adventure-123',
        sessionNumber: 1,
        startingSceneId: 'scene-456',
        currentSceneId: 'scene-456',
        isAdventureComplete: false,
        startedAt: '2023-01-01T10:00:00Z',
      };

      // Mock the prepare method
      const mockPrepare = vi.fn().mockReturnValue({
        run: vi.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 })
      });
      mockConnection.prepare = mockPrepare;

      const result = await repo.create(sessionData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.adventureId).toBe('adventure-123');
      expect(result.data?.sessionNumber).toBe(1);
      expect(mockPrepare).toHaveBeenCalled();
    });
  });
});
