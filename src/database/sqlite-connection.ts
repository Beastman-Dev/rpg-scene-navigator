// Real SQLite database connection using sql.js (browser-compatible)
import initSqlJs from 'sql.js';
import { INIT_SCHEMA_SQL, VALIDATE_SCHEMA_SQL } from './schema';
import type { DatabaseConnection } from '@/types';

// SQL.js types
interface SqlJsDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqlJsStatement;
  run(sql: string, ...params: any[]): SqlJsRunResult;
  get(sql: string, ...params: any[]): any;
  all(sql: string, ...params: any[]): any[];
  close(): void;
}

interface SqlJsStatement {
  run(...params: any[]): SqlJsRunResult;
  get(...params: any[]): any;
  all(...params: any[]): any[];
  bind(...params: any[]): void;
  free(): void;
  // Add the missing finalize method to match the Statement interface
  finalize(): void;
}

interface SqlJsRunResult {
  changes: number;
  lastInsertRowid: number;
}

/**
 * Real SQLite database connection using sql.js (WebAssembly SQLite for browsers)
 */
export class SQLiteDatabaseConnection implements DatabaseConnection {
  private db: SqlJsDatabase;

  constructor(database: SqlJsDatabase) {
    this.db = database;
  }

  prepare(sql: string): SqlJsStatement {
    return this.db.prepare(sql);
  }

  exec(sql: string): void {
    this.db.exec(sql);
  }

  transaction<T>(fn: () => T): T {
    // sql.js doesn't have explicit transaction support, but operations are atomic
    return fn();
  }

  close(): void {
    this.db.close();
  }
}

export class SQLiteDatabaseManager {
  private db: SQLiteDatabaseConnection | null = null;
  private isInitialized = false;
  private sqlJs: any = null;

  constructor(private dbName: string = 'rpg-scene-navigator') {}

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🗄️ Initializing SQL.js database...');
      
      // Initialize sql.js with simpler configuration
      this.sqlJs = await initSqlJs();

      // Try to load existing database from localStorage
      let database: SqlJsDatabase;
      const savedDb = localStorage.getItem(this.dbName);
      
      if (savedDb) {
        console.log('📂 Loading existing database from localStorage...');
        const uInt8Array = new Uint8Array(JSON.parse(savedDb));
        database = new this.sqlJs.Database(uInt8Array);
      } else {
        console.log('🆕 Creating new database...');
        database = new this.sqlJs.Database();
      }

      // Check if schema exists and is up to date
      try {
        const schemaVersion = database.prepare(VALIDATE_SCHEMA_SQL).get() as { value: string };
        
        if (!schemaVersion) {
          console.log('📝 Creating new database schema...');
          database.exec(INIT_SCHEMA_SQL);
          console.log('✅ Database schema created successfully');
        } else {
          console.log('📋 Database schema version:', schemaVersion.value);
        }
      } catch (error) {
        console.log('📝 Creating new database schema (validation failed)...');
        database.exec(INIT_SCHEMA_SQL);
        console.log('✅ Database schema created successfully');
      }

      this.db = new SQLiteDatabaseConnection(database);
      this.isInitialized = true;
      
      // Save database to localStorage after initialization
      this.saveToLocalStorage();
      
      console.log('✅ SQL.js database initialized successfully');
    } catch (error) {
      console.error('❌ SQL.js database initialization failed:', error);
      throw error;
    }
  }

  private saveToLocalStorage(): void {
    if (!this.db || !this.isInitialized) return;
    
    try {
      // Get the database as Uint8Array and save to localStorage
      const uInt8Array = this.sqlJs.export();
      localStorage.setItem(this.dbName, JSON.stringify(Array.from(uInt8Array)));
      console.log('💾 Database saved to localStorage');
    } catch (error) {
      console.warn('⚠️ Could not save database to localStorage:', error);
    }
  }

  getConnection(): SQLiteDatabaseConnection {
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
    console.log('🔒 SQL.js database connection closed');
  }

  // Utility method to reset database (for testing)
  async reset(): Promise<void> {
    this.close();
    
    // Remove from localStorage
    try {
      localStorage.removeItem(this.dbName);
      console.log('🗑️ Database removed from localStorage');
    } catch (error) {
      console.warn('⚠️ Could not remove database from localStorage:', error);
    }
    
    // Reinitialize
    await this.initialize();
  }

  // Auto-save method - call this after important operations
  autoSave(): void {
    this.saveToLocalStorage();
  }
}

// Singleton instance
let sqliteDatabaseManager: SQLiteDatabaseManager | null = null;

export function getDatabaseManager(): SQLiteDatabaseManager {
  if (!sqliteDatabaseManager) {
    sqliteDatabaseManager = new SQLiteDatabaseManager();
  }
  return sqliteDatabaseManager;
}

export async function initializeDatabase(): Promise<SQLiteDatabaseManager> {
  const manager = getDatabaseManager();
  await manager.initialize();
  return manager;
}
