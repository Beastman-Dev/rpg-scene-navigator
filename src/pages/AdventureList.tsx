// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, MapPin, Users } from 'lucide-react';
import type { Adventure, AdventureStatus } from '@/types';
import { getDatabaseManager } from '@/database/connection';
import { AdventureRepository } from '@/repositories/adventure';

interface AdventureListProps {
  onCreateAdventure: () => void;
  onSelectAdventure: (adventure: Adventure) => void;
  onEditAdventure: (adventure: Adventure) => void;
  onDeleteAdventure: (adventure: Adventure) => void;
  onAdventureSaved?: () => void; // Add callback for adventure save
  setCurrentView?: (view: string) => void; // Add setCurrentView prop
  setSelectedAdventure?: (adventure: Adventure) => void; // Add setSelectedAdventure prop
  onSetStartingScene?: (adventure: Adventure) => void; // Add onSetStartingScene prop
}

export function AdventureList({ 
  onCreateAdventure, 
  onSelectAdventure, 
  onEditAdventure, 
  onDeleteAdventure,
  onAdventureSaved,
  setCurrentView,
  setSelectedAdventure,
  onSetStartingScene
}: AdventureListProps) {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AdventureStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key

  useEffect(() => {
    loadAdventures();
  }, [filter, searchTerm, refreshKey]); // Add refreshKey to dependencies

  // Call onAdventureSaved when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0 && onAdventureSaved) {
      onAdventureSaved();
    }
  }, [refreshKey, onAdventureSaved]);

  const loadAdventures = async () => {
    try {
      setLoading(true);
      
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        // Database not ready yet, wait and retry
        console.log('Database not ready, retrying in 500ms...');
        setTimeout(() => loadAdventures(), 500);
        return;
      }
      
      // Use AdventureRepository to properly map database rows to entities
      const adventureRepo = new AdventureRepository(dbManager.getConnection());
      const result = await adventureRepo.findAll({ orderBy: 'updated_at', orderDirection: 'DESC' });

      console.log('📋 AdventureList - Loaded adventures:', result.data?.map(a => ({
        id: a.id,
        title: a.title,
        startingSceneId: a.startingSceneId
      })));

      if (result.success && result.data) {
        setAdventures(result.data);
        setError(null);
      } else {
        setError('Failed to load adventures');
      }
    } catch (err) {
      setError('Failed to load adventures');
      console.error('Load adventures error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: AdventureStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (adventure: Adventure) => {
    if (window.confirm(`Are you sure you want to delete "${adventure.title}"?`)) {
      try {
        // TODO: Implement actual deletion
        onDeleteAdventure(adventure);
        await loadAdventures();
      } catch (err) {
        setError('Failed to delete adventure');
        console.error('Delete adventure error:', err);
      }
    }
  };

  // Add refresh method
  const refreshAdventures = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading adventures...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <button 
          onClick={loadAdventures}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Adventures</h2>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Adventures</h1>
        <button
          onClick={onCreateAdventure}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Adventure
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search adventures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as AdventureStatus | 'all')}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Adventure List */}
      {adventures.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {searchTerm || filter !== 'all' 
              ? 'No adventures match your filters.' 
              : 'No adventures yet. Create your first adventure!'}
          </div>
          {!searchTerm && filter === 'all' && (
            <button
              onClick={onCreateAdventure}
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Your First Adventure
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {adventures.map((adventure) => (
            <div
              key={adventure.id}
              className="bg-white border-2 border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{adventure.title}</h3>
                  {adventure.description && (
                    <p className="text-gray-600 mb-3">{adventure.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {adventure.author && <span>By {adventure.author}</span>}
                    <span>Created {new Date(adventure.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(adventure.status)}`}>
                  {adventure.status}
                </span>
              </div>

              {adventure.tags && adventure.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(adventure.tags) ? adventure.tags.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {tag}
                    </span>
                  )) : null}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onSetStartingScene) onSetStartingScene(adventure);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Play
                </button>
                <button
                  onClick={() => onEditAdventure(adventure)}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (setSelectedAdventure) setSelectedAdventure(adventure);
                    if (setCurrentView) setCurrentView('scenes');
                  }}
                  className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Scenes
                </button>
                <button
                  onClick={() => {
                    if (setSelectedAdventure) setSelectedAdventure(adventure);
                    if (setCurrentView) setCurrentView('npcs');
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  NPCs
                </button>
                <button
                  onClick={() => handleDelete(adventure)}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
