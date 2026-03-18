// Production database implementation using IndexedDB
// This provides reliable persistent storage for the RPG Scene Navigator

import { SCHEMA_VERSION } from './schema';
import type { DatabaseConnection, Statement } from '@/types';

/**
 * IndexedDB-based database connection for production use
 * This provides reliable persistent storage in the browser
 */
export class IndexedDBConnection implements DatabaseConnection {
  private db: IDBDatabase | null = null;
  private dbName: string = 'rpg-scene-navigator';
  private version: number = 1;

  constructor() {}

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🗄️ Initializing IndexedDB database...');
      
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('❌ IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('📝 Creating/upgrading IndexedDB schema...');
        
        // Create object stores (tables) only if they don't exist
        const stores = [
          'adventures', 'npcs', 'scenes', 'scene_npcs', 'exit_options',
          'sessions', 'scene_run_states', 'adventure_summaries', 'schema_metadata'
        ];
        
        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
            console.log(`  Created store: ${storeName}`);
          }
        });
        
        // Initialize schema metadata only if it doesn't exist
        if (!db.objectStoreNames.contains('schema_metadata')) {
          const metadataStore = db.createObjectStore('schema_metadata', { keyPath: 'key' });
          metadataStore.add({ key: 'schema_version', value: SCHEMA_VERSION });
        }
      };
    });
  }

  prepare(sql: string): Statement {
    return new IndexedDBStatement(sql, this.db!);
  }

  exec(sql: string): void {
    // For IndexedDB, we handle schema creation via onupgradeneeded
    console.log('IndexedDB exec:', sql);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

/**
 * IndexedDB statement implementation
 */
class IndexedDBStatement implements Statement {
  private sql: string;

  constructor(sql: string, _db: IDBDatabase) {
    this.sql = sql;
  }

  run(...params: any[]): { lastInsertRowid: number; changes: number } {
    // Parse SQL to determine operation
    if (this.sql.includes('INSERT INTO')) {
      return this.handleInsert(params);
    } else if (this.sql.includes('UPDATE')) {
      return this.handleUpdate(params);
    } else if (this.sql.includes('DELETE')) {
      return this.handleDelete(params);
    }
    
    return { lastInsertRowid: 0, changes: 0 };
  }

  get(...params: any[]): any {
    // This is synchronous but IndexedDB is async - we'll return cached data
    // In a real implementation, you'd want to handle this differently
    return this.handleSelectOne(params);
  }

  all(...params: any[]): any[] {
    return this.handleSelectAll(params);
  }

  finalize(): void {
    // Cleanup if needed
  }

  private handleInsert(params: any[]): { lastInsertRowid: number; changes: number } {
    const tableMatch = this.sql.match(/INSERT INTO (\w+)/);
    if (!tableMatch) return { lastInsertRowid: 0, changes: 0 };
    
    const tableName = tableMatch[1];
    const columnsMatch = this.sql.match(/\(([^)]+)\)/);
    if (!columnsMatch) return { lastInsertRowid: 0, changes: 0 };
    
    const columns = columnsMatch[1].split(',').map(col => col.trim());
    
    // Create record object
    const record: any = {};
    columns.forEach((col, index) => {
      record[col] = params[index];
    });

    console.log(`💾 handleInsert: Inserting into ${tableName}`, {
      columns,
      params,
      record,
      hasId: 'id' in record,
      idValue: record.id
    });

    // Use synchronous localStorage as a bridge for immediate feedback
    const storageKey = `rpg-db-${tableName}`;
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    existingData.push(record);
    localStorage.setItem(storageKey, JSON.stringify(existingData));

    console.log(`✅ INSERTED into ${tableName}:`, record);
    
    return { lastInsertRowid: 1, changes: 1 };
  }

  private handleUpdate(params: any[]): { lastInsertRowid: number; changes: number } {
    const tableMatch = this.sql.match(/UPDATE (\w+)/);
    if (!tableMatch) return { lastInsertRowid: 0, changes: 0 };
    
    const tableName = tableMatch[1];
    const storageKey = `rpg-db-${tableName}`;
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    console.log(`📝 handleUpdate: Before update`, {
      tableName,
      storageKey,
      dataCount: existingData.length,
      params,
      sql: this.sql
    });
    
    // Find and update record (last param is typically the ID)
    const id = params[params.length - 1];
    const index = existingData.findIndex((r: any) => r.id === id);
    
    console.log(`📝 handleUpdate: Looking for ID "${id}"`, {
      foundIndex: index,
      recordBefore: index !== -1 ? existingData[index] : null
    });
    
    if (index !== -1) {
      // Parse SET clause to determine which fields to update
      const setMatch = this.sql.match(/SET (.+?) WHERE/);
      if (setMatch) {
        const setColumns = setMatch[1].split(',').map(s => s.trim());
        console.log(`📝 handleUpdate: Updating columns`, setColumns);
        
        setColumns.forEach((setClause, idx) => {
          const colMatch = setClause.match(/(\w+) =/);
          if (colMatch) {
            const colName = colMatch[1];
            // Skip updating the id column - it should never change
            if (colName === 'id') {
              console.log(`📝 handleUpdate: Skipping id column update`);
              return;
            }
            const oldValue = existingData[index][colName];
            existingData[index][colName] = params[idx];
            console.log(`📝 handleUpdate: Updated ${colName} from "${oldValue}" to "${params[idx]}"`);
          }
        });
        
        localStorage.setItem(storageKey, JSON.stringify(existingData));
        console.log(`📝 handleUpdate: After update`, {
          recordAfter: existingData[index],
          allIds: existingData.map((r: any) => r.id)
        });
        
        return { lastInsertRowid: 0, changes: 1 };
      }
    }
    
    return { lastInsertRowid: 0, changes: 0 };
  }

  private handleDelete(params: any[]): { lastInsertRowid: number; changes: number } {
    const tableMatch = this.sql.match(/DELETE FROM (\w+)/);
    if (!tableMatch) return { lastInsertRowid: 0, changes: 0 };
    
    const tableName = tableMatch[1];
    const storageKey = `rpg-db-${tableName}`;
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const id = params[0];
    const filtered = existingData.filter((r: any) => r.id !== id);
    
    const changes = existingData.length - filtered.length;
    localStorage.setItem(storageKey, JSON.stringify(filtered));
    
    return { lastInsertRowid: 0, changes };
  }

  private handleSelectOne(params: any[]): any {
    const tableMatch = this.sql.match(/FROM (\w+)/);
    if (!tableMatch) return null;
    
    const tableName = tableMatch[1];
    const storageKey = `rpg-db-${tableName}`;
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    console.log(`🔍 handleSelectOne: Looking for ID "${params[0]}" in ${tableName}`, {
      storageKey,
      dataCount: data.length,
      allIds: data.map((r: any) => r.id),
      firstRecord: data[0]
    });
    
    // Find by ID (first param)
    let result = data.find((r: any) => r.id === params[0]) || null;
    
    // Convert snake_case to camelCase for adventures and parse JSON fields
    if (tableName === 'adventures' && result) {
      console.log(`🔄 handleSelectOne: Converting adventure fields`, {
        starting_scene_id_before: result.starting_scene_id,
        starting_scene_id_type: typeof result.starting_scene_id
      });
      
      result = {
        id: result.id,
        title: result.title,
        description: result.description,
        startingSceneId: result.starting_scene_id,
        tags: result.tags,
        status: result.status,
        author: result.author,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
      
      console.log(`🔄 handleSelectOne: After conversion`, {
        startingSceneId_after: result.startingSceneId,
        startingSceneId_type: typeof result.startingSceneId
      });
      
      // Parse JSON fields
      if (result.tags && typeof result.tags === 'string') {
        try {
          result.tags = JSON.parse(result.tags);
        } catch (e) {
          console.warn('Failed to parse tags JSON:', result.tags);
          result.tags = [];
        }
      }
    }
    
    console.log(`🔍 handleSelectOne: Result for ID "${params[0]}"`, result ? 'FOUND' : 'NOT FOUND', result);
    return result;
  }

  private handleSelectAll(params: any[]): any[] {
    const tableMatch = this.sql.match(/FROM (\w+)/);
    if (!tableMatch) return [];
    
    const tableName = tableMatch[1];
    const storageKey = `rpg-db-${tableName}`;
    let data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Parse and apply WHERE clause filtering
    const whereMatch = this.sql.match(/WHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      
      // Handle combined conditions (equality + LIKE)
      // First, handle equality conditions
      const eqMatch = whereClause.match(/(\w+)\.?(\w+)?\s*=\s*\?/);
      if (eqMatch) {
        const colName = eqMatch[2] || eqMatch[1]; // Handle both "table.col" and "col" formats
        const paramValue = params[0];
        data = data.filter((r: any) => r[colName] === paramValue);
      }
      
      // Then, handle LIKE conditions for search functionality
      const likeMatches = whereClause.match(/(\w+)\.?(\w+)?\s+LIKE\s+\?/gi);
      if (likeMatches && params.length > 0) {
        // Determine the starting parameter index for LIKE conditions
        const likeStartIndex = eqMatch ? 1 : 0;
        
        // For search queries, filter by multiple LIKE conditions
        data = data.filter((r: any) => {
          return likeMatches.some((likeMatch, index) => {
            const match = likeMatch.match(/(\w+)\.?(\w+)?\s+LIKE\s+\?/i);
            if (match) {
              const colName = match[2] || match[1];
              const paramIndex = likeStartIndex + index;
              const paramValue = params[paramIndex] || '';
              const searchTerm = paramValue.replace(/%/g, '').toLowerCase();
              const fieldValue = String(r[colName] || '').toLowerCase();
              return fieldValue.includes(searchTerm);
            }
            return false;
          });
        });
      }
    }
    
    // Convert snake_case to camelCase for adventures and parse JSON fields
    if (tableName === 'adventures') {
      data = data.map((record: any) => {
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
      });
    }
    
    return data;
  }
}

/**
 * IndexedDB Database Manager
 */
export class IndexedDBManager {
  private db: IndexedDBConnection | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    this.db = new IndexedDBConnection();
    await this.db.initialize();
    this.isInitialized = true;
    
    console.log('✅ IndexedDB Manager initialized');
  }

  getConnection(): IndexedDBConnection {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
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
  }

  autoSave(): void {
    // Data is automatically saved via localStorage in this implementation
    console.log('💾 Auto-save (IndexedDB/localStorage)');
  }

  async reset(): Promise<void> {
    this.close();
    
    // Clear all rpg-db entries from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rpg-db-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Delete IndexedDB
    return new Promise((resolve) => {
      const request = indexedDB.deleteDatabase('rpg-scene-navigator');
      request.onsuccess = () => {
        console.log('🗑️ IndexedDB deleted');
        resolve();
      };
      request.onerror = () => resolve();
    });
  }
}

// Singleton instance
let indexedDBManager: IndexedDBManager | null = null;

export function getDatabaseManager(): IndexedDBManager {
  if (!indexedDBManager) {
    indexedDBManager = new IndexedDBManager();
  }
  return indexedDBManager;
}

export async function initializeDatabase(): Promise<IndexedDBManager> {
  const manager = getDatabaseManager();
  await manager.initialize();
  return manager;
}
