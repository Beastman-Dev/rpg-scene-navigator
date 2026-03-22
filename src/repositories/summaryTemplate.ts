// @ts-nocheck
// Repository for managing summary templates

import { BaseRepository } from './base';
import type { SummaryTemplate, CreateResult, UpdateResult, DeleteResult } from '@/types/summary-templates';
import { BUILTIN_TEMPLATES } from '@/types/summary-templates';
import { log } from '@/utils/logger';

export class SummaryTemplateRepository extends BaseRepository<SummaryTemplate> {
  constructor(connection: any) {
    super(connection);
  }

  protected getTableName(): string {
    return 'summary_templates';
  }

  /**
   * Get all templates, including built-in ones
   */
  async getAllTemplates(): Promise<{ success: boolean; data?: SummaryTemplate[]; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      // Get custom templates from database
      const result = this.db.prepare(
        'SELECT * FROM summary_templates ORDER BY updated_at DESC'
      ).all();
      
      const customTemplates = result.map(this.rowToEntity);

      // Combine with built-in templates
      const allTemplates = [
        ...this.getBuiltinTemplates(),
        ...customTemplates
      ];

      log.repository('getAllTemplates', 'summary_templates', { 
        totalTemplates: allTemplates.length,
        customTemplates: customTemplates.length,
        builtinTemplates: this.getBuiltinTemplates().length
      });

      return { success: true, data: allTemplates };
    } catch (error) {
      log.error('repository', 'getAllTemplates failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Failed to get templates: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(type: SummaryTemplate['type']): Promise<{ success: boolean; data?: SummaryTemplate[]; error?: string }> {
    try {
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      // Get custom templates by type
      const result = this.db.prepare(
        'SELECT * FROM summary_templates WHERE type = ? ORDER BY updated_at DESC'
      ).all(type);
      
      const customTemplates = result.map(this.rowToEntity);

      // Combine with built-in templates of the same type
      const builtinTemplates = this.getBuiltinTemplates().filter(template => template.type === type);
      const allTemplates = [...builtinTemplates, ...customTemplates];

      log.repository('getTemplatesByType', 'summary_templates', { 
        type,
        totalTemplates: allTemplates.length,
        customTemplates: customTemplates.length,
        builtinTemplates: builtinTemplates.length
      });

      return { success: true, data: allTemplates };
    } catch (error) {
      log.error('repository', 'getTemplatesByType failed', error instanceof Error ? error : new Error(String(error)), { type });
      return { success: false, error: `Failed to get templates by type: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get template by ID (including built-in templates)
   */
  async getTemplateById(id: string): Promise<{ success: boolean; data?: SummaryTemplate | null; error?: string }> {
    try {
      // First check built-in templates
      const builtinTemplate = this.getBuiltinTemplates().find(template => template.id === id);
      if (builtinTemplate) {
        log.repository('getTemplateById', 'summary_templates', { id, source: 'builtin' });
        return { success: true, data: builtinTemplate };
      }

      // Then check custom templates
      if (!this.db) {
        return { success: false, error: 'Database connection not available' };
      }

      const result = this.db.prepare(
        'SELECT * FROM summary_templates WHERE id = ?'
      ).get(id);
      
      if (!result) {
        log.repository('getTemplateById', 'summary_templates', { id, found: false });
        return { success: true, data: null };
      }

      const template = this.rowToEntity(result);
      log.repository('getTemplateById', 'summary_templates', { id, found: true, source: 'custom' });
      return { success: true, data: template };
    } catch (error) {
      log.error('repository', 'getTemplateById failed', error instanceof Error ? error : new Error(String(error)), { id });
      return { success: false, error: `Failed to get template: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Create a custom template
   */
  async createCustomTemplate(template: Omit<SummaryTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreateResult<SummaryTemplate>> {
    try {
      const now = new Date().toISOString();
      const newTemplate: Omit<SummaryTemplate, 'id'> = {
        ...template,
        createdAt: now,
        updatedAt: now
      };

      const result = await this.create(newTemplate);
      
      log.repository('createCustomTemplate', 'summary_templates', { 
        success: result.success,
        templateName: template.name,
        templateType: template.type
      });

      return result;
    } catch (error) {
      log.error('repository', 'createCustomTemplate failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Failed to create custom template: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Update a custom template
   */
  async updateCustomTemplate(id: string, updates: Partial<Omit<SummaryTemplate, 'id' | 'createdAt'>>): Promise<UpdateResult<SummaryTemplate>> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const result = await this.update(id, updateData);
      
      log.repository('updateCustomTemplate', 'summary_templates', { 
        success: result.success,
        templateId: id,
        updatedFields: Object.keys(updates)
      });

      return result;
    } catch (error) {
      log.error('repository', 'updateCustomTemplate failed', error instanceof Error ? error : new Error(String(error)), { id });
      return { success: false, error: `Failed to update custom template: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Delete a custom template
   */
  async deleteCustomTemplate(id: string): Promise<DeleteResult> {
    try {
      // Prevent deletion of built-in templates
      const builtinTemplate = this.getBuiltinTemplates().find(template => template.id === id);
      if (builtinTemplate) {
        log.warn('repository', 'Attempted to delete built-in template', { id });
        return { success: false, error: 'Cannot delete built-in templates' };
      }

      const result = await this.delete(id);
      
      log.repository('deleteCustomTemplate', 'summary_templates', { 
        success: result.success,
        templateId: id
      });

      return result;
    } catch (error) {
      log.error('repository', 'deleteCustomTemplate failed', error instanceof Error ? error : new Error(String(error)), { id });
      return { success: false, error: `Failed to delete custom template: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Get built-in templates with generated IDs
   */
  private getBuiltinTemplates(): SummaryTemplate[] {
    const now = new Date().toISOString();
    
    return BUILTIN_TEMPLATES.map((template, index) => ({
      ...template,
      id: `builtin_${template.name.toLowerCase().replace(/\s+/g, '_')}_${index}`,
      createdAt: now,
      updatedAt: now
    }));
  }

  // Convert database row to SummaryTemplate entity
  protected rowToEntity(row: any): SummaryTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      type: row.type,
      template: row.template,
      variables: JSON.parse(row.variables || '[]'),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Convert SummaryTemplate entity to database row
  protected entityToRow(entity: Omit<SummaryTemplate, 'id'>): any {
    return {
      name: entity.name,
      description: entity.description,
      type: entity.type,
      template: entity.template,
      variables: JSON.stringify(entity.variables),
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }
}
