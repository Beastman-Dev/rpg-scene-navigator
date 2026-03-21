import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AdventureRepository } from '@/repositories'
import type { Adventure } from '@/types'

// Mock database connection
const mockDb = {
  prepare: vi.fn(),
  exec: vi.fn(),
}

// Testable repository class that exposes protected methods
class TestableAdventureRepository extends AdventureRepository {
  public testRowToEntity(row: any): Adventure {
    return this.rowToEntity(row)
  }

  public testEntityToRow(entity: Partial<Adventure>): any {
    return this.entityToRow(entity)
  }
}

describe('AdventureRepository', () => {
  let repo: TestableAdventureRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repo = new TestableAdventureRepository(mockDb as any)
  })

  describe('rowToEntity', () => {
    it('should convert snake_case database fields to camelCase entity fields', () => {
      const row = {
        id: 'test-id',
        title: 'Test Adventure',
        description: 'Test Description',
        starting_scene_id: 'scene-123',
        tags: '["tag1", "tag2"]',
        status: 'draft',
        author: 'Test Author',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const entity = repo.testRowToEntity(row)

      expect(entity).toEqual({
        id: 'test-id',
        title: 'Test Adventure',
        description: 'Test Description',
        startingSceneId: 'scene-123',
        tags: '["tag1", "tag2"]',
        status: 'draft',
        author: 'Test Author',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      })
    })

    it('should handle camelCase fields from IndexedDB conversion', () => {
      const row = {
        id: 'test-id',
        title: 'Test Adventure',
        description: 'Test Description',
        startingSceneId: 'scene-456', // Already camelCase (from IndexedDB)
        tags: ['tag1', 'tag2'],
        status: 'draft',
        author: 'Test Author',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      const entity = repo.testRowToEntity(row)

      expect(entity.startingSceneId).toBe('scene-456')
    })

    it('should handle null starting_scene_id correctly', () => {
      const row = {
        id: 'test-id',
        title: 'Test Adventure',
        starting_scene_id: null,
        tags: '[]',
        status: 'draft',
        author: 'Test Author',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const entity = repo.testRowToEntity(row)

      expect(entity.startingSceneId).toBeUndefined()
    })

    it('should handle undefined starting_scene_id correctly', () => {
      const row = {
        id: 'test-id',
        title: 'Test Adventure',
        // starting_scene_id not present
        tags: '[]',
        status: 'draft',
        author: 'Test Author',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const entity = repo.testRowToEntity(row)

      expect(entity.startingSceneId).toBeUndefined()
    })

    it('should handle both snake_case and camelCase for timestamps', () => {
      const snakeCaseRow = {
        id: 'test-id',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }

      const camelCaseRow = {
        id: 'test-id',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      const snakeEntity = repo.testRowToEntity(snakeCaseRow)
      const camelEntity = repo.testRowToEntity(camelCaseRow)

      expect(snakeEntity.createdAt).toBe('2023-01-01T00:00:00Z')
      expect(snakeEntity.updatedAt).toBe('2023-01-01T00:00:00Z')
      expect(camelEntity.createdAt).toBe('2023-01-01T00:00:00Z')
      expect(camelEntity.updatedAt).toBe('2023-01-01T00:00:00Z')
    })
  })

  describe('entityToRow', () => {
    it('should convert camelCase entity fields to snake_case database fields', () => {
      const entity: Partial<Adventure> = {
        title: 'Test Adventure',
        description: 'Test Description',
        startingSceneId: 'scene-123',
        tags: ['tag1', 'tag2'],
        status: 'draft',
        author: 'Test Author'
      }

      const row = repo.testEntityToRow(entity)

      expect(row).toEqual({
        title: 'Test Adventure',
        description: 'Test Description',
        starting_scene_id: 'scene-123',
        tags: ['tag1', 'tag2'],
        status: 'draft',
        author: 'Test Author'
      })
    })

    it('should convert empty string startingSceneId to null for database', () => {
      const entity: Partial<Adventure> = {
        title: 'Test Adventure',
        startingSceneId: '', // Empty string should become null
        tags: []
      }

      const row = repo.testEntityToRow(entity)

      expect(row.starting_scene_id).toBeNull()
    })

    it('should only include fields that are present in the entity', () => {
      const entity: Partial<Adventure> = {
        title: 'Test Adventure',
        // Other fields not included
      }

      const row = repo.testEntityToRow(entity)

      expect(row).toEqual({
        title: 'Test Adventure'
      })
      expect(row).not.toHaveProperty('description')
      expect(row).not.toHaveProperty('starting_scene_id')
    })
  })
})
