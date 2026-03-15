// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { AdventureList } from './pages/AdventureList';
import { AdventureForm } from './components/AdventureForm';
import { SceneList } from './pages/SceneList';
import { SceneEditor } from './components/SceneEditor';
import { getDatabaseManager, initializeDatabase } from './database/connection';
import { AdventureRepository, SceneRepository } from './repositories';
import type { Adventure, AdventureFormData, Scene } from './types';

type View = 'list' | 'create' | 'edit' | 'play' | 'scenes' | 'scene-edit' | 'scene-create';

function App() {
  const [currentView, setCurrentView] = useState<View>('list');
  const [selectedAdventure, setSelectedAdventure] = useState<Adventure | undefined>();
  const [selectedScene, setSelectedScene] = useState<Scene | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [adventureListKey, setAdventureListKey] = useState(0); // Add key to force refresh

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
      
      case 'play':
        return (
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
                Play mode will be implemented in Phase 3.
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
              Phase 1 Foundation
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
          RPG Scene Navigator - Phase 1 Implementation
        </div>
      </footer>
    </div>
  );
}

export default App;
