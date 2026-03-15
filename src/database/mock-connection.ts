// @ts-nocheck
import type { DatabaseConnection } from '@/types';

/**
 * Mock database connection for testing purposes
 * This simulates the database operations without requiring actual database setup
 */
export class MockDatabaseConnection implements DatabaseConnection {
  private data: Map<string, any[]> = new Map();
  private nextId: number = 1;

  constructor() {
    // Initialize with sample data for testing
    this.data.set('adventures', [
      {
        id: 'adv-1',
        title: 'The Old Necropolis',
        description: 'A mysterious dungeon crawl through an ancient necropolis.',
        author: 'Test Author',
        status: 'draft',
        tags: ['dungeon', 'horror', 'mystery'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
    this.data.set('scenes', [
      {
        id: 'scene-1',
        adventureId: 'adv-1',
        name: 'The Entrance Hall',
        type: 'exploration',
        location: 'Necropolis Entrance',
        summary: 'A grand entrance to the ancient city',
        gmDescription: 'The walls are covered in hieroglyphs and ancient symbols.',
        readAloud: 'You stand before a massive stone entrance, covered in mysterious carvings.',
        atmosphere: 'Eerie and mysterious',
        tags: ['entrance', 'ancient'],
        sortOrder: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
    this.data.set('npcs', [
      {
        id: 'npc-1',
        adventureId: 'adv-1',
        name: 'Guard Captain Marcus',
        description: 'A stern guardian of the necropolis entrance.',
        faction: 'City Guard',
        statBlock: {
          abilities: ['Sword Strike', 'Shield Bash'],
          ac: 16,
          hp: 45,
          speed: 30
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]);
    this.data.set('scene_npcs', []);
    this.data.set('exit_options', []);
    this.data.set('sessions', []);
    this.data.set('scene_run_states', []);
    this.data.set('adventure_summaries', []);
    this.data.set('schema_metadata', [
      { key: '1.0.0', value: '1.0.0' }
    ]);
    this.nextId = 2;
  }

  prepare(sql: string): any {
    return {
      run: (...params: any[]) => {
        console.log('Mock SQL RUN:', sql, params);
        return { changes: 1, lastInsertROWID: this.nextId++ };
      },
      get: (...params: any[]) => {
        console.log('Mock SQL GET:', sql, params);
        // Return mock data for schema metadata
        if (sql.includes('schema_metadata')) {
          return { value: '1.0.0' };
        }
        return null;
      },
      all: (...params: any[]) => {
        console.log('Mock SQL ALL:', sql, params);
        // Return the actual data array for SELECT queries
        if (sql.includes('SELECT * FROM adventures')) {
          const adventures = this.data.get('adventures') || [];
          console.log('Adventures found:', adventures.length);
          return adventures;
        }
        return [];
      }
    };
  }

  exec(sql: string): void {
    console.log('Mock SQL EXEC:', sql);
  }

  transaction<T>(fn: () => T): T {
    console.log('Mock transaction');
    return fn();
  }

  close(): void {
    console.log('Mock database closed');
  }
}

export class MockDatabaseManager {
  private db: MockDatabaseConnection | null = null;
  private isInitialized = false;

  constructor(private dbPath: string = './rpg-scene-navigator.db') {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.db = new MockDatabaseConnection();
      this.isInitialized = true;
      console.log('Mock database initialized successfully');
    } catch (error) {
      console.error('Mock database initialization failed:', error);
      throw error;
    }
  }

  getConnection(): MockDatabaseConnection {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    console.log('Mock database connection closed');
  }
}

// Singleton instance
let mockDatabaseManager: MockDatabaseManager | null = null;

export function getDatabaseManager(): MockDatabaseManager {
  if (!mockDatabaseManager) {
    mockDatabaseManager = new MockDatabaseManager();
  }
  return mockDatabaseManager;
}

export async function initializeDatabase(): Promise<MockDatabaseManager> {
  const manager = getDatabaseManager();
  await manager.initialize();
  return manager;
}
