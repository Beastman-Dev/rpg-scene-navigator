// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { AdventureList } from './pages/AdventureList';
import { AdventureForm } from './components/AdventureForm';
import { SceneList } from './pages/SceneList';
import { SceneEditor } from './components/SceneEditor';
import { SceneDisplay } from './components/SceneDisplay';
import { NPCList } from './pages/NPCList';
import { NPCEditor } from './components/NPCEditor';
import { SummaryViewer } from './components/SummaryViewer';
import { getDatabaseManager, initializeDatabase } from './database/connection';
import { AdventureRepository, SceneRepository, NPCRepository, SessionRepository, SceneRunStateRepository, SummaryTemplateRepository, GeneratedSummaryRepository } from './repositories';
import { SummaryGenerationService } from './services/summary-generation';
import type { Adventure, AdventureFormData, Scene, NPC, NPCFormData, Session, SceneRunState } from './types';
import { log } from './utils/logger';

type View = 'list' | 'create' | 'edit' | 'play' | 'scenes' | 'scene-edit' | 'scene-create' | 'npcs' | 'npc-edit' | 'npc-create' | 'summaries';

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
  const [allNPCs, setAllNPCs] = useState<NPC[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | undefined>();

// Add debugging for session state changes
const debugSetCurrentSession = (session: Session | undefined) => {
  console.log('setCurrentSession called with:', session ? {
    id: session.id,
    sessionNumber: session.sessionNumber,
    adventureId: session.adventureId
  } : 'undefined');
  setCurrentSession(session);
};
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

  const handleResetDatabase = async () => {
    if (window.confirm('Are you sure you want to reset the entire database? This will delete all adventures, scenes, NPCs, and sessions. This action cannot be undone.')) {
      try {
        console.log('🗄️ Resetting database...');
        
        // Clear all localStorage data
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('rpg-db-')) {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed: ${key}`);
          }
        });
        
        // Reinitialize the database
        await initializeDatabase();
        
        // Reset all state
        setCurrentView('list');
        setSelectedAdventure(undefined);
        setSelectedScene(undefined);
        setAllScenes([]);
        setAllNPCs([]);
        setCurrentSession(undefined);
        setSceneRunStates(new Map());
        setNavigationHistory([]);
        setSaveError(null);
        setSelectedNPC(undefined);
        setHistoryIndex(-1);
        setAdventureListKey(prev => prev + 1);
        
        console.log('✅ Database reset successfully');
        alert('Database has been reset successfully! The page will now refresh.');
        window.location.reload();
      } catch (error) {
        console.error('❌ Failed to reset database:', error);
        alert('Failed to reset database. Please try again.');
      }
    }
  };

  const handlePlayAdventure = async (adventure: Adventure) => {
    log.ui('App', 'handlePlayAdventure', { adventureId: adventure.id, title: adventure.title });
    
    setSelectedAdventure(adventure);
    
    // Load all scenes and NPCs for this adventure
    await loadAllScenes(adventure.id);
    await loadAllNPCs(adventure.id);
    
    // Reset navigation history
    setNavigationHistory([]);
    setHistoryIndex(-1);
    
    // Reset session state
    debugSetCurrentSession(undefined);
    setSceneRunStates(new Map());
    
    // Start a new session
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      try {
        log.session('starting', adventure.id, { adventureTitle: adventure.title });
        
        const connection = await dbManager.getConnectionAsync();
        const sessionRepo = new SessionRepository(connection);
        const sceneRunStateRepo = new SceneRunStateRepository(connection);
        
        // Create new session
        const sessionResult = await sessionRepo.createWithSessionNumber({
          adventureId: adventure.id,
          startingSceneId: adventure.startingSceneId || '',
          currentSceneId: adventure.startingSceneId || '',
          isAdventureComplete: false,
        });
        
        if (sessionResult.success && sessionResult.data) {
          console.log('Session created with ID:', sessionResult.data.id);
          console.log('Full session data:', JSON.stringify(sessionResult.data, null, 2));
          debugSetCurrentSession(sessionResult.data);
          console.log('Session started:', sessionResult.data);
          
          // Verify session exists in database (non-blocking)
          sessionRepo.findById(sessionResult.data.id).then(verifyResult => {
            if (!verifyResult.success || !verifyResult.data) {
              console.error('Session created but not found in database:', sessionResult.data.id);
              console.error('Verification error:', verifyResult.error);
              // Don't clear the session state, just log the error
            } else {
              console.log('Session verified in database:', sessionResult.data.id);
            }
          });
        } else {
          console.error('Failed to create session:', sessionResult.error);
        }
        
        if (!adventure.startingSceneId) {
          // No starting scene set - show message but still go to play view
          log.warn('ui', 'Adventure has no starting scene set', { 
            adventureId: adventure.id, 
            adventureTitle: adventure.title 
          });
          setSelectedScene(null);
          setCurrentView('play');
          return;
        }
        
        // Load the starting scene
        const sceneRepo = new SceneRepository(connection);
        log.ui('App', 'handlePlayAdventure', { 
          action: 'loading_starting_scene', 
          startingSceneId: adventure.startingSceneId,
          sessionId: sessionResult.data?.id 
        });
        
        const sceneResult = await sceneRepo.findById(adventure.startingSceneId);
        log.ui('App', 'handlePlayAdventure', { 
          action: 'scene_load_result', 
          success: sceneResult.success,
          hasData: !!sceneResult.data,
          sceneId: adventure.startingSceneId
        });
        
        if (sceneResult.success && sceneResult.data && sessionResult.data) {
          setSelectedScene(sceneResult.data);
          log.ui('App', 'handlePlayAdventure', { 
            action: 'scene_loaded', 
            sceneName: sceneResult.data.name,
            sceneId: sceneResult.data.id 
          });
          
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
          log.warn('ui', 'Starting scene not found, trying fallback', {
            adventureId: adventure.id,
            startingSceneId: adventure.startingSceneId,
            sceneSuccess: sceneResult.success,
            hasSceneData: !!sceneResult.data,
            hasSessionData: !!sessionResult.data,
            sceneError: sceneResult.error
          });
          
          // Try to load the first scene as a fallback
          const allScenesResult = await sceneRepo.findByAdventureId(adventure.id);
          if (allScenesResult.success && allScenesResult.data && allScenesResult.data.length > 0) {
            const firstScene = allScenesResult.data[0];
            log.ui('App', 'handlePlayAdventure', { 
              action: 'fallback_scene_loaded', 
              sceneName: firstScene.name,
              sceneId: firstScene.id,
              totalScenes: allScenesResult.data.length
            });
            
            setSelectedScene(firstScene);
            setNavigationHistory([firstScene]);
            setHistoryIndex(0);
            
            if (sessionResult.data) {
              await sceneRunStateRepo.enterScene(sessionResult.data.id, firstScene.id);
            }
          } else {
            log.error('ui', 'No scenes found for adventure', new Error('Adventure has no scenes'), {
              adventureId: adventure.id,
              adventureTitle: adventure.title
            });
            setSelectedScene(null);
          }
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
          
          // Verify session exists in database (non-blocking)
          sessionRepo.findById(currentSession.id).then(verifyResult => {
            if (!verifyResult.success || !verifyResult.data) {
              console.error('Session not found in database, cannot update scene navigation:', currentSession.id);
              console.error('Verification error:', verifyResult.error);
              // Don't interrupt navigation, just log the error
            } else {
              console.log('Session verified for scene navigation:', currentSession.id);
            }
          });
          
          // Exit current scene
          await sceneRunStateRepo.exitScene(currentSession.id, selectedScene.id, exitOptionId);
          
          // Enter new scene
          console.log('Entering scene with session ID:', currentSession.id);
          await sceneRunStateRepo.enterScene(currentSession.id, result.data.id);
          
          // Update session current scene
          console.log('Updating session current scene with session ID:', currentSession.id);
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

  const generateSessionSummary = async (sessionId: string, isAdventureComplete: boolean) => {
    try {
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) return;

      const connection = await dbManager.getConnectionAsync();
      
      // Initialize summary generation service
      const summaryService = new SummaryGenerationService(
        new SummaryTemplateRepository(connection),
        new GeneratedSummaryRepository(connection),
        new AdventureRepository(connection),
        new SessionRepository(connection),
        new SceneRepository(connection),
        new NPCRepository(connection),
        new SceneRunStateRepository(connection)
      );

      // Get session to find adventure ID
      const sessionRepo = new SessionRepository(connection);
      const sessionResult = await sessionRepo.findById(sessionId);
      
      if (!sessionResult.success || !sessionResult.data) {
        console.error('Failed to find session for summary generation');
        return;
      }

      const session = sessionResult.data;

      if (isAdventureComplete) {
        // Generate adventure completion summary
        const result = await summaryService.generateAdventureCompletionSummary(session.adventureId);
        if (result.success) {
          log.ui('generateSessionSummary', 'App', { 
            action: 'adventure_completion_summary_generated',
            adventureId: session.adventureId,
            summaryId: result.data?.id
          });
          console.log('Adventure completion summary generated successfully');
        } else {
          console.error('Failed to generate adventure completion summary:', result.error);
        }
      } else {
        // Generate session summary
        const result = await summaryService.generateSessionSummary(session.adventureId, sessionId);
        if (result.success) {
          log.ui('generateSessionSummary', 'App', { 
            action: 'session_summary_generated',
            adventureId: session.adventureId,
            sessionId: sessionId,
            summaryId: result.data?.id
          });
          console.log('Session summary generated successfully');
        } else {
          console.error('Failed to generate session summary:', result.error);
        }
      }
    } catch (error) {
      log.error('ui', 'Summary generation failed', error instanceof Error ? error : new Error(String(error)));
      console.error('Error generating summary:', error);
    }
  };

  const handleEndSession = async (isAdventureComplete: boolean = false) => {
    if (!currentSession) {
      console.error('No current session to end');
      return;
    }
    
    console.log('Ending session with ID:', currentSession.id);
    console.log('Current session data:', currentSession);
    
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      try {
        const connection = await dbManager.getConnectionAsync();
        const sessionRepo = new SessionRepository(connection);
        const sceneRunStateRepo = new SceneRunStateRepository(connection);
        
        // Verify session exists in database (non-blocking)
        sessionRepo.findById(currentSession.id).then(verifyResult => {
          if (!verifyResult.success || !verifyResult.data) {
            console.error('Session not found in database, cannot end session:', currentSession.id);
            console.error('Verification error:', verifyResult.error);
            // Don't interrupt the end session process, just log the error
          } else {
            console.log('Session verified for session end:', currentSession.id);
          }
        });
        
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
          
          // Generate summary if adventure is complete or session has meaningful content
          if (isAdventureComplete || sceneRunStates.size > 0) {
            await generateSessionSummary(currentSession.id, isAdventureComplete);
          }
          
          debugSetCurrentSession(undefined);
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
    
    // Load all scenes and NPCs for this adventure
    await loadAllScenes(adventure.id);
    await loadAllNPCs(adventure.id);
    
    // Find the latest incomplete session
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      try {
        const connection = await dbManager.getConnectionAsync();
        const sessionRepo = new SessionRepository(connection);
        const sceneRunStateRepo = new SceneRunStateRepository(connection);
        const sceneRepo = new SceneRepository(connection);
        
        // Get latest session for this adventure
        const sessionResult = await sessionRepo.findLatestByAdventureId(adventure.id);
        
        if (sessionResult.success && sessionResult.data && !sessionResult.data.endedAt) {
          const session = sessionResult.data;
          debugSetCurrentSession(session);
          
          // Load scene run states for this session
          console.log('🔍 Loading scene run states for session:', session.id);
          let runStatesResult;
          
          // Check if this is a composite session ID (old session)
          if (session.id && session.id.includes('-session-')) {
            console.log('🔄 Using fallback method for old session');
            runStatesResult = await sceneRunStateRepo.findByAdventureAndSessionNumber(session.adventureId, session.sessionNumber);
          } else {
            runStatesResult = await sceneRunStateRepo.findBySessionId(session.id);
          }
          
          console.log('📊 Scene run states result:', {
            success: runStatesResult.success,
            hasData: !!runStatesResult.data,
            dataCount: runStatesResult.data?.length || 0,
            sessionId: session.id
          });
          
          if (runStatesResult.success && runStatesResult.data) {
            const runStateMap = new Map<string, SceneRunState>();
            runStatesResult.data.forEach(state => {
              runStateMap.set(state.sceneId, state);
            });
            setSceneRunStates(runStateMap);
            console.log('✅ Scene run states loaded:', runStateMap.size, 'states');
          } else {
            console.log('❌ No scene run states found for session:', session.id);
            setSceneRunStates(new Map());
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

  const handleViewSummaries = (adventure: Adventure) => {
    setSelectedAdventure(adventure);
    setCurrentView('summaries');
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

  const loadAllNPCs = async (adventureId: string) => {
    const dbManager = getDatabaseManager();
    if (dbManager.isReady()) {
      const npcRepo = new NPCRepository(dbManager.getConnection());
      const result = await npcRepo.findByAdventureId(adventureId);
      if (result.success && result.data) {
        setAllNPCs(result.data);
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
            onViewSummaries={handleViewSummaries}
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
            adventure={selectedAdventure}
            npcs={allNPCs}
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
            allSceneRunStates={sceneRunStates}
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
      
      case 'summaries':
        return (
          <SummaryViewer
            adventureId={selectedAdventure?.id || ''}
            adventureTitle={selectedAdventure?.title || ''}
            onBack={handleBackToList}
          />
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
            <div className="flex items-center gap-4">
              <button
                onClick={handleResetDatabase}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                title="Reset entire database (delete all data)"
              >
                🗄️ Reset DB
              </button>
              <div className="text-sm text-gray-600">
                Phase 2 Complete
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {/* Database Error Display */}
        {dbError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex justify-between items-center">
              <h3 className="text-red-800 font-medium">Database Error</h3>
              <button
                onClick={() => setDbError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
            <p className="text-red-700">{dbError}</p>
          </div>
        )}

        {/* Database Loading State */}
        {!dbInitialized && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Initializing Database</h2>
              <p className="text-gray-600">Setting up your RPG adventure database...</p>
            </div>
          </div>
        )}

        {/* Save Error Display */}
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
        
        {/* Only render views when database is ready */}
        {dbInitialized && renderCurrentView()}
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
