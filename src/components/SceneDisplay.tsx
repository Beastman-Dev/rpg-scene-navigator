// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Save, FileText, Users, MapPin, Eye, EyeOff, Shield, Sword, Heart } from 'lucide-react';
import type { Scene, SceneNpcRef, ExitOption } from '@/types';

interface SceneDisplayProps {
  scene: Scene;
  adventureId: string;
  onSceneChange?: (scene: Scene) => void;
  onExitToScene?: (sceneId: string) => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onJumpToScene?: (sceneId: string) => void;
  allScenes?: Scene[];
  canNavigateBack?: boolean;
  canNavigateForward?: boolean;
  navigationHistory?: Scene[];
  historyIndex?: number;
  className?: string;
}

export function SceneDisplay({ 
  scene, 
  adventureId, 
  onSceneChange, 
  onExitToScene,
  onNavigateBack,
  onNavigateForward,
  onJumpToScene,
  allScenes = [],
  canNavigateBack = false,
  canNavigateForward = false,
  navigationHistory = [],
  historyIndex = -1,
  className = '' 
}: SceneDisplayProps) {
  const [gmNotes, setGmNotes] = useState('');
  const [showGMNotes, setShowGMNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [showSessionNotes, setShowSessionNotes] = useState(false);
  const [visitedScenes, setVisitedScenes] = useState<Set<string>>(new Set());
  const [showSceneList, setShowSceneList] = useState(false);

  // Load saved notes from localStorage
  useEffect(() => {
    const savedGMNotes = localStorage.getItem(`scene-gm-notes-${scene.id}`);
    const savedSessionNotes = localStorage.getItem(`scene-session-notes-${scene.id}`);
    
    if (savedGMNotes) setGmNotes(savedGMNotes);
    if (savedSessionNotes) setSessionNotes(savedSessionNotes);
  }, [scene.id]);

  // Save notes to localStorage
  useEffect(() => {
    localStorage.setItem(`scene-gm-notes-${scene.id}`, gmNotes);
    localStorage.setItem(`scene-session-notes-${scene.id}`, sessionNotes);
  }, [gmNotes, sessionNotes, scene.id]);

  const handleExitClick = (exit: ExitOption) => {
    if (exit.destinationSceneId && onExitToScene) {
      // Mark current scene as visited
      setVisitedScenes(prev => new Set([...prev, scene.id]));
      onExitToScene(exit.destinationSceneId);
    }
  };

  const getNPCById = (npcId: string) => {
    // This would ideally load from database, but for now use the scene's NPC refs
    return scene.sceneNpcRefs?.find(ref => ref.npcId === npcId);
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      {/* Scene Header */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{scene.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(scene.type)}`}>
                {scene.type}
              </span>
              {scene.location && (
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {scene.location}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowGMNotes(!showGMNotes)}
              className={`px-3 py-2 rounded ${showGMNotes ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showGMNotes ? 'Hide' : 'Show'} GM Notes
            </button>
            
            <button
              onClick={() => setShowSessionNotes(!showSessionNotes)}
              className={`px-3 py-2 rounded ${showSessionNotes ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              {showSessionNotes ? 'Hide' : 'Show'} Session Notes
            </button>
            
            <button
              onClick={() => {
                const notes = {
                  gm: gmNotes,
                  session: sessionNotes,
                  timestamp: new Date().toISOString()
                };
                const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `scene-notes-${scene.name}-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Export Notes
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Back/Forward Navigation */}
              <button
                onClick={onNavigateBack}
                disabled={!canNavigateBack}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  canNavigateBack 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              
              <button
                onClick={onNavigateForward}
                disabled={!canNavigateForward}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  canNavigateForward 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Forward
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Scene List Toggle */}
              <button
                onClick={() => setShowSceneList(!showSceneList)}
                className={`px-3 py-2 rounded text-sm flex items-center gap-2 ${
                  showSceneList 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapPin className="h-4 w-4" />
                {showSceneList ? 'Hide' : 'Show'} Scene List
              </button>
            </div>

            {/* Navigation History Breadcrumb */}
            {navigationHistory.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Path:</span>
                <div className="flex items-center gap-1">
                  {navigationHistory.slice(0, historyIndex + 1).map((historyScene, index) => (
                    <React.Fragment key={historyScene.id}>
                      {index > 0 && <span className="text-gray-400">→</span>}
                      <button
                        onClick={() => onJumpToScene?.(historyScene.id)}
                        className="px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        {historyScene.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scene List Panel */}
        {showSceneList && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">All Scenes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {allScenes.map((sceneItem) => (
                  <button
                    key={sceneItem.id}
                    onClick={() => onJumpToScene?.(sceneItem.id)}
                    className={`text-left p-3 rounded border transition-colors ${
                      sceneItem.id === scene.id
                        ? 'bg-blue-100 border-blue-300 text-blue-900'
                        : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{sceneItem.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {sceneItem.type} {sceneItem.location && `• ${sceneItem.location}`}
                    </div>
                    {sceneItem.id === scene.id && (
                      <div className="text-xs text-blue-600 mt-1">Current Scene</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scene Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scene Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Read Aloud Text */}
            {scene.readAloud && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Read Aloud
                </h3>
                <div className="prose prose-sm text-gray-800 leading-relaxed">
                  {scene.readAloud.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* GM Description */}
            {scene.gmDescription && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                  <EyeOff className="h-5 w-5 mr-2" />
                  GM Description
                </h3>
                <div className="prose prose-sm text-gray-800 leading-relaxed">
                  {scene.gmDescription.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Atmosphere */}
            {scene.atmosphere && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-3">Atmosphere</h3>
                <div className="prose prose-sm text-gray-800 leading-relaxed">
                  {scene.atmosphere.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Objectives */}
            {scene.objectives && scene.objectives.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-900 mb-3">Objectives</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-800">
                  {scene.objectives.map((objective, index) => (
                    <li key={index} className="text-sm">{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Entry Conditions */}
            {scene.entryConditions && scene.entryConditions.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Entry Conditions</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-800">
                  {scene.entryConditions.map((condition, index) => (
                    <li key={index} className="text-sm">{condition}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Interactive Elements */}
            {scene.interactiveElements && scene.interactiveElements.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-900 mb-3">Interactive Elements</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-800">
                  {scene.interactiveElements.map((element, index) => (
                    <li key={index} className="text-sm">{element}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column - NPCs & Exits */}
          <div className="space-y-6">
            {/* NPCs in Scene */}
            {scene.sceneNpcRefs && scene.sceneNpcRefs.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  NPCs in Scene
                </h3>
                <div className="space-y-3">
                  {scene.sceneNpcRefs.map((npcRef, index) => {
                    const npc = getNPCById(npcRef.npcId);
                    return (
                      <div key={index} className="border border-gray-300 rounded p-3 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{npc?.name || 'Unknown NPC'}</span>
                            {npc?.role && (
                              <span className="text-sm text-gray-500">({npc.role})</span>
                            )}
                            {npcRef.isHostile && (
                              <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Hostile</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-700 space-y-2">
                          {npcRef.presenceRole && (
                            <div>
                              <strong>Presence:</strong> {npcRef.presenceRole}
                            </div>
                          )}
                          
                          {npc?.statBlock && (
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              {npc.statBlock.armorClass && (
                                <div><strong>AC:</strong> {npc.statBlock.armorClass}</div>
                              )}
                              {npc.statBlock.hitPoints && (
                                <div><strong>HP:</strong> {npc.statBlock.hitPoints}</div>
                              )}
                              {npc.statBlock.challengeRating && (
                                <div><strong>CR:</strong> {npc.statBlock.challengeRating}</div>
                              )}
                            </div>
                          )}
                          
                          {npcRef.notes && (
                            <div>
                              <strong>Notes:</strong> {npcRef.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exit Options */}
            {scene.exitOptions && scene.exitOptions.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Exit Options
                </h3>
                <div className="space-y-3">
                  {scene.exitOptions.map((exit, index) => (
                    <div key={exit.id} className="border border-gray-300 rounded p-3 bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-2">{exit.label}</div>
                          
                          {exit.conditionText && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Condition:</strong> {exit.conditionText}
                            </div>
                          )}
                          
                          {exit.resultText && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>Result:</strong> {exit.resultText}
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => handleExitClick(exit)}
                          disabled={!exit.destinationSceneId}
                          className={`px-3 py-2 rounded text-sm ${
                            exit.destinationSceneId 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {exit.destinationSceneId ? (
                            <>
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Go to Scene
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4 mr-1" />
                              No Destination
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Session State */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Session State
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <strong>Current Scene:</strong> {scene.name}
            </div>
            <div>
              <strong>Visited Scenes:</strong> {visitedScenes.size} scenes
            </div>
            <div>
              <strong>Navigation Position:</strong> {historyIndex + 1} / {navigationHistory.length}
            </div>
            <div>
              <strong>Total Scenes in Adventure:</strong> {allScenes.length}
            </div>
            <div>
              <strong>Session Duration:</strong> {/* Would track actual time */}
              In progress
            </div>
            <div>
              <strong>Scenes Remaining:</strong> {allScenes.length - visitedScenes.size}
            </div>
          </div>
        </div>
      </div>

      {/* GM Notes Panel */}
      {showGMNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">GM Notes - {scene.name}</h3>
              <button
                onClick={() => setShowGMNotes(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            
            <textarea
              value={gmNotes}
              onChange={(e) => setGmNotes(e.target.value)}
              placeholder="GM-only notes about this scene, player reactions, plot points, etc..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowGMNotes(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Notes Panel */}
      {showSessionNotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Session Notes - {scene.name}</h3>
              <button
                onClick={() => setShowSessionNotes(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
            
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Session notes: player choices, outcomes, observations, etc..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowSessionNotes(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for scene type colors
function getTypeColor(type: string): string {
  const colors: { [key: string]: string } = {
    'exploration': 'bg-blue-100 text-blue-800',
    'social': 'bg-green-100 text-green-800',
    'combat': 'bg-red-100 text-red-800',
    'travel': 'bg-yellow-100 text-yellow-800',
    'investigation': 'bg-purple-100 text-purple-800',
    'puzzle': 'bg-indigo-100 text-indigo-800',
    'hazard': 'bg-orange-100 text-orange-800',
    'transition': 'bg-gray-100 text-gray-800',
    'revelation': 'bg-pink-100 text-pink-800',
    'downtime': 'bg-teal-100 text-teal-800',
    'climax': 'bg-red-200 text-red-900',
    'other': 'bg-gray-100 text-gray-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}
