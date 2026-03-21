import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdventureSummaryRepository } from '@/repositories/adventureSummary';
import type { AdventureSummary } from '@/types';

// Mock the BaseRepository methods
class MockAdventureSummaryRepository extends AdventureSummaryRepository {
  constructor() {
    super({
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn(),
      prepare: vi.fn(),
      exec: vi.fn(),
    });
  }

  // Implement required abstract method
  getTableName(): string {
    return 'adventure_summaries';
  }

  // Expose protected methods for testing
  rowToEntity = super.rowToEntity.bind(this);
  entityToRow = super.entityToRow.bind(this);
}

describe('AdventureSummaryRepository', () => {
  let repo: MockAdventureSummaryRepository;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {
      all: vi.fn(),
      get: vi.fn(),
      run: vi.fn(),
      prepare: vi.fn(),
      exec: vi.fn(),
    };
    repo = new MockAdventureSummaryRepository();
  });

  describe('rowToEntity', () => {
    it('should convert snake_case database row to camelCase entity', () => {
      const row = {
        id: 'summary-123',
        adventure_id: 'adventure-456',
        summary_text: 'Adventure summary',
        lore_update_text: 'Lore updates',
        generated_at: '2023-01-01T12:00:00Z',
      };

      const entity = repo.rowToEntity(row);

      expect(entity).toEqual({
        id: 'summary-123',
        adventureId: 'adventure-456',
        summaryText: 'Adventure summary',
        loreUpdateText: 'Lore updates',
        generatedAt: '2023-01-01T12:00:00Z',
      });
    });

    it('should handle null/undefined fields correctly', () => {
      const row = {
        id: 'summary-123',
        adventure_id: 'adventure-456',
        summary_text: 'Adventure summary',
        lore_update_text: null,
        generated_at: '2023-01-01T12:00:00Z',
      };

      const entity = repo.rowToEntity(row);

      expect(entity).toEqual({
        id: 'summary-123',
        adventureId: 'adventure-456',
        summaryText: 'Adventure summary',
        loreUpdateText: null,
        generatedAt: '2023-01-01T12:00:00Z',
      });
    });
  });

  describe('entityToRow', () => {
    it('should convert camelCase entity to snake_case database row', () => {
      const entity: AdventureSummary = {
        id: 'summary-123',
        adventureId: 'adventure-456',
        summaryText: 'Adventure summary',
        loreUpdateText: 'Lore updates',
        generatedAt: '2023-01-01T12:00:00Z',
      };

      const row = repo.entityToRow(entity);

      expect(row).toEqual({
        adventure_id: 'adventure-456',
        summary_text: 'Adventure summary',
        lore_update_text: 'Lore updates',
        generated_at: '2023-01-01T12:00:00Z',
      });
    });

    it('should only include defined fields', () => {
      const entity: Partial<AdventureSummary> = {
        adventureId: 'adventure-456',
        summaryText: 'Adventure summary',
        generatedAt: '2023-01-01T12:00:00Z',
      };

      const row = repo.entityToRow(entity as AdventureSummary);

      expect(row).toEqual({
        adventure_id: 'adventure-456',
        summary_text: 'Adventure summary',
        generated_at: '2023-01-01T12:00:00Z',
      });

      // Should not include undefined fields
      expect(row).not.toHaveProperty('lore_update_text');
    });
  });

  describe('findByAdventureId', () => {
    it('should return summaries for adventure ordered by generation time', async () => {
      const mockRows = [
        { id: 'summary-2', generated_at: '2023-01-01T12:00:00Z' },
        { id: 'summary-1', generated_at: '2023-01-01T10:00:00Z' },
      ];
      mockConnection.all.mockResolvedValue(mockRows);

      repo.rowToEntity = vi.fn().mockImplementation((row) => ({
        id: row.id,
        generatedAt: row.generated_at,
      }));

      const result = await repo.findByAdventureId('adventure-123');

      expect(mockConnection.all).toHaveBeenCalledWith(
        'SELECT * FROM adventure_summaries WHERE adventure_id = ? ORDER BY generated_at DESC',
        ['adventure-123']
      );
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should handle database errors', async () => {
      mockConnection.all.mockRejectedValue(new Error('Database error'));

      const result = await repo.findByAdventureId('adventure-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to find adventure summaries');
    });
  });

  describe('findLatestByAdventureId', () => {
    it('should return latest summary for adventure', async () => {
      const mockRow = { id: 'summary-2', generated_at: '2023-01-01T12:00:00Z' };
      mockConnection.get.mockResolvedValue(mockRow);

      repo.rowToEntity = vi.fn().mockReturnValue({
        id: 'summary-2',
        generatedAt: '2023-01-01T12:00:00Z',
      });

      const result = await repo.findLatestByAdventureId('adventure-123');

      expect(mockConnection.get).toHaveBeenCalledWith(
        'SELECT * FROM adventure_summaries WHERE adventure_id = ? ORDER BY generated_at DESC LIMIT 1',
        ['adventure-123']
      );
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('summary-2');
    });

    it('should return null when no summaries exist', async () => {
      mockConnection.get.mockResolvedValue(null);

      const result = await repo.findLatestByAdventureId('adventure-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('createForAdventure', () => {
    it('should create summary with generated timestamp', async () => {
      vi.spyOn(repo, 'create' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'summary-123' } 
      });

      const result = await repo.createForAdventure(
        'adventure-123',
        'Adventure summary text',
        'Lore update text'
      );

      expect(repo.create).toHaveBeenCalledWith({
        adventureId: 'adventure-123',
        summaryText: 'Adventure summary text',
        loreUpdateText: 'Lore update text',
        generatedAt: expect.any(String),
      });
      expect(result.success).toBe(true);
    });

    it('should create summary without lore updates', async () => {
      vi.spyOn(repo, 'create' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'summary-123' } 
      });

      const result = await repo.createForAdventure(
        'adventure-123',
        'Adventure summary text'
      );

      expect(repo.create).toHaveBeenCalledWith({
        adventureId: 'adventure-123',
        summaryText: 'Adventure summary text',
        loreUpdateText: undefined,
        generatedAt: expect.any(String),
      });
      expect(result.success).toBe(true);
    });

    it('should handle create errors', async () => {
      vi.spyOn(repo, 'create' as any).mockRejectedValue(new Error('Create failed'));

      const result = await repo.createForAdventure('adventure-123', 'Summary');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create adventure summary');
    });
  });

  describe('updateSummaryText', () => {
    it('should update summary text', async () => {
      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'summary-123', summaryText: 'Updated summary' } 
      });

      const result = await repo.updateSummaryText('summary-123', 'Updated summary');

      expect(repo.update).toHaveBeenCalledWith('summary-123', {
        summaryText: 'Updated summary',
      });
      expect(result.success).toBe(true);
    });

    it('should handle update errors', async () => {
      vi.spyOn(repo, 'update' as any).mockRejectedValue(new Error('Update failed'));

      const result = await repo.updateSummaryText('summary-123', 'Updated summary');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update summary text');
    });
  });

  describe('updateLoreUpdateText', () => {
    it('should update lore update text', async () => {
      vi.spyOn(repo, 'update' as any).mockResolvedValue({ 
        success: true, 
        data: { id: 'summary-123', loreUpdateText: 'Updated lore' } 
      });

      const result = await repo.updateLoreUpdateText('summary-123', 'Updated lore');

      expect(repo.update).toHaveBeenCalledWith('summary-123', {
        loreUpdateText: 'Updated lore',
      });
      expect(result.success).toBe(true);
    });

    it('should handle update errors', async () => {
      vi.spyOn(repo, 'update' as any).mockRejectedValue(new Error('Update failed'));

      const result = await repo.updateLoreUpdateText('summary-123', 'Updated lore');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to update lore update text');
    });
  });
});
