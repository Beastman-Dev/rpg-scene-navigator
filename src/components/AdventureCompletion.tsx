// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trophy, Star, Calendar, Users, MapPin, FileText, Download, ArrowLeft } from 'lucide-react';
import type { Adventure, Session, Scene, NPC, SceneRunState, GeneratedSummary } from '@/types';
import { log } from '@/utils/logger';
import { SummaryGenerationService } from '@/services/summary-generation';
import { ExportService, type ExportOptions } from '@/services/export';

interface AdventureCompletionProps {
  adventure: Adventure;
  session: Session;
  scenes: Scene[];
  npcs: NPC[];
  sceneRunStates: SceneRunState[];
  onComplete: (completionData: AdventureCompletionData) => void;
  onCancel: () => void;
  className?: string;
}

interface AdventureCompletionData {
  isAdventureComplete: boolean;
  completionNotes?: string;
  achievements: string[];
  nextSteps: string[];
  finalRating?: number;
  generateSummary: boolean;
  exportOptions?: ExportOptions;
}

export function AdventureCompletion({ 
  adventure, 
  session, 
  scenes, 
  npcs, 
  sceneRunStates, 
  onComplete, 
  onCancel,
  className = '' 
}: AdventureCompletionProps) {
  const [completionData, setCompletionData] = useState<AdventureCompletionData>({
    isAdventureComplete: false,
    achievements: [],
    nextSteps: [],
    finalRating: 5,
    generateSummary: true,
    exportOptions: {
      format: 'markdown',
      includeMetadata: true,
      includeTimestamp: true
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper functions (defined before use)
  const calculateSessionDuration = (session: Session): string => {
    if (!session.createdAt) return 'Unknown';
    
    const start = new Date(session.createdAt);
    const end = session.endedAt ? new Date(session.endedAt) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEncounteredNPCs = (runStates: SceneRunState[], allScenes: Scene[], allNPCs: NPC[]): NPC[] => {
    const visitedSceneIds = new Set(runStates.map(state => state.sceneId));
    const visitedScenes = allScenes.filter(scene => visitedSceneIds.has(scene.id));
    
    const encounteredNpcIds = new Set<string>();
    visitedScenes.forEach(scene => {
      if (scene.sceneNpcRefs) {
        scene.sceneNpcRefs.forEach((ref: any) => {
          encounteredNpcIds.add(ref.npcId);
        });
      }
    });
    
    return allNPCs.filter(npc => encounteredNpcIds.has(npc.id));
  };

  const generateSuggestedAchievements = (): string[] => {
    const achievements: string[] = [];
    
    if (sessionStats.scenesVisited >= 5) {
      achievements.push('Explorer - Visited 5+ scenes');
    }
    
    if (sessionStats.npcsEncountered >= 3) {
      achievements.push('Social Butterfly - Met 3+ NPCs');
    }
    
    if (sessionStats.decisionsMade >= 5) {
      achievements.push('Decisive - Made 5+ decisions');
    }
    
    if (sceneRunStates.some(state => state.achievements && state.achievements.length > 0)) {
      achievements.push('Achiever - Earned in-game achievements');
    }
    
    return achievements;
  };

  // Calculate session statistics
  const sessionStats = {
    duration: calculateSessionDuration(session),
    scenesVisited: sceneRunStates.length,
    uniqueScenes: new Set(sceneRunStates.map(state => state.sceneId)).size,
    decisionsMade: sceneRunStates.filter(state => state.exitChoice).length,
    npcsEncountered: getEncounteredNPCs(sceneRunStates, scenes, npcs).length
  };

  useEffect(() => {
    // Pre-fill some achievements based on session data
    const suggestedAchievements = generateSuggestedAchievements();
    setCompletionData(prev => ({
      ...prev,
      achievements: suggestedAchievements
    }));
  }, [sceneRunStates, session]);

  const handleAddAchievement = () => {
    const achievement = prompt('Enter a new achievement:');
    if (achievement && achievement.trim()) {
      setCompletionData(prev => ({
        ...prev,
        achievements: [...prev.achievements, achievement.trim()]
      }));
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const handleAddNextStep = () => {
    const nextStep = prompt('Enter a next step:');
    if (nextStep && nextStep.trim()) {
      setCompletionData(prev => ({
        ...prev,
        nextSteps: [...prev.nextSteps, nextStep.trim()]
      }));
    }
  };

  const handleRemoveNextStep = (index: number) => {
    setCompletionData(prev => ({
      ...prev,
      nextSteps: prev.nextSteps.filter((_, i) => i !== index)
    }));
  };

  const handleCompleteAdventure = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      log.ui('handleCompleteAdventure', 'AdventureCompletion', { 
        adventureId: adventure.id,
        sessionId: session.id,
        isComplete: completionData.isAdventureComplete
      });

      // Generate completion summary if requested
      let summary: GeneratedSummary | null = null;
      if (completionData.generateSummary) {
        const dbManager = (await import('@/database/connection')).getDatabaseManager();
        if (dbManager.isReady()) {
          const connection = await dbManager.getConnectionAsync();
          
          const summaryService = new SummaryGenerationService(
            new (await import('@/repositories')).SummaryTemplateRepository(connection),
            new (await import('@/repositories')).GeneratedSummaryRepository(connection),
            new (await import('@/repositories')).AdventureRepository(connection),
            new (await import('@/repositories')).SessionRepository(connection),
            new (await import('@/repositories')).SceneRepository(connection),
            new (await import('@/repositories')).NPCRepository(connection),
            new (await import('@/repositories')).SceneRunStateRepository(connection)
          );

          const result = await summaryService.generateAdventureCompletionSummary(
            adventure.id,
            {
              includeGmNotes: true,
              customData: {
                achievements: completionData.achievements,
                nextSteps: completionData.nextSteps,
                finalRating: completionData.finalRating?.toString(),
                gmNotes: completionData.completionNotes
              }
            }
          );

          if (result.success && result.data) {
            summary = result.data;
            setGeneratedSummary(summary);

            // Export if options are provided
            if (completionData.exportOptions) {
              const exportResult = await ExportService.exportSummary(summary, completionData.exportOptions);
              if (exportResult.success) {
                ExportService.downloadExport(exportResult);
              }
            }
          }
        }
      }

      onComplete(completionData);
      
      log.ui('handleCompleteAdventure', 'AdventureCompletion', { 
        success: true,
        summaryGenerated: !!summary
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete adventure';
      setError(errorMessage);
      log.error('ui', 'Adventure completion failed', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 cursor-pointer transition-colors ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
        onClick={() => setCompletionData(prev => ({ ...prev, finalRating: i + 1 }))}
      />
    ));
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onCancel}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Adventure
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Adventure Completion</h1>
        <p className="text-gray-600">Complete your session and track your achievements</p>
      </div>

      {/* Session Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Session Overview
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{sessionStats.duration}</div>
            <div className="text-sm text-gray-600">Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{sessionStats.scenesVisited}</div>
            <div className="text-sm text-gray-600">Scenes Visited</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{sessionStats.decisionsMade}</div>
            <div className="text-sm text-gray-600">Decisions Made</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{sessionStats.npcsEncountered}</div>
            <div className="text-sm text-gray-600">NPCs Met</div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Adventure Status:</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={completionData.isAdventureComplete}
                onChange={(e) => setCompletionData(prev => ({ ...prev, isAdventureComplete: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className={completionData.isAdventureComplete ? 'text-green-600 font-medium' : 'text-gray-600'}>
                {completionData.isAdventureComplete ? 'Adventure Complete!' : 'Adventure In Progress'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Session Rating
        </h2>
        
        <div className="flex items-center gap-2 mb-2">
          {renderStars(completionData.finalRating || 5)}
          <span className="text-sm text-gray-600">({completionData.finalRating || 5}/5 stars)</span>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5" />
          Achievements
        </h2>
        
        <div className="space-y-2 mb-4">
          {completionData.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <span className="text-yellow-800">🏆 {achievement}</span>
              <button
                onClick={() => handleRemoveAchievement(index)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {completionData.achievements.length === 0 && (
            <p className="text-gray-500 italic">No achievements yet. Add some below!</p>
          )}
        </div>
        
        <button
          onClick={handleAddAchievement}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
        >
          Add Achievement
        </button>
      </div>

      {/* Next Steps */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
        
        <div className="space-y-2 mb-4">
          {completionData.nextSteps.map((step, index) => (
            <div key={index} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-blue-800">→ {step}</span>
              <button
                onClick={() => handleRemoveNextStep(index)}
                className="text-blue-600 hover:text-blue-800"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
          
          {completionData.nextSteps.length === 0 && (
            <p className="text-gray-500 italic">What are your next steps for this adventure?</p>
          )}
        </div>
        
        <button
          onClick={handleAddNextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Next Step
        </button>
      </div>

      {/* Completion Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">GM Notes</h2>
        <textarea
          value={completionData.completionNotes || ''}
          onChange={(e) => setCompletionData(prev => ({ ...prev, completionNotes: e.target.value }))}
          placeholder="Add any final thoughts, notes, or reflections about this session..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Export Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Options
        </h2>
        
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={completionData.generateSummary}
              onChange={(e) => setCompletionData(prev => ({ ...prev, generateSummary: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-gray-700">Generate completion summary</span>
          </label>
          
          {completionData.generateSummary && (
            <div className="ml-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                <select
                  value={completionData.exportOptions?.format || 'markdown'}
                  onChange={(e) => setCompletionData(prev => ({
                    ...prev,
                    exportOptions: { ...prev.exportOptions, format: e.target.value as ExportOptions['format'] }
                  }))}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="txt">Plain Text</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={completionData.exportOptions?.includeMetadata}
                    onChange={(e) => setCompletionData(prev => ({
                      ...prev,
                      exportOptions: { ...prev.exportOptions, includeMetadata: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include metadata</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={completionData.exportOptions?.includeTimestamp}
                    onChange={(e) => setCompletionData(prev => ({
                      ...prev,
                      exportOptions: { ...prev.exportOptions, includeTimestamp: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Include export timestamp</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700"
          disabled={isProcessing}
        >
          Cancel
        </button>
        
        <button
          onClick={handleCompleteAdventure}
          disabled={isProcessing}
          className={`px-6 py-3 rounded font-medium flex items-center gap-2 ${
            completionData.isAdventureComplete
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              {completionData.isAdventureComplete ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Complete Adventure
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  End Session
                </>
              )}
            </>
          )}
        </button>
      </div>

      {/* Generated Summary Preview */}
      {generatedSummary && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-green-800 font-medium mb-2">✅ Completion Summary Generated</h3>
          <p className="text-green-700 mb-4">
            Your adventure completion summary has been generated and exported successfully!
          </p>
          <div className="bg-white border border-gray-200 rounded p-4">
            <h4 className="font-medium mb-2">{generatedSummary.title}</h4>
            <pre className="text-sm text-gray-600 whitespace-pre-wrap">
              {generatedSummary.content.substring(0, 200)}...
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
