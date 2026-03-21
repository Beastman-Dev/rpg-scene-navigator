// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { AdventureList } from './pages/AdventureList';
import { AdventureForm } from './components/AdventureForm';
import { SceneList } from './pages/SceneList';
import { SceneEditor } from './components/SceneEditor';
import { SceneDisplay } from './components/SceneDisplay';
import { NPCList } from './pages/NPCList';
import { NPCEditor } from './components/NPCEditor';
import { getDatabaseManager, initializeDatabase } from './database/connection';
import { AdventureRepository, SceneRepository, NPCRepository, SessionRepository, SceneRunStateRepository } from './repositories';
import type { Adventure, AdventureFormData, Scene, NPC, NPCFormData, Session, SceneRunState } from './types';
import { log } from './utils/logger';

type View = 'list' | 'create' | 'edit' | 'play' | 'scenes' | 'scene-edit' | 'scene-create' | 'npcs' | 'npc-edit' | 'npc-create';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | undefined>();
  const [selectedScene, setSelectedScene] = useState<Scene | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [adventureListKey, setAdventureListKey] = useState(0); // Add key to force refresh
  const [selectedNPC, setSelectedNPC] = useState<NPC | undefined>();
  const [navigationHistory, setNavigationHistory] = useState<Scene[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [allScenes, setAllScenes] = useState<Scene[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | undefined>();
  const [sceneRunStates, setSceneRunStates] = useState<Map<string, SceneRunState>>(new Map());

  // Initialize database on app mount
  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase();
        setDbInitialized(true);
        console.log('Database initialized successfully in App');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize database';
        setDbError(errorMsg);
        console.error('Database initialization failed:', err);
      }
    };
    initDb();
  }, []);

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedAdventure(undefined);
    setSelectedScene(undefined);
    setSaveError(null);
  };

  const handleCreateAdventure = () => {
    setCurrentView('create');
    setSelectedAdventure(undefined);
    setSaveError(null);
  };

  const handleSelectAdventure = (adventure: Adventure) => {
    setSelectedAdventure(adventure);
  };

  const handlePlayAdventure = async (adventure: Adventure) => {
    log.ui('App', 'handlePlayAdventure', { adventureId: adventure.id, title: adventure.title });
    
    setSelectedAdventure(adventure);
    
    // Load all scenes for this adventure
    await loadAllScenes(adventure.id);
    
    // Reset navigation history
    setNavigationHistory([]);
    setHistoryIndex(-1);
    
    // Reset session state
    setCurrentSession(undefined);
    setSceneRunStates(new Map());
    
    // Start a new session
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      try {
        log.session('starting', adventure.id, { adventureTitle: adventure.title });
        
        const sessionRepo = new SessionRepository(dbManager.getConnection());
        const sceneRunStateRepo = new SceneRunStateRepository(dbManager.getConnection());
        
        // Create new session
        const sessionResult = await sessionRepo.createWithSessionNumber({
          adventureId: adventure.id,
          startingSceneId: adventure.startingSceneId || '',
          currentSceneId: adventure.startingSceneId || '',
          isAdventureComplete: false,
        });
        
        if (sessionResult.success && sessionResult.data) {
          setCurrentSession(sessionResult.data);
          console.log('Session started:', sessionResult.data);
        } else {
          console.error('Failed to create session:', sessionResult.error);
        }
        
        if (!adventure.startingSceneId) {
          // No starting scene set - show message but still go to play view
          setSelectedScene(null);
          setCurrentView('play');
          return;
        }
        
        // Load the starting scene
        const sceneRepo = new SceneRepository(dbManager.getConnection());
        const sceneResult = await sceneRepo.findById(adventure.startingSceneId);
        if (sceneResult.success && sceneResult.data && sessionResult.data) {
          setSelectedScene(sceneResult.data);
          // Initialize navigation history with starting scene
          setNavigationHistory([sceneResult.data]);
          setHistoryIndex(0);
          
          // Enter the scene in session tracking
          await sceneRunStateRepo.enterScene(sessionResult.data.id, sceneResult.data.id);
          
          // Load scene run states for this session
          const runStatesResult = await sceneRunStateRepo.findBySessionId(sessionResult.data.id);
          if (runStatesResult.success && runStatesResult.data) {
            const runStateMap = new Map<string, SceneRunState>();
            runStatesResult.data.forEach(state => {
              runStateMap.set(state.sceneId, state);
            });
            setSceneRunStates(runStateMap);
          }
        } else {
          console.error('Starting scene not found:', adventure.startingSceneId);
          setSelectedScene(null);
        }
      } catch (error) {
        console.error('Failed to start session:', error);
        setSelectedScene(null);
      }
    }
    setCurrentView('play');
  };

  const handleEditAdventure = (adventure: Adventure) => {
    setSelectedAdventure(adventure);
    setCurrentView('edit');
    setSaveError(null);
  };

  const handleDeleteScene = async (scene: Scene) => {
    if (window.confirm(`Are you sure you want to delete "${scene.name}"? This will also delete all exit options and NPC references.`)) {
      try {
        const dbManager = getDatabaseManager();
        if (!dbManager.isReady()) {
          throw new Error('Database not initialized');
        }

        const sceneRepo = new SceneRepository(dbManager.getConnection());
        const result = await sceneRepo.delete(scene.id);
        
        if (result.success) {
          console.log('Scene deleted successfully');
          // TODO: Reload scenes
        } else {
          throw new Error(result.error || 'Failed to delete scene');
        }
      } catch (err) {
        console.error('Failed to delete scene:', err);
      }
    }
  };

  const handleDeleteAdventure = async (adventure: Adventure) => {
    if (window.confirm(`Are you sure you want to delete "${adventure.title}"?`)) {
      try {
        const dbManager = getDatabaseManager();
        if (!dbManager.isReady()) {
          throw new Error('Database not initialized');
        }

        const adventureRepo = new AdventureRepository(dbManager.getConnection());
        const result = await adventureRepo.delete(adventure.id);
        
        if (result.success) {
          console.log('Adventure deleted successfully');
          setCurrentView('list');
          setSelectedAdventure(undefined);
        } else {
          throw new Error(result.error || 'Failed to delete adventure');
        }
      } catch (err) {
        console.error('Failed to delete adventure:', err);
        setSaveError(err instanceof Error ? err.message : 'Failed to delete adventure');
      }
    }
  };

  const handleSaveAdventure = async (data: AdventureFormData) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      console.log('🎯 App - handleSaveAdventure called with:', data);

      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const adventureRepo = new AdventureRepository(dbManager.getConnection());
      
      if (selectedAdventure) {
        // Update existing adventure
        console.log('📝 App - Updating existing adventure:', selectedAdventure.id);
        const result = await adventureRepo.update(selectedAdventure.id, data);
        if (result.success) {
          console.log('✅ App - Adventure updated successfully');
          setCurrentView('list');
          setSelectedAdventure(undefined);
          setAdventureListKey(prev => prev + 1); // Force refresh
        } else {
          throw new Error(result.error || 'Failed to update adventure');
        }
      } else {
        // Create new adventure
        console.log('🆕 App - Creating new adventure');
        const result = await adventureRepo.create(data);
        if (result.success) {
          console.log('✅ App - Adventure created successfully');
          setCurrentView('list');
          setAdventureListKey(prev => prev + 1); // Force refresh
        } else {
          throw new Error(result.error || 'Failed to create adventure');
        }
      }
    } catch (error) {
      console.error('❌ App - Save adventure error:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save adventure');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateScene = () => {
    setCurrentView('scene-create');
  };

  const handleSelectScene = (scene: Scene) => {
    // TODO: Navigate to scene play mode
    console.log('Select scene:', scene);
  };

  const handleEditScene = (scene: Scene) => {
    setSelectedScene(scene);
    setCurrentView('scene-edit');
  };

  const handleSaveScene = async (data: any) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const sceneRepo = new SceneRepository(dbManager.getConnection());
      
      if (selectedScene) {
        // Update existing scene
        console.log('📝 App - Updating existing scene:', selectedScene.id);
        const result = await sceneRepo.update(selectedScene.id, data);
        if (result.success) {
          console.log('✅ App - Scene updated successfully');
          setCurrentView('scenes');
          setSelectedScene(undefined);
        } else {
          throw new Error(result.error || 'Failed to update scene');
        }
      } else {
        // Create new scene
        console.log('🆕 App - Creating new scene');
        const result = await sceneRepo.create(data);
        if (result.success) {
          console.log('✅ App - Scene created successfully');
          setCurrentView('scenes');
        } else {
          throw new Error(result.error || 'Failed to create scene');
        }
      }
    } catch (error) {
      console.error('Save scene error:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save scene');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNPC = async (data: NPCFormData) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const npcRepo = new NPCRepository(dbManager.getConnection());
      
      if (selectedNPC) {
        // Update existing NPC
        console.log('📝 App - Updating existing NPC:', selectedNPC.id);
        const result = await npcRepo.update(selectedNPC.id, data);
        if (result.success) {
          console.log('✅ App - NPC updated successfully');
          setCurrentView('npcs');
          setSelectedNPC(undefined);
        } else {
          throw new Error(result.error || 'Failed to update NPC');
        }
      } else {
        // Create new NPC
        console.log('🆕 App - Creating new NPC');
        const result = await npcRepo.create(data);
        if (result.success) {
          console.log('✅ App - NPC created successfully');
          setCurrentView('npcs');
        } else {
          throw new Error(result.error || 'Failed to create NPC');
        }
      }
    } catch (error) {
      console.error('Save NPC error:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save NPC');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectNPC = (npc: NPC) => {
    setSelectedNPC(npc);
    // Could add NPC detail view here in the future
  };

  const handleEditNPC = (npc: NPC) => {
    setSelectedNPC(npc);
    setCurrentView('npc-edit');
  };

  const handleDeleteNPC = async (npc: NPC) => {
    try {
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const npcRepo = new NPCRepository(dbManager.getConnection());
      const result = await npcRepo.delete(npc.id);
      
      if (result.success) {
        console.log('NPC deleted successfully');
        // Force refresh of adventure list to update NPC count
        setAdventureListKey(prev => prev + 1);
      } else {
        throw new Error(result.error || 'Failed to delete NPC');
      }
    } catch (err) {
      console.error('Failed to delete NPC:', err);
      setSaveError('Failed to delete NPC');
    }
  };

  const handleSceneChange = (scene: Scene) => {
    setSelectedScene(scene);
  };

  const handleExitToScene = async (sceneId: string, exitOptionId?: string) => {
    // Load the scene and update selected scene
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      const sceneRepo = new SceneRepository(dbManager.getConnection());
      const result = await sceneRepo.findById(sceneId);
      if (result.success && result.data) {
        // Track session state if we have an active session
        if (currentSession && selectedScene) {
          const sessionRepo = new SessionRepository(dbManager.getConnection());
          const sceneRunStateRepo = new SceneRunStateRepository(dbManager.getConnection());
          
          // Exit current scene
          await sceneRunStateRepo.exitScene(currentSession.id, selectedScene.id, exitOptionId);
          
          // Enter new scene
          await sceneRunStateRepo.enterScene(currentSession.id, result.data.id);
          
          // Update session current scene
          await sessionRepo.updateCurrentScene(currentSession.id, result.data.id);
          
          // Reload scene run states
          const runStatesResult = await sceneRunStateRepo.findBySessionId(currentSession.id);
          if (runStatesResult.success && runStatesResult.data) {
            const runStateMap = new Map<string, SceneRunState>();
            runStatesResult.data.forEach(state => {
              runStateMap.set(state.sceneId, state);
            });
            setSceneRunStates(runStateMap);
          }
        }
        
        // Add to navigation history
        const newHistory = navigationHistory.slice(0, historyIndex + 1);
        newHistory.push(result.data);
        setNavigationHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        setSelectedScene(result.data);
      }
    }
  };

  const handleNavigateBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSelectedScene(navigationHistory[newIndex]);
    }
  };

  const handleNavigateForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSelectedScene(navigationHistory[newIndex]);
    }
  };

  const handleJumpToScene = async (sceneId: string) => {
    await handleExitToScene(sceneId);
  };

  const handleEndSession = async (isAdventureComplete: boolean = false) => {
    if (!currentSession) return;
    
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      try {
        const sessionRepo = new SessionRepository(dbManager.getConnection());
        const sceneRunStateRepo = new SceneRunStateRepository(dbManager.getConnection());
        
        // Exit current scene if we have one
        if (selectedScene) {
          await sceneRunStateRepo.exitScene(currentSession.id, selectedScene.id);
        }
        
        // End the session
        const result = await sessionRepo.endSession(
          currentSession.id,
          selectedScene?.id,
          isAdventureComplete
        );
        
        if (result.success) {
          console.log('Session ended successfully');
          setCurrentSession(undefined);
          setSceneRunStates(new Map());
        } else {
          console.error('Failed to end session:', result.error);
        }
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };

  const handleResumeSession = async (adventure: Adventure) => {
    setSelectedAdventure(adventure);
    
    // Load all scenes for this adventure
    await loadAllScenes(adventure.id);
    
    // Find the latest incomplete session
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      try {
        const sessionRepo = new SessionRepository(dbManager.getConnection());
        const sceneRunStateRepo = new SceneRunStateRepository(dbManager.getConnection());
        const sceneRepo = new SceneRepository(dbManager.getConnection());
        
        // Get latest session for this adventure
        const sessionResult = await sessionRepo.findLatestByAdventureId(adventure.id);
        
        if (sessionResult.success && sessionResult.data && !sessionResult.data.endedAt) {
          const session = sessionResult.data;
          setCurrentSession(session);
          
          // Load scene run states for this session
          const runStatesResult = await sceneRunStateRepo.findBySessionId(session.id);
          if (runStatesResult.success && runStatesResult.data) {
            const runStateMap = new Map<string, SceneRunState>();
            runStatesResult.data.forEach(state => {
              runStateMap.set(state.sceneId, state);
            });
            setSceneRunStates(runStateMap);
          }
          
          // Load the current scene
          if (session.currentSceneId) {
            const sceneResult = await sceneRepo.findById(session.currentSceneId);
            if (sceneResult.success && sceneResult.data) {
              setSelectedScene(sceneResult.data);
              
              // Build navigation history from scene run states
              const history: Scene[] = [];
              for (const state of runStatesResult.data || []) {
                const sceneResult = await sceneRepo.findById(state.sceneId);
                if (sceneResult.success && sceneResult.data) {
                  history.push(sceneResult.data);
                }
              }
              setNavigationHistory(history);
              setHistoryIndex(history.length - 1);
            }
          }
          
          console.log('Session resumed:', session);
        } else {
          // No incomplete session found, start a new one
          await handlePlayAdventure(adventure);
          return;
        }
      } catch (error) {
        console.error('Failed to resume session:', error);
        // Fall back to starting new session
        await handlePlayAdventure(adventure);
        return;
      }
    }
    setCurrentView('play');
  };

  const loadAllScenes = async (adventureId: string) => {
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      const sceneRepo = new SceneRepository(dbManager.getConnection());
      const result = await sceneRepo.findByAdventureId(adventureId);
      if (result.success && result.data) {
        setAllScenes(result.data);
      }
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'list':
        return (
          <AdventureList
            key={adventureListKey} // Add key to force re-render
            onCreateAdventure={handleCreateAdventure}
            onSelectAdventure={handleSelectAdventure}
            onEditAdventure={handleEditAdventure}
            onDeleteAdventure={handleDeleteAdventure}
            setCurrentView={setCurrentView}
            setSelectedAdventure={setSelectedAdventure}
            onSetStartingScene={handlePlayAdventure}
            onPlayAdventure={handlePlayAdventure}
            onResumeSession={handleResumeSession}
          />
        );
      
      case 'create':
        return (
          <AdventureForm
            onSave={handleSaveAdventure}
            onCancel={handleBackToList}
            isLoading={isSaving}
          />
        );
      
      case 'edit':
        return (
          <AdventureForm
            adventure={selectedAdventure}
            onSave={handleSaveAdventure}
            onCancel={handleBackToList}
            isLoading={isSaving}
          />
        );
      
      case 'scenes':
        return (
          <SceneList
            adventureId={selectedAdventure?.id || ''}
            onSelectScene={handleSelectScene}
            onEditScene={handleEditScene}
            onDeleteScene={handleDeleteScene}
            onCreateScene={handleCreateScene}
            onBack={handleBackToList}
          />
        );
      
      case 'scene-edit':
        return (
          <SceneEditor
            scene={selectedScene}
            adventureId={selectedAdventure?.id || ''}
            onSave={handleSaveScene}
            onCancel={handleBackToList}
            isLoading={isSaving}
          />
        );
      
      case 'scene-create':
        return (
          <SceneEditor
            adventureId={selectedAdventure?.id || ''}
            onSave={handleSaveScene}
            onCancel={handleBackToList}
          />
        );

      case 'npcs':
        return (
          <NPCList
            adventureId={selectedAdventure?.id || ''}
            onSelectNPC={handleSelectNPC}
            onEditNPC={handleEditNPC}
            onDeleteNPC={handleDeleteNPC}
            onCreateNPC={() => setCurrentView('npc-create')}
            onBack={handleBackToList}
          />
        );
      
      case 'npc-edit':
        return (
          <NPCEditor
            npc={selectedNPC}
            adventureId={selectedAdventure?.id || ''}
            onSave={handleSaveNPC}
            onCancel={handleBackToList}
            isLoading={isSaving}
          />
        );
      
      case 'npc-create':
        return (
          <NPCEditor
            adventureId={selectedAdventure?.id || ''}
            onSave={handleSaveNPC}
            onCancel={handleBackToList}
            isLoading={isSaving}
          />
        );
      
      case 'play':
        return selectedScene ? (
          <SceneDisplay
            scene={selectedScene}
            adventureId={selectedAdventure?.id || ''}
            onSceneChange={handleSceneChange}
            onExitToScene={handleExitToScene}
            onNavigateBack={handleNavigateBack}
            onNavigateForward={handleNavigateForward}
            onJumpToScene={handleJumpToScene}
            allScenes={allScenes}
            canNavigateBack={historyIndex > 0}
            canNavigateForward={historyIndex < navigationHistory.length - 1}
            navigationHistory={navigationHistory}
            historyIndex={historyIndex}
            currentSession={currentSession}
            sceneRunState={sceneRunStates.get(selectedScene.id)}
            onEndSession={handleEndSession}
          />
        ) : (
          <div className="max-w-6xl mx-auto p-6">
            <div className="mb-6">
              <button
                onClick={handleBackToList}
                className="text-blue-600 hover:text-blue-800"
              >
                ← Back to Adventures
              </button>
            </div>
            <h1 className="text-3xl font-bold mb-6">Play Mode</h1>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600">
                Select an adventure and click "Play" to begin.
              </p>
              {selectedAdventure && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold">{selectedAdventure.title}</h3>
                  <p className="text-sm text-gray-600">ID: {selectedAdventure.id}</p>
                  <p className="text-sm text-gray-600">Starting Scene: {selectedAdventure.startingSceneId}</p>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-blue-600">RPG Scene Navigator</h1>
            <div className="text-sm text-gray-600">
              Phase 2 Complete
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {/* Database Error Display */}
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex justify-between items-center">
              <h3 className="text-red-800 font-medium">Error</h3>
              <button
                onClick={() => setSaveError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
            <p className="text-red-700">{saveError}</p>
          </div>
        )}
        
        {renderCurrentView()}
      </main>
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-600">
          RPG Scene Navigator - Phase 2 Implementation
        </div>
      </footer>
    </div>
  );
}

export default App;
