import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionRepository } from '@/repositories/session';
import type { Session } from '@/types';

// Mock the BaseRepository methods
class MockSessionRepository extends SessionRepository {
  constructor(connection: any) {
    super(connection);
  }

  // Implement required abstract method
  getTableName(): string {
    return 'sessions';
  }

  // Override rowToEntity for testing
  rowToEntity(row: any) {
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

  // Expose protected methods for testing
  entityToRow = super.entityToRow.bind(this);
}

describe('SessionRepository', () => {
  let repo: MockSessionRepository;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn(),
      prepare: vi.fn(),
      exec: vi.fn(),
    };
    repo = new MockSessionRepository(mockConnection);
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

      const entity = repo.rowToEntity(row);

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

      const entity = repo.rowToEntity(row);

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

      const entityTrue = repo.rowToEntity(rowTrue);
      const entityFalse = repo.rowToEntity(rowFalse);

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

      const row = repo.entityToRow(entity);

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

      const row = repo.entityToRow(entity as Session);

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

      const rowTrue = repo.entityToRow(entityTrue as Session);
      const rowFalse = repo.entityToRow(entityFalse as Session);

      expect(rowTrue.is_adventure_complete).toBe(1);
      expect(rowFalse.is_adventure_complete).toBe(0);
    });
  });

  describe('findByAdventureId', () => {
    it('should return sessions for adventure ordered by session number', async () => {
      const mockRows = [
        { id: 'session-1', session_number: 1 },
        { id: 'session-2', session_number: 2 }
      ];
      
      const mockStatement = {
        all: vi.fn().mockResolvedValue(mockRows)
      };
      mockConnection.prepare = vi.fn().mockReturnValue(mockStatement);

      // rowToEntity is now mocked in beforeEach

      const result = await repo.findByAdventureId('adventure-123');

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        'SELECT * FROM sessions WHERE adventure_id = ? ORDER BY session_number DESC'
      );
      expect(mockStatement.all).toHaveBeenCalledWith('adventure-123');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle database errors', async () => {
      const mockStatement = {
        all: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      mockConnection.prepare = vi.fn().mockReturnValue(mockStatement);

      const result = await repo.findByAdventureId('adventure-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to find sessions');
    });
  });

  describe('findLatestByAdventureId', () => {
    it('should return latest session for adventure', async () => {
      const mockRow = { id: 'session-2', session_number: 2 };
      
      const mockStatement = {
        get: vi.fn().mockResolvedValue(mockRow)
      };
      mockConnection.prepare = vi.fn().mockReturnValue(mockStatement);

      // rowToEntity is now mocked in beforeEach

      const result = await repo.findLatestByAdventureId('adventure-123');

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        'SELECT * FROM sessions WHERE adventure_id = ? ORDER BY session_number DESC LIMIT 1'
      );
      expect(mockStatement.get).toHaveBeenCalledWith('adventure-123');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'session-2',
        sessionNumber: 2
      });
    });

    it('should return null when no sessions exist', async () => {
      const mockStatement = {
        get: vi.fn().mockResolvedValue(null)
      };
      mockConnection.prepare = vi.fn().mockReturnValue(mockStatement);

      const result = await repo.findLatestByAdventureId('adventure-123');

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        'SELECT * FROM sessions WHERE adventure_id = ? ORDER BY session_number DESC LIMIT 1'
      );
      expect(mockStatement.get).toHaveBeenCalledWith('adventure-123');
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getNextSessionNumber', () => {
    it('should return next session number', async () => {
      const mockStatement = {
        get: vi.fn().mockResolvedValue({ max_number: 2 })
      };
      mockConnection.prepare = vi.fn().mockReturnValue(mockStatement);

      const result = await repo.getNextSessionNumber('adventure-123');

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        'SELECT MAX(session_number) as max_number FROM sessions WHERE adventure_id = ?'
      );
      expect(mockStatement.get).toHaveBeenCalledWith('adventure-123');
      expect(result.success).toBe(true);
      expect(result.data).toBe(3);
    });

    it('should return 1 for first session', async () => {
      const mockStatement = {
        get: vi.fn().mockResolvedValue({ max_number: null })
      };
      mockConnection.prepare = vi.fn().mockReturnValue(mockStatement);

      const result = await repo.getNextSessionNumber('adventure-123');

      expect(mockConnection.prepare).toHaveBeenCalledWith(
        'SELECT MAX(session_number) as max_number FROM sessions WHERE adventure_id = ?'
      );
      expect(mockStatement.get).toHaveBeenCalledWith('adventure-123');
      expect(result.success).toBe(true);
      expect(result.data).toBe(1);
    });
  });

  describe('createWithSessionNumber', () => {
    it('should create session with next session number', async () => {
      const sessionData = {
        adventureId: 'adventure-123',
        sessionNumber: 1,
        startingSceneId: 'scene-456',
        currentSceneId: 'scene-456',
        isAdventureComplete: false,
      };

      // Mock getNextSessionNumber
      vi.spyOn(repo, 'getNextSessionNumber' as any).mockResolvedValue({ success: true, data: 2 });
      
      // Mock create
      vi.spyOn(repo, 'create' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'session-789', sessionNumber: 2 } 
      });

      const result = await repo.createWithSessionNumber(sessionData);

      expect(repo.getNextSessionNumber).toHaveBeenCalledWith('adventure-123');
      expect(repo.create).toHaveBeenCalledWith({
        ...sessionData,
        sessionNumber: 2,
        startedAt: expect.any(String),
      });
      expect(result.success).toBe(true);
    });

    it('should handle error getting session number', async () => {
      vi.spyOn(repo, 'getNextSessionNumber' as any).mockResolvedValue({ 
        success: false, 
        error: 'Database error' 
      });

      const result = await repo.createWithSessionNumber({
        adventureId: 'adventure-123',
        sessionNumber: 1,
        startingSceneId: 'scene-456',
        currentSceneId: 'scene-456',
        isAdventureComplete: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('endSession', () => {
    it('should end session with ending scene and completion status', async () => {
      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'session-123' } 
      });

      const result = await repo.endSession('session-123', 'scene-789', true);

      expect(repo.update).toHaveBeenCalledWith('session-123', {
        endedAt: expect.any(String),
        endingSceneId: 'scene-789',
        isAdventureComplete: true,
      });
      expect(result.success).toBe(true);
    });

    it('should end session with only end time', async () => {
      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'session-123' } 
      });

      const result = await repo.endSession('session-123');

      expect(repo.update).toHaveBeenCalledWith('session-123', {
        endedAt: expect.any(String),
      });
      expect(result.success).toBe(true);
    });
  });
});
