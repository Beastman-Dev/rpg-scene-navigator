// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, ArrowUp, ArrowDown, Eye, EyeOff, MapPin, Users } from 'lucide-react';
import type { Scene, SceneType } from '@/types';
import { SceneRepository } from '@/repositories';
import { getDatabaseManager } from '@/database/connection';

interface SceneListProps {
  adventureId: string;
  onSelectScene: (scene: Scene) => void;
  onEditScene: (scene: Scene) => void;
  onDeleteScene: (scene: Scene) => void;
  onCreateScene: () => void;
}

export function SceneList({ 
  adventureId, 
  onSelectScene, 
  onEditScene, 
  onDeleteScene,
  onCreateScene 
}: SceneListProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SceneType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'order'>('order');

  useEffect(() => {
    loadScenes();
  }, [adventureId, filter, searchTerm, sortBy]);

  const loadScenes = async () => {
    try {
      setLoading(true);
      
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const sceneRepo = new SceneRepository(dbManager.getConnection());
      let result;

      if (filter !== 'all') {
        result = await sceneRepo.findByType(filter);
      } else if (searchTerm) {
        // TODO: Implement search in scene repository
        result = await sceneRepo.findByAdventure(adventureId);
      } else {
        result = await sceneRepo.findByAdventure(adventureId);
      }

      if (result.success) {
        let sortedScenes = result.data || [];
        
        // Apply sorting
        sortedScenes.sort((a, b) => {
          switch (sortBy) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'type':
              return a.type.localeCompare(b.type);
            case 'order':
              return a.sortOrder - b.sortOrder;
            default:
              return 0;
          }
        });

        setScenes(sortedScenes);
        setError(null);
      } else {
        setError(result.error || 'Failed to load scenes');
      }
    } catch (err) {
      setError('Failed to load scenes');
      console.error('Load scenes error:', err);
    } finally {
      setLoading(false);
    }
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
          await loadScenes(); // Reload scenes
        } else {
          throw new Error(result.error || 'Failed to delete scene');
        }
      } catch (err) {
        console.error('Failed to delete scene:', err);
        setError('Failed to delete scene');
      }
    }
  };

  const getTypeColor = (type: SceneType) => {
    switch (type) {
      case 'exploration': return 'bg-green-100 text-green-800';
      case 'social': return 'bg-blue-100 text-blue-800';
      case 'combat': return 'bg-red-100 text-red-800';
      case 'travel': return 'bg-yellow-100 text-yellow-800';
      case 'investigation': return 'bg-purple-100 text-purple-800';
      case 'puzzle': return 'bg-indigo-100 text-indigo-800';
      case 'hazard': return 'bg-orange-100 text-orange-800';
      case 'transition': return 'bg-gray-100 text-gray-800';
      case 'revelation': return 'bg-pink-100 text-pink-800';
      case 'downtime': return 'bg-cyan-100 text-cyan-800';
      case 'climax': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const moveSceneUp = async (sceneId: string) => {
    try {
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const sceneRepo = new SceneRepository(dbManager.getConnection());
      const scenes = await sceneRepo.findByAdventure(adventureId);
      
      if (scenes.success && scenes.data) {
        const sceneIndex = scenes.data.findIndex(s => s.id === sceneId);
        if (sceneIndex > 0) {
          const currentScene = scenes.data[sceneIndex];
          const previousScene = scenes.data[sceneIndex - 1];
          
          if (previousScene) {
            // Swap sort orders
            const tempOrder = previousScene.sortOrder;
            await sceneRepo.update(previousScene.id, { sortOrder: currentScene.sortOrder });
            await sceneRepo.update(currentScene.id, { sortOrder: tempOrder });
          }
        }
      }
    } catch (err) {
      console.error('Failed to move scene up:', err);
    }
  };

  const moveSceneDown = async (sceneId: string) => {
    try {
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const sceneRepo = new SceneRepository(dbManager.getConnection());
      const scenes = await sceneRepo.findByAdventure(adventureId);
      
      if (scenes.success && scenes.data) {
        const sceneIndex = scenes.data.findIndex(s => s.id === sceneId);
        if (sceneIndex >= 0 && sceneIndex < scenes.data.length - 1) {
          const currentScene = scenes.data[sceneIndex];
          const nextScene = scenes.data[sceneIndex + 1];
          
          if (nextScene) {
            // Swap sort orders
            const tempOrder = nextScene.sortOrder;
            await sceneRepo.update(nextScene.id, { sortOrder: currentScene.sortOrder });
            await sceneRepo.update(currentScene.id, { sortOrder: tempOrder });
          }
        }
      }
    } catch (err) {
      console.error('Failed to move scene down:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading scenes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium mb-2">Error</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Scenes</h2>
        <div className="flex gap-4 items-center">
          <button
            onClick={onCreateScene}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Scene
          </button>
          
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'order')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="order">Sort Order</option>
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
          </select>

          {/* Filter Options */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as SceneType | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="exploration">Exploration</option>
            <option value="social">Social</option>
            <option value="combat">Combat</option>
            <option value="travel">Travel</option>
            <option value="investigation">Investigation</option>
            <option value="puzzle">Puzzle</option>
            <option value="hazard">Hazard</option>
            <option value="transition">Transition</option>
            <option value="revelation">Revelation</option>
            <option value="downtime">Downtime</option>
            <option value="climax">Climax</option>
            <option value="other">Other</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search scenes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Scene List */}
      {scenes.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No Scenes Yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first scene to start building your adventure.
          </p>
          <button
            onClick={onCreateScene}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First Scene
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {scenes.map((scene, index) => (
            <div key={scene.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {scene.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(scene.type)}`}>
                      {scene.type}
                    </span>
                    {scene.location && (
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {scene.location}
                      </span>
                    )}
                    <span className="ml-auto flex items-center">
                      Order: {scene.sortOrder}
                    </span>
                  </div>
                  {scene.summary && (
                    <p className="text-gray-600 mt-2 line-clamp-2">
                      {scene.summary}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditScene(scene)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Edit scene"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSelectScene(scene)}
                    className="p-2 text-blue-600 hover:text-blue-700"
                    title="Play scene"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <div className="relative group">
                    <button
                      onClick={() => moveSceneUp(scene.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      disabled={index === 0}
                      title="Move scene up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveSceneDown(scene.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      disabled={index === scenes.length - 1}
                      title="Move scene down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteScene(scene)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Delete scene"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scene Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 border-t pt-4">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{scene.exitOptions?.length || 0} Exits</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{scene.sceneNpcRefs?.length || 0} NPCs</span>
                </div>
                {scene.canEndSessionHere && (
                  <div className="flex items-center">
                    <EyeOff className="h-4 w-4 mr-1" />
                    <span>Can End Session</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
