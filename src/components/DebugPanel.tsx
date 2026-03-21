/**
 * Debug Panel Component for viewing logs and system health
 * Only visible in development mode
 */

import { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Trash2, AlertTriangle, Info, Bug } from 'lucide-react';
import { getDebugPanelData, exportDebugInfo, LoggingManager } from '@/utils/logging-manager';
import type { LogEntry } from '@/utils/logger';

interface DebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export function DebugPanel({ isVisible, onClose }: DebugPanelProps) {
  const [data, setData] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isVisible) {
      refreshData();
    }
  }, [isVisible]);

  const refreshData = () => {
    try {
      setData(getDebugPanelData());
    } catch (error) {
      console.error('Failed to load debug data:', error);
    }
  };

  const handleExport = () => {
    try {
      const debugInfo = exportDebugInfo();
      const blob = new Blob([debugInfo], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rpg-debug-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export debug info:', error);
    }
  };

  const handleClearLogs = () => {
    try {
      LoggingManager.reset();
      refreshData();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const getLevelIcon = (level: number) => {
    switch (level) {
      case 0: return <Bug className="h-3 w-3 text-gray-500" />;
      case 1: return <Info className="h-3 w-3 text-blue-500" />;
      case 2: return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case 3: return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 4: return <AlertTriangle className="h-3 w-3 text-red-700" />;
      default: return <Info className="h-3 w-3 text-gray-500" />;
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'text-gray-600';
      case 1: return 'text-blue-600';
      case 2: return 'text-yellow-600';
      case 3: return 'text-red-600';
      case 4: return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const filterLogs = (logs: LogEntry[]) => {
    return logs.filter(log => {
      if (selectedLevel !== 'all' && log.level !== parseInt(selectedLevel)) return false;
      if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
      return true;
    });
  };

  if (!isVisible || !data) return null;

  const filteredLogs = filterLogs(data.logs || []);
  const categories = ['all', ...Array.from(new Set((data.logs || []).map((log: LogEntry) => log.category as string)))];
  const levels = ['all', '0', '1', '2', '3', '4'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Panel
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="p-2 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 rounded"
              title="Export logs"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={handleClearLogs}
              className="p-2 hover:bg-gray-100 rounded"
              title="Clear logs"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Health Summary */}
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium mb-2">System Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Logs:</span> {data.logs?.length || 0}
            </div>
            <div>
              <span className="font-medium">Errors:</span> {data.health?.errorCount || 0}
            </div>
            <div>
              <span className="font-medium">Environment:</span> {data.health?.environment || 'unknown'}
            </div>
            <div>
              <span className="font-medium">Storage Used:</span> {data.health?.storageInfo?.used || 0}/{data.health?.storageInfo?.max || 0}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'All' : `Level ${level}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              {categories.map((category: unknown) => {
                const cat = category as string;
                return (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredLogs.length} of {data.logs?.length || 0} logs
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {filteredLogs.slice(-100).reverse().map((log: LogEntry, index: number) => (
              <div
                key={`${log.timestamp}-${index}`}
                className={`p-2 rounded border text-sm ${getLevelColor(log.level)} bg-gray-50`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 font-medium">
                      <span>{log.timestamp}</span>
                      <span className="text-xs bg-gray-200 px-1 rounded">{log.category}</span>
                      {log.sessionId && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                          {log.sessionId.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                    <div className="mt-1">{log.message}</div>
                    {log.context && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs underline">Context</summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-1 rounded overflow-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.error && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs underline text-red-600">Error Details</summary>
                        <pre className="mt-1 text-xs bg-red-50 p-1 rounded overflow-auto text-red-800">
                          {log.error.stack || log.error.message || String(log.error)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Global debug panel toggle
let debugPanelVisible = false;

export const toggleDebugPanel = () => {
  debugPanelVisible = !debugPanelVisible;
  
  // Create or remove the debug panel
  if (debugPanelVisible) {
    const panel = document.createElement('div');
    panel.id = 'debug-panel-container';
    document.body.appendChild(panel);
    
    // This would need to be integrated with React rendering
    console.log('Debug panel toggled:', debugPanelVisible);
  } else {
    const existingPanel = document.getElementById('debug-panel-container');
    if (existingPanel) {
      existingPanel.remove();
    }
  }
};

// Add keyboard shortcut for debug panel (Ctrl+Shift+D)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'D') {
      event.preventDefault();
      toggleDebugPanel();
    }
  });
}
