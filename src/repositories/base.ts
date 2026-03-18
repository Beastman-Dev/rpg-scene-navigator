// @ts-nocheck
import type { IndexedDBConnection } from '@/database/indexeddb-connection';
import { JSON_FIELDS, BOOLEAN_FIELDS } from '@/database/schema';
import type { 
  CreateResult, 
  UpdateResult, 
  DeleteResult, 
  FindResult, 
  FindAllResult 
} from '@/types';
import { getDatabaseManager } from '@/database/connection';

/**
 * Base repository class with common database operations
 */
export abstract class BaseRepository<T extends { id: string }> {
  constructor(protected db: IndexedDBConnection) {}

  /**
   * Convert database row to entity
   */
  protected abstract rowToEntity(row: any): T;

  /**
   * Convert entity to database row
   */
  protected abstract entityToRow(entity: Partial<T>): any;

  /**
   * Get table name
   */
  protected abstract getTableName(): string;

  /**
   * Process JSON fields for database storage
   */
  protected processJsonFields(row: any, tableName: string): any {
    const jsonFields = JSON_FIELDS[tableName as keyof typeof JSON_FIELDS];
    if (!jsonFields) return row;

    const processed = { ...row };
    for (const field of jsonFields) {
      if (field in processed && processed[field] !== null && processed[field] !== undefined) {
        processed[field] = JSON.stringify(processed[field]);
      }
    }
    return processed;
  }

  /**
   * Parse JSON fields from database
   */
  protected parseJsonFields(row: any, tableName: string): any {
    const jsonFields = JSON_FIELDS[tableName as keyof typeof JSON_FIELDS];
    if (!jsonFields) return row;

    const parsed = { ...row };
    for (const field of jsonFields) {
      if (field in parsed && parsed[field] !== null && parsed[field] !== undefined) {
        // Only parse if it's a string (from database)
        if (typeof parsed[field] === 'string') {
          try {
            parsed[field] = JSON.parse(parsed[field]);
          } catch (error) {
            console.warn(`Failed to parse JSON field ${field}:`, error);
            parsed[field] = null;
          }
        }
        // If it's already an object/array, leave it as-is
      }
    }
    return parsed;
  }

  /**
   * Process boolean fields for database storage
   */
  protected processBooleanFields(row: any, tableName: string): any {
    const booleanFields = BOOLEAN_FIELDS[tableName as keyof typeof BOOLEAN_FIELDS];
    if (!booleanFields) return row;

    const processed = { ...row };
    for (const field of booleanFields) {
      if (field in processed) {
        processed[field] = processed[field] ? 1 : 0;
      }
    }
    return processed;
  }

  /**
   * Parse boolean fields from database
   */
  protected parseBooleanFields(row: any, tableName: string): any {
    const booleanFields = BOOLEAN_FIELDS[tableName as keyof typeof BOOLEAN_FIELDS];
    if (!booleanFields) return row;

    const parsed = { ...row };
    for (const field of booleanFields) {
      if (field in parsed) {
        parsed[field] = Boolean(parsed[field]);
      }
    }
    return parsed;
  }

