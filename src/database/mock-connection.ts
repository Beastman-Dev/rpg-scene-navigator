// @ts-nocheck
import type { DatabaseConnection } from '@/types';

/**
 * Mock database connection for testing purposes
 * This simulates the database operations without requiring actual database setup
 */
export class MockDatabaseConnection implements DatabaseConnection {
  private data: Map<string, any[]> = new Map();
  private nextId: number = 1;

  constructor(initialData?: Map<string, any[]>) {
    // Initialize with provided data or default sample data
    if (initialData) {
      this.data = initialData;
    } else {
      // Default sample data for testing - using snake_case to match database schema
      this.data.set('adventures', [
        {
          id: 'adv-1',
          title: 'The Old Necropolis',
          description: 'A mysterious dungeon crawl through an ancient necropolis.',
          author: 'Test Author',
          status: 'draft',
          tags: JSON.stringify(['dungeon', 'horror', 'mystery']),
          starting_scene_id: 'scene-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      this.data.set('scenes', [
        {
          id: 'scene-1',
          adventure_id: 'adv-1',
          name: 'The Entrance Hall',
          type: 'exploration',
          location: 'Necropolis Entrance',
          summary: 'A grand entrance to the ancient city',
          gm_description: 'The walls are covered in hieroglyphs and ancient symbols.',
          read_aloud: 'You stand before a massive stone entrance, covered in mysterious carvings.',
          atmosphere: 'Eerie and mysterious',
          tags: JSON.stringify(['entrance', 'ancient']),
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      this.data.set('npcs', [
        {
          id: 'npc-1',
          adventure_id: 'adv-1',
          name: 'Guard Captain Marcus',
          description: 'A stern guardian of the necropolis entrance.',
          faction: 'City Guard',
          stat_block: JSON.stringify({
            abilities: ['Sword Strike', 'Shield Bash'],
            ac: 16,
            hp: 45,
            speed: 30
          }),
          tags: JSON.stringify(['guard', 'captain']),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      this.data.set('scene_npcs', []);
      this.data.set('exit_options', []);
      this.data.set('sessions', []);
      this.data.set('scene_run_states', []);
      this.data.set('adventure_summaries', []);
      this.data.set('schema_metadata', [
        { key: 'schema_version', value: '1.0' }
      ]);
    }
    this.nextId = 2;
  }

  // Method to get all data for persistence
  getData(): Map<string, any[]> {
    return this.data;
  }

  prepare(sql: string): any {
    return {
      run: (...params: any[]) => {
        console.log('Mock SQL RUN:', sql, params);
        
        // Parse the SQL to determine operation
        if (sql.includes('INSERT INTO')) {
          return this.handleInsert(sql, params);
        } else if (sql.includes('UPDATE')) {
          return this.handleUpdate(sql, params);
        } else if (sql.includes('DELETE')) {
          return this.handleDelete(sql, params);
        }
        
        return { changes: 1, lastInsertROWID: this.nextId++ };
      },
      get: (...params: any[]) => {
        console.log('Mock SQL GET:', sql, params);
        // Return mock data for schema metadata
        if (sql.includes('schema_metadata')) {
          return { value: '1.0.0' };
        }
        
        // Handle SELECT by ID
        if (sql.includes('WHERE id = ?')) {
          return this.handleSelectById(sql, params);
        }
        
        // Handle COUNT queries
        if (sql.includes('COUNT(*)')) {
          return this.handleCount(sql, params);
        }
        
        return null;
      },
      all: (...params: any[]) => {
        console.log('Mock SQL ALL:', sql, params);
        
        // Handle SELECT * queries
        if (sql.includes('SELECT * FROM adventures')) {
          const adventures = this.data.get('adventures') || [];
          // Convert snake_case to camelCase for the application and parse JSON fields
          const convertedAdventures = adventures.map((adv: any) => {
            const parsed = {
              id: adv.id,
              title: adv.title,
              description: adv.description,
              startingSceneId: adv.starting_scene_id,
              tags: adv.tags,
              status: adv.status,
              author: adv.author,
              createdAt: adv.created_at,
              updatedAt: adv.updated_at
            };
            
            // Parse JSON fields
            if (parsed.tags && typeof parsed.tags === 'string') {
              try {
                parsed.tags = JSON.parse(parsed.tags);
              } catch (e) {
                console.warn('Failed to parse tags JSON:', parsed.tags);
                parsed.tags = [];
              }
            }
            
            return parsed;
          });
          console.log(`📋 SELECTED ${adventures.length} adventures:`, convertedAdventures);
          return convertedAdventures;
        }
        
        if (sql.includes('SELECT * FROM scenes')) {
          const scenes = this.data.get('scenes') || [];
          if (sql.includes('WHERE adventure_id = ?')) {
            return scenes.filter((scene: any) => scene.adventureId === params[0]);
          }
          return scenes;
        }
        
        if (sql.includes('SELECT * FROM npcs')) {
          const npcs = this.data.get('npcs') || [];
          if (sql.includes('WHERE adventure_id = ?')) {
            return npcs.filter((npc: any) => npc.adventureId === params[0]);
          }
          return npcs;
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

  private handleInsert(sql: string, params: any[]): { changes: number; lastInsertROWID: number } {
    // Parse table name from SQL
    const tableMatch = sql.match(/INSERT INTO (\w+)/);
    if (!tableMatch) return { changes: 0, lastInsertROWID: 0 };
    
    const tableName = tableMatch[1];
    const tableData = this.data.get(tableName) || [];
    
    // Parse column names from SQL
    const columnsMatch = sql.match(/\(([^)]+)\)/);
    if (!columnsMatch) return { changes: 0, lastInsertROWID: 0 };
    
    const columns = columnsMatch[1].split(',').map(col => col.trim());
    
    // Create new record - keep snake_case column names as they come from the database
    const newRecord: any = {};
    columns.forEach((col, index) => {
      newRecord[col] = params[index];
    });
    
    // Add to table data
    tableData.push(newRecord);
    this.data.set(tableName, tableData);
    
    console.log(`✅ INSERTED into ${tableName}:`, newRecord);
    console.log(`📊 Total ${tableName} records:`, tableData.length);
    
    return { changes: 1, lastInsertROWID: this.nextId++ };
  }

  private handleUpdate(sql: string, params: any[]): { changes: number; lastInsertROWID: number } {
    // Parse table name from SQL
    const tableMatch = sql.match(/UPDATE (\w+)/);
    if (!tableMatch) return { changes: 0, lastInsertROWID: 0 };
    
    const tableName = tableMatch[1];
    const tableData = this.data.get(tableName) || [];
    
    // Parse SET clause
    const setMatch = sql.match(/SET (.+?) WHERE/);
    if (!setMatch) return { changes: 0, lastInsertROWID: 0 };
    
    const setColumns = setMatch[1].split(',').map(set => set.trim());
    
    // Parse WHERE clause
    const whereMatch = sql.match(/WHERE (.+)/);
    if (!whereMatch) return { changes: 0, lastInsertROWID: 0 };
    
    // Extract ID from WHERE clause (simplified)
    const idIndex = params.length - 1; // ID is usually the last parameter
    const recordId = params[idIndex];
    
    let changes = 0;
    
    // Find and update the record
    for (let i = 0; i < tableData.length; i++) {
      const record = tableData[i];
      if (record.id === recordId) {
        setColumns.forEach((setClause, index) => {
          const colMatch = setClause.match(/(\w+) =/);
          if (colMatch) {
            const col = colMatch[1];
            const camelCaseCol = col.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            record[camelCaseCol] = params[index];
          }
        });
        changes++;
        break;
      }
    }
    
    console.log(`Updated ${changes} records in ${tableName} with ID ${recordId}`);
    
    return { changes, lastInsertROWID: 0 };
  }

  private handleDelete(sql: string, params: any[]): { changes: number; lastInsertROWID: number } {
    // Parse table name from SQL
    const tableMatch = sql.match(/DELETE FROM (\w+)/);
    if (!tableMatch) return { changes: 0, lastInsertROWID: 0 };
    
    const tableName = tableMatch[1];
    const tableData = this.data.get(tableName) || [];
    
    // Parse WHERE clause
    const whereMatch = sql.match(/WHERE (.+)/);
    if (!whereMatch) return { changes: 0, lastInsertROWID: 0 };
    
    // Extract ID from WHERE clause (simplified)
    const recordId = params[0];
    
    // Find and remove the record
    const originalLength = tableData.length;
    const filteredData = tableData.filter(record => record.id !== recordId);
    this.data.set(tableName, filteredData);
    
    const changes = originalLength - filteredData.length;
    
    console.log(`Deleted ${changes} records from ${tableName} with ID ${recordId}`);
    
    return { changes, lastInsertROWID: 0 };
  }

  private handleSelectById(sql: string, params: any[]): any {
    // Parse table name from SQL
    const tableMatch = sql.match(/FROM (\w+)/);
    if (!tableMatch) return null;
    
    const tableName = tableMatch[1];
    const tableData = this.data.get(tableName) || [];
    
    // Find record by ID
    const recordId = params[0];
    const record = tableData.find((r: any) => r.id === recordId);
    
    if (!record) return null;
    
    // Convert snake_case to camelCase for adventures and parse JSON fields
    if (tableName === 'adventures') {
      const parsed = {
        id: record.id,
        title: record.title,
        description: record.description,
        startingSceneId: record.starting_scene_id,
        tags: record.tags,
        status: record.status,
        author: record.author,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      };
      
      // Parse JSON fields
      if (parsed.tags && typeof parsed.tags === 'string') {
        try {
          parsed.tags = JSON.parse(parsed.tags);
        } catch (e) {
          console.warn('Failed to parse tags JSON:', parsed.tags);
          parsed.tags = [];
        }
      }
      
      return parsed;
    }
    
    return record;
  }

  private handleCount(sql: string, params: any[]): { count: number } {
    // Parse table name from SQL
    const tableMatch = sql.match(/FROM (\w+)/);
    if (!tableMatch) return { count: 0 };
    
    const tableName = tableMatch[1];
    const tableData = this.data.get(tableName) || [];
    
    let count = tableData.length;
    
    // Handle WHERE clause if present
    if (sql.includes('WHERE')) {
      // Simple filtering for adventure_id
      if (sql.includes('adventure_id = ?')) {
        const adventureId = params[0];
        count = tableData.filter((record: any) => record.adventureId === adventureId).length;
      }
    }
    
    return { count };
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
      console.log('🗄️ Initializing enhanced mock database...');
      
      // Try to load data from localStorage first
      const savedData = this.loadFromLocalStorage();
      
      this.db = new MockDatabaseConnection(savedData);
      this.isInitialized = true;
      
      console.log('✅ Enhanced mock database initialized successfully');
    } catch (error) {
      console.error('❌ Enhanced mock database initialization failed:', error);
      throw error;
    }
  }

  private loadFromLocalStorage(): Map<string, any[]> | null {
    try {
      const savedData = localStorage.getItem('rpg-scene-navigator-db');
      if (savedData) {
        console.log('📂 Loading database from localStorage...');
        const data = JSON.parse(savedData);
        return new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('⚠️ Could not load database from localStorage:', error);
    }
    return null;
  }

  private saveToLocalStorage(): void {
    if (!this.db || !this.isInitialized) return;
    
    try {
      const data = Object.fromEntries(this.db.getData());
      localStorage.setItem('rpg-scene-navigator-db', JSON.stringify(data));
      console.log('💾 Database saved to localStorage');
    } catch (error) {
      console.warn('⚠️ Could not save database to localStorage:', error);
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
      // Save before closing
      this.saveToLocalStorage();
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    console.log('🔒 Enhanced mock database connection closed');
  }

  // Auto-save method - call this after important operations
  autoSave(): void {
    this.saveToLocalStorage();
  }

  // Utility method to reset database (for testing)
  async reset(): Promise<void> {
    this.close();
    
    // Remove from localStorage
    try {
      localStorage.removeItem('rpg-scene-navigator-db');
      console.log('🗑️ Database removed from localStorage');
    } catch (error) {
      console.warn('⚠️ Could not remove database from localStorage:', error);
    }
    
    // Reinitialize
    await this.initialize();
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
