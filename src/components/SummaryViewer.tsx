// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Calendar, Clock, FileText, Users, MapPin, Eye, Edit, Trash2, Copy, Settings } from 'lucide-react';
import type { GeneratedSummary, SummaryStatistics } from '@/types';
import { log } from '@/utils/logger';
import { ExportService, type ExportOptions } from '@/services/export';

interface SummaryViewerProps {
  adventureId: string;
  adventureTitle: string;
  onBack: () => void;
  onEditSummary?: (summary: GeneratedSummary) => void;
  className?: string;
}

export function SummaryViewer({ 
  adventureId, 
  adventureTitle, 
  onBack, 
  onEditSummary,
  className = '' 
}: SummaryViewerProps) {
  const [summaries, setSummaries] = useState<GeneratedSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<GeneratedSummary | null>(null);
  const [statistics, setStatistics] = useState<SummaryStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'session' | 'adventure_completion' | 'character_development'>('all');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'markdown',
    includeMetadata: true,
    includeTimestamp: true
  });

  useEffect(() => {
    loadSummaries();
  }, [adventureId]);

  const loadSummaries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const dbManager = (await import('@/database/connection')).getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not ready');
      }

      const connection = await dbManager.getConnectionAsync();
      const { GeneratedSummaryRepository } = await import('@/repositories');
      const summaryRepo = new GeneratedSummaryRepository(connection);

      // Load summaries
      const summariesResult = await summaryRepo.findByAdventureId(adventureId);
      if (summariesResult.success && summariesResult.data) {
        setSummaries(summariesResult.data);
        
        // Select the most recent summary by default
        if (summariesResult.data.length > 0) {
          setSelectedSummary(summariesResult.data[0]);
        }
      } else {
        setError(summariesResult.error || 'Failed to load summaries');
      }

      // Load statistics
      const statsResult = await summaryRepo.getStatistics(adventureId);
      if (statsResult.success && statsResult.data) {
        setStatistics(statsResult.data);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load summaries';
      setError(errorMessage);
      log.error('ui', 'Failed to load summaries', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSummaries = summaries.filter(summary => 
    filter === 'all' || summary.type === filter
  );

  const handleDeleteSummary = async (summaryId: string) => {
    if (!window.confirm('Are you sure you want to delete this summary?')) {
      return;
    }

    try {
      const dbManager = (await import('@/database/connection')).getDatabaseManager();
      const connection = await dbManager.getConnectionAsync();
      const { GeneratedSummaryRepository } = await import('@/repositories');
      const summaryRepo = new GeneratedSummaryRepository(connection);

      const result = await summaryRepo.deleteSummary(summaryId);
      if (result.success) {
        // Remove from local state
        setSummaries(prev => prev.filter(s => s.id !== summaryId));
        if (selectedSummary?.id === summaryId) {
          setSelectedSummary(null);
        }
        log.ui('handleDeleteSummary', 'SummaryViewer', { summaryId, success: true });
      } else {
        setError(result.error || 'Failed to delete summary');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete summary';
      setError(errorMessage);
      log.error('ui', 'Failed to delete summary', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleCopySummary = async (summary: GeneratedSummary) => {
    try {
      await navigator.clipboard.writeText(summary.content);
      log.ui('handleCopySummary', 'SummaryViewer', { summaryId: summary.id, success: true });
    } catch (err) {
      log.error('ui', 'Failed to copy summary', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleExportSummary = async (summary: GeneratedSummary) => {
    try {
      const result = await ExportService.exportSummary(summary, exportOptions);
      
      if (result.success) {
        ExportService.downloadExport(result);
        log.ui('handleExportSummary', 'SummaryViewer', { 
          summaryId: summary.id, 
          format: exportOptions.format,
          success: true 
        });
        setShowExportOptions(false);
      } else {
        setError(result.error || 'Export failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export summary';
      setError(errorMessage);
      log.error('ui', 'Failed to export summary', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSummaryTypeLabel = (type: GeneratedSummary['type']) => {
    switch (type) {
      case 'session': return 'Session Summary';
      case 'adventure_completion': return 'Adventure Complete';
      case 'character_development': return 'Character Development';
      default: return 'Summary';
    }
  };

  const getSummaryTypeColor = (type: GeneratedSummary['type']) => {
    switch (type) {
      case 'session': return 'bg-blue-100 text-blue-800';
      case 'adventure_completion': return 'bg-green-100 text-green-800';
      case 'character_development': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summaries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Adventure
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={loadSummaries}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Adventure
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Summaries: {adventureTitle}
        </h1>
        
        {/* Statistics */}
        {statistics && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">Total Summaries:</span>
              <span className="ml-2 font-semibold">{statistics.totalSummaries}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">Sessions:</span>
              <span className="ml-2 font-semibold">{statistics.sessionSummaries}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">Completions:</span>
              <span className="ml-2 font-semibold">{statistics.adventureCompletionSummaries}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-600">Character Dev:</span>
              <span className="ml-2 font-semibold">{statistics.characterDevelopmentSummaries}</span>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['all', 'session', 'adventure_completion', 'character_development'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type === 'all' ? 'All' : getSummaryTypeLabel(type as GeneratedSummary['type'])}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary List */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Summary List</h2>
          {filteredSummaries.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No summaries found</p>
              <p className="text-sm text-gray-500 mt-1">
                {filter === 'all' 
                  ? 'Complete some sessions to see summaries here'
                  : `No ${getSummaryTypeLabel(filter as GeneratedSummary['type']).toLowerCase()} summaries found`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSummaries.map(summary => (
                <div
                  key={summary.id}
                  onClick={() => setSelectedSummary(summary)}
                  className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedSummary?.id === summary.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 flex-1">{summary.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSummaryTypeColor(summary.type)}`}>
                      {getSummaryTypeLabel(summary.type)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(summary.generatedAt)}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {summary.content.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Content */}
        <div className="lg:col-span-2">
          {selectedSummary ? (
            <div className="bg-white border border-gray-200 rounded-lg">
              {/* Summary Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedSummary.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(selectedSummary.generatedAt)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${getSummaryTypeColor(selectedSummary.type)}`}>
                        {getSummaryTypeLabel(selectedSummary.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopySummary(selectedSummary)}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowExportOptions(!showExportOptions)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        title="Export options"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {showExportOptions && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <div className="p-4">
                            <h4 className="font-medium mb-3">Export Options</h4>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                                <select
                                  value={exportOptions.format}
                                  onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as ExportOptions['format'] }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="markdown">Markdown</option>
                                  <option value="html">HTML</option>
                                  <option value="txt">Plain Text</option>
                                  <option value="json">JSON</option>
                                  <option value="pdf">PDF (HTML)</option>
                                </select>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exportOptions.includeMetadata}
                                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                                    className="mr-2"
                                  />
                                  <span className="text-sm text-gray-700">Include metadata</span>
                                </label>
                                
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exportOptions.includeTimestamp}
                                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeTimestamp: e.target.checked }))}
                                    className="mr-2"
                                  />
                                  <span className="text-sm text-gray-700">Include export timestamp</span>
                                </label>
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => handleExportSummary(selectedSummary!)}
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                >
                                  Export
                                </button>
                                <button
                                  onClick={() => setShowExportOptions(false)}
                                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {onEditSummary && (
                      <button
                        onClick={() => onEditSummary(selectedSummary)}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                        title="Edit summary"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteSummary(selectedSummary.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Delete summary"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Content */}
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                    {selectedSummary.content}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Summary</h3>
              <p className="text-gray-600">Choose a summary from the list to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
