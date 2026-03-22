// @ts-nocheck
// Export service for summaries and adventures

import type { GeneratedSummary, Adventure, Scene, NPC } from '@/types';
import { log } from '@/utils/logger';

export interface ExportOptions {
  format: 'markdown' | 'html' | 'pdf' | 'json' | 'txt';
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  customFilename?: string;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  mimeType?: string;
  error?: string;
}

export class ExportService {
  /**
   * Export a summary to various formats
   */
  static async exportSummary(
    summary: GeneratedSummary,
    options: ExportOptions = { format: 'markdown' }
  ): Promise<ExportResult> {
    try {
      log.export('exportSummary', 'ExportService', { 
        summaryId: summary.id,
        format: options.format,
        includeMetadata: options.includeMetadata 
      });

      let result: ExportResult;

      switch (options.format) {
        case 'markdown':
          result = await this.exportSummaryAsMarkdown(summary, options);
          break;
        case 'html':
          result = await this.exportSummaryAsHTML(summary, options);
          break;
        case 'txt':
          result = await this.exportSummaryAsText(summary, options);
          break;
        case 'json':
          result = await this.exportSummaryAsJSON(summary, options);
          break;
        case 'pdf':
          result = await this.exportSummaryAsPDF(summary, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      log.export('exportSummary', 'ExportService', { 
        success: result.success,
        format: options.format,
        filename: result.filename
      });

      return result;
    } catch (error) {
      log.error('export', 'Summary export failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Export an adventure with all its data
   */
  static async exportAdventure(
    adventure: Adventure,
    scenes: Scene[],
    npcs: NPC[],
    options: ExportOptions = { format: 'json' }
  ): Promise<ExportResult> {
    try {
      log.export('exportAdventure', 'ExportService', { 
        adventureId: adventure.id,
        format: options.format,
        scenesCount: scenes.length,
        npcsCount: npcs.length
      });

      let result: ExportResult;

      switch (options.format) {
        case 'json':
          result = await this.exportAdventureAsJSON(adventure, scenes, npcs, options);
          break;
        case 'markdown':
          result = await this.exportAdventureAsMarkdown(adventure, scenes, npcs, options);
          break;
        case 'html':
          result = await this.exportAdventureAsHTML(adventure, scenes, npcs, options);
          break;
        default:
          throw new Error(`Unsupported export format for adventure: ${options.format}`);
      }

      log.export('exportAdventure', 'ExportService', { 
        success: result.success,
        format: options.format,
        filename: result.filename
      });

      return result;
    } catch (error) {
      log.error('export', 'Adventure export failed', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Download exported data to user's computer
   */
  static downloadExport(result: ExportResult): void {
    if (!result.success || !result.data) {
      throw new Error('No data to download');
    }

    const url = URL.createObjectURL(result.data instanceof Blob ? result.data : new Blob([result.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename || 'export';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    log.export('downloadExport', 'ExportService', { filename: result.filename });
  }

  // Private export methods

  private static async exportSummaryAsMarkdown(summary: GeneratedSummary, options: ExportOptions): Promise<ExportResult> {
    let content = summary.content;

    if (options.includeMetadata) {
      const metadata = `---
title: ${summary.title}
type: ${summary.type}
generated_at: ${summary.generatedAt}
adventure_id: ${summary.adventureId}
${summary.sessionId ? `session_id: ${summary.sessionId}` : ''}
---

`;
      content = metadata + content;
    }

    if (options.includeTimestamp) {
      content = `*Exported on ${new Date().toLocaleString()}*\n\n${content}`;
    }

    const filename = options.customFilename || `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

    return {
      success: true,
      data: content,
      filename,
      mimeType: 'text/markdown'
    };
  }

  private static async exportSummaryAsHTML(summary: GeneratedSummary, options: ExportOptions): Promise<ExportResult> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${summary.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; margin-top: 2em; margin-bottom: 1em; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 20px; color: #666; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metadata { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .timestamp { color: #666; font-style: italic; text-align: center; margin-top: 40px; }
    </style>
</head>
<body>
    ${options.includeMetadata ? `
    <div class="metadata">
        <h2>Metadata</h2>
        <p><strong>Title:</strong> ${summary.title}</p>
        <p><strong>Type:</strong> ${summary.type}</p>
        <p><strong>Generated:</strong> ${new Date(summary.generatedAt).toLocaleString()}</p>
        <p><strong>Adventure ID:</strong> ${summary.adventureId}</p>
        ${summary.sessionId ? `<p><strong>Session ID:</strong> ${summary.sessionId}</p>` : ''}
    </div>
    ` : ''}
    
    <main>
        ${this.markdownToHTML(summary.content)}
    </main>
    
    ${options.includeTimestamp ? `
    <div class="timestamp">
        <p>Exported on ${new Date().toLocaleString()}</p>
    </div>
    ` : ''}
</body>
</html>`;

    const filename = options.customFilename || `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;

    return {
      success: true,
      data: htmlContent,
      filename,
      mimeType: 'text/html'
    };
  }

  private static async exportSummaryAsText(summary: GeneratedSummary, options: ExportOptions): Promise<ExportResult> {
    // Simple text conversion - remove markdown formatting
    let content = summary.content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list bullets
      .replace(/^\s*\d+\.\s+/gm, '• ') // Convert numbered lists
      .replace(/^\s*>\s+/gm, '') // Remove blockquotes
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\n{3,}/g, '\n\n'); // Reduce multiple newlines

    if (options.includeMetadata) {
      const metadata = `${summary.title}
${'='.repeat(summary.title.length)}
Type: ${summary.type}
Generated: ${new Date(summary.generatedAt).toLocaleString()}
Adventure ID: ${summary.adventureId}
${summary.sessionId ? `Session ID: ${summary.sessionId}` : ''}

`;
      content = metadata + content;
    }

    if (options.includeTimestamp) {
      content += `\n\nExported on ${new Date().toLocaleString()}`;
    }

    const filename = options.customFilename || `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;

    return {
      success: true,
      data: content,
      filename,
      mimeType: 'text/plain'
    };
  }

  private static async exportSummaryAsJSON(summary: GeneratedSummary, options: ExportOptions): Promise<ExportResult> {
    const exportData = {
      summary,
      exportedAt: new Date().toISOString(),
      exportOptions: options
    };

    const content = JSON.stringify(exportData, null, 2);
    const filename = options.customFilename || `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    return {
      success: true,
      data: content,
      filename,
      mimeType: 'application/json'
    };
  }

  private static async exportSummaryAsPDF(summary: GeneratedSummary, options: ExportOptions): Promise<ExportResult> {
    // For PDF export, we'll create a simple HTML-to-PDF conversion
    // In a real implementation, you'd use a library like jsPDF or puppeteer
    const htmlResult = await this.exportSummaryAsHTML(summary, options);
    
    if (!htmlResult.success) {
      return htmlResult;
    }

    // For now, we'll return the HTML and let the user handle PDF conversion
    // In a production app, you'd implement actual PDF generation
    const filename = options.customFilename || `${summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    
    return {
      success: true,
      data: htmlResult.data,
      filename,
      mimeType: 'text/html',
      error: 'PDF export not yet implemented. HTML file provided instead.'
    };
  }

  private static async exportAdventureAsJSON(adventure: Adventure, scenes: Scene[], npcs: NPC[], options: ExportOptions): Promise<ExportResult> {
    const exportData = {
      schemaVersion: '1.0',
      fileType: 'adventure',
      exportedAt: new Date().toISOString(),
      exportOptions: options,
      adventure: {
        ...adventure,
        // Remove internal fields if needed
        createdAt: adventure.createdAt,
        updatedAt: adventure.updatedAt
      },
      scenes: scenes,
      npcs: npcs
    };

    const content = JSON.stringify(exportData, null, 2);
    const filename = options.customFilename || `${adventure.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    return {
      success: true,
      data: content,
      filename,
      mimeType: 'application/json'
    };
  }

  private static async exportAdventureAsMarkdown(adventure: Adventure, scenes: Scene[], npcs: NPC[], options: ExportOptions): Promise<ExportResult> {
    let content = `# ${adventure.title}

${adventure.description ? adventure.description : ''}

## Adventure Details

**Author:** ${adventure.author || 'Unknown'}  
**Status:** ${adventure.status}  
**Created:** ${new Date(adventure.createdAt).toLocaleDateString()}  
**Updated:** ${new Date(adventure.updatedAt).toLocaleDateString()}  

${adventure.tags && adventure.tags.length > 0 ? `
**Tags:** ${Array.isArray(adventure.tags) ? adventure.tags.join(', ') : adventure.tags}
` : ''}

${adventure.startingSceneId ? `
**Starting Scene:** ${scenes.find(s => s.id === adventure.startingSceneId)?.name || adventure.startingSceneId}
` : ''}

---

## Scenes (${scenes.length})

${scenes.map((scene, index) => `
### ${index + 1}. ${scene.name}

**Location:** ${scene.location || 'Unknown'}  
**Type:** ${scene.type}

${scene.summary ? scene.summary : ''}

${scene.readAloud ? `
**Read Aloud:**
*${scene.readAloud}*
` : ''}

${scene.atmosphere ? `
**Atmosphere:**
*${scene.atmosphere}*
` : ''}

${scene.exitOptions && scene.exitOptions.length > 0 ? `
**Exit Options:**
${scene.exitOptions.map((exit, i) => `${i + 1}. ${exit.description} → ${scenes.find(s => s.id === exit.destinationSceneId)?.name || exit.destinationSceneId}`).join('\n')}
` : ''}
`).join('\n---\n')}

---

## NPCs (${npcs.length})

${npcs.map((npc, index) => `
### ${index + 1}. ${npc.name}

**Faction:** ${npc.faction || 'Unknown'}  
**Role:** ${npc.role || 'Unknown'}

${npc.description ? npc.description : ''}

${npc.statBlock ? `
**Stat Block:**
\`\`\`
${npc.statBlock}
\`\`\`
` : ''}
`).join('\n---\n')}
`;

    if (options.includeTimestamp) {
      content += `\n\n---\n\n*Exported on ${new Date().toLocaleString()}*`;
    }

    const filename = options.customFilename || `${adventure.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;

    return {
      success: true,
      data: content,
      filename,
      mimeType: 'text/markdown'
    };
  }

  private static async exportAdventureAsHTML(adventure: Adventure, scenes: Scene[], npcs: NPC[], options: ExportOptions): Promise<ExportResult> {
    const markdownResult = await this.exportAdventureAsMarkdown(adventure, scenes, npcs, options);
    
    if (!markdownResult.success) {
      return markdownResult;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${adventure.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 1000px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; margin-top: 2em; margin-bottom: 1em; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .scene, .npc { margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .scene h3, .npc h3 { margin-top: 0; color: #2c5aa0; }
        .metadata { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .exit-options { background: #e8f4fd; padding: 10px; border-radius: 3px; margin: 10px 0; }
        .stat-block { background: #f4f4f4; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }
        .timestamp { color: #666; font-style: italic; text-align: center; margin-top: 40px; }
    </style>
</head>
<body>
    ${this.markdownToHTML(markdownResult.data as string)}
</body>
</html>`;

    const filename = options.customFilename || `${adventure.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;

    return {
      success: true,
      data: htmlContent,
      filename,
      mimeType: 'text/html'
    };
  }

  /**
   * Simple markdown to HTML conversion
   */
  private static markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>')
      .replace(/^(.*)$/gim, '<p>$1</p>')
      .replace(/<p><\/p>/gim, '')
      .replace(/<p>(<h[1-6]>)/gim, '$1')
      .replace(/(<\/h[1-6]>)<\/p>/gim, '$1')
      .replace(/<p>(<div)/gim, '$1')
      .replace(/(<\/div>)<\/p>/gim, '$1');
  }
}