  /**
   * Create a new entity
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreateResult<T>> {
    try {
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      
      const entity = {
        ...data,
        id,
        createdAt: now,
        updatedAt: now
      } as T;

      console.log('🏗️ BaseRepository - Creating entity:', entity);

      let row = this.entityToRow(entity);
      console.log('🔄 BaseRepository - Entity to row:', row);
      
      row = this.processJsonFields(row, this.getTableName());
      console.log('📦 BaseRepository - After JSON processing:', row);
      
      row = this.processBooleanFields(row, this.getTableName());
      console.log('✅ BaseRepository - After boolean processing:', row);

      const columns = Object.keys(row).join(', ');
      const placeholders = Object.keys(row).map(() => '?').join(', ');
      const values = Object.values(row);

      const sql = `INSERT INTO ${this.getTableName()} (${columns}) VALUES (${placeholders})`;
      console.log('💾 BaseRepository - SQL:', sql);
      console.log('📋 BaseRepository - Values:', values);
      
      this.db.prepare(sql).run(...values);
      
      // Auto-save to localStorage after insert
      getDatabaseManager().autoSave();

      return { success: true, data: entity };
    } catch (error) {
      console.error('❌ Create failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<FindResult<T>> {
    try {
      const sql = `SELECT * FROM ${this.getTableName()} WHERE id = ?`;
      const row = this.db.prepare(sql).get(id);
      
      if (!row) {
        return { success: false, error: 'Entity not found' };
      }

      let processedRow = this.parseJsonFields(row, this.getTableName());
      processedRow = this.parseBooleanFields(processedRow, this.getTableName());
      
      const entity = this.rowToEntity(processedRow);
      return { success: true, data: entity };
    } catch (error) {
      console.error('FindById failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Find all entities
   */
  async findAll(options?: { 
    limit?: number; 
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<FindAllResult<T>> {
    try {
      let sql = `SELECT * FROM ${this.getTableName()}`;
      const params: any[] = [];

      if (options?.orderBy) {
        sql += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
      }

      if (options?.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
      }

      if (options?.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }

      const rows = this.db.prepare(sql).all(...params);
      
      const entities = rows.map(row => {
        let processedRow = this.parseJsonFields(row, this.getTableName());
        processedRow = this.parseBooleanFields(processedRow, this.getTableName());
        return this.rowToEntity(processedRow);
      });

      return { success: true, data: entities };
    } catch (error) {
      console.error('FindAll failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update an entity
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<UpdateResult<T>> {
    try {
      console.log('🔄 BaseRepository.update - Starting update for ID:', id);
      console.log('📥 BaseRepository.update - Input data:', data);
      
      // First check if entity exists
      const existing = await this.findById(id);
      if (!existing.success) {
        return { success: false, error: 'Entity not found' };
      }
      console.log('✅ BaseRepository.update - Existing entity found:', existing.data);

      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      console.log('📝 BaseRepository.update - Update data with timestamp:', updateData);

      let row = this.entityToRow(updateData);
      console.log('🔄 BaseRepository.update - After entityToRow:', row);
      
      row = this.processJsonFields(row, this.getTableName());
      console.log('📦 BaseRepository.update - After processJsonFields:', row);
      
      row = this.processBooleanFields(row, this.getTableName());
      console.log('✅ BaseRepository.update - After processBooleanFields:', row);

      if (Object.keys(row).length === 0) {
        return { success: false, error: 'No fields to update' };
      }

      const setClause = Object.keys(row).map(key => `${key} = ?`).join(', ');
      const values = Object.values(row);
      values.push(id); // For WHERE clause

      const sql = `UPDATE ${this.getTableName()} SET ${setClause} WHERE id = ?`;
      console.log('💾 BaseRepository.update - SQL:', sql);
      console.log('📋 BaseRepository.update - Values:', values);
      
      const result = this.db.prepare(sql).run(...values);
      console.log('✅ BaseRepository.update - Update result:', result);
      
      // Auto-save to localStorage after update
      getDatabaseManager().autoSave();

      // Return updated entity
      const updated = await this.findById(id);
      console.log('🎯 BaseRepository.update - Final updated entity:', updated.data);
      return updated;
    } catch (error) {
      console.error('Update failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: string): Promise<DeleteResult> {
    try {
      const sql = `DELETE FROM ${this.getTableName()} WHERE id = ?`;
      const result = this.db.prepare(sql).run(id);
      
      if (result.changes === 0) {
        return { success: false, error: 'Entity not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Delete failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Count entities
   */
  async count(): Promise<number> {
    try {
      const sql = `SELECT COUNT(*) as count FROM ${this.getTableName()}`;
      const result = this.db.prepare(sql).get() as { count: number };
      return result.count;
    } catch (error) {
      console.error('Count failed:', error);
      return 0;
    }
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const sql = `SELECT 1 FROM ${this.getTableName()} WHERE id = ? LIMIT 1`;
      const result = this.db.prepare(sql).get(id);
      return !!result;
    } catch (error) {
      console.error('Exists check failed:', error);
      return false;
    }
  }
}
