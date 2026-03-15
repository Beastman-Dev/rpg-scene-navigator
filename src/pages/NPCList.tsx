// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Shield, Search, Filter } from 'lucide-react';
import type { NPC, StatBlock } from '@/types';
import { NPCRepository } from '@/repositories';
import { getDatabaseManager } from '@/database/connection';

interface NPCListProps {
  adventureId: string;
  onSelectNPC: (npc: NPC) => void;
  onEditNPC: (npc: NPC) => void;
  onDeleteNPC: (npc: NPC) => void;
  onCreateNPC: () => void;
  onBack: () => void;
}

export function NPCList({ 
  adventureId, 
  onSelectNPC, 
  onEditNPC, 
  onDeleteNPC,
  onCreateNPC,
  onBack
}: NPCListProps) {
  const [npcs, setNPCs] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [factionFilter, setFactionFilter] = useState<string>('all');

  useEffect(() => {
    loadNPCs();
  }, [adventureId, searchTerm, factionFilter]);

  const loadNPCs = async () => {
    try {
      setLoading(true);
      
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const npcRepo = new NPCRepository(dbManager.getConnection());
      let result;

      if (searchTerm) {
        result = await npcRepo.search(adventureId, searchTerm);
      } else if (factionFilter && factionFilter !== 'all') {
        result = await npcRepo.findByFaction(factionFilter);
        // Filter by adventure since findByFaction doesn't
        if (result.success && result.data) {
          result.data = result.data.filter(npc => npc.adventureId === adventureId);
        }
      } else {
        result = await npcRepo.findByAdventure(adventureId);
      }

      if (result.success) {
        setNPCs(result.data || []);
        setError(null);
      } else {
        setError(result.error || 'Failed to load NPCs');
      }
    } catch (err) {
      setError('Failed to load NPCs');
      console.error('Load NPCs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNPC = async (npc: NPC) => {
    if (window.confirm(`Are you sure you want to delete "${npc.name}"?`)) {
      try {
        const dbManager = getDatabaseManager();
        if (!dbManager.isReady()) {
          throw new Error('Database not initialized');
        }

        const npcRepo = new NPCRepository(dbManager.getConnection());
        const result = await npcRepo.delete(npc.id);
        
        if (result.success) {
          console.log('NPC deleted successfully');
          await loadNPCs(); // Reload NPCs
        } else {
          throw new Error(result.error || 'Failed to delete NPC');
        }
      } catch (err) {
        console.error('Failed to delete NPC:', err);
        setError('Failed to delete NPC');
      }
    }
  };

  const getFactionColor = (faction: string) => {
    const colors: { [key: string]: string } = {
      'all': 'bg-gray-100 text-gray-800',
      'players': 'bg-blue-100 text-blue-800',
      'enemies': 'bg-red-100 text-red-800',
      'neutral': 'bg-yellow-100 text-yellow-800',
      'allies': 'bg-green-100 text-green-800',
      'merchants': 'bg-purple-100 text-purple-800',
      'guild': 'bg-indigo-100 text-indigo-800'
    };
    return colors[faction] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'villain': return <Shield className="h-4 w-4" />;
      case 'merchant': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getStatSummary = (statBlock: StatBlock | undefined) => {
    if (!statBlock) return 'No stats';
    
    const stats = [];
    if (statBlock.abilityScores) {
      Object.entries(statBlock.abilityScores).forEach(([key, value]) => {
        stats.push(`${key}: ${value}`);
      });
    }
    if (statBlock.armorClass) stats.push(`AC: ${statBlock.armorClass}`);
    if (statBlock.hitPoints) stats.push(`HP: ${statBlock.hitPoints}`);
    if (statBlock.challengeRating) stats.push(`CR: ${statBlock.challengeRating}`);
    
    return stats.slice(0, 3).join(', ') + (stats.length > 3 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading NPCs...</div>
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
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            ← Back to Adventure
          </button>
          <h2 className="text-2xl font-semibold">NPCs</h2>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={onCreateNPC}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create NPC
          </button>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search NPCs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Faction Filter */}
          <select
            value={factionFilter}
            onChange={(e) => setFactionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Factions</option>
            <option value="players">Players</option>
            <option value="enemies">Enemies</option>
            <option value="neutral">Neutral</option>
            <option value="allies">Allies</option>
            <option value="merchants">Merchants</option>
            <option value="guild">Guild</option>
          </select>
        </div>
      </div>

      {/* NPC List */}
      {npcs.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">No NPCs Yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first NPC to populate your adventure world.
          </p>
          <button
            onClick={onCreateNPC}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Your First NPC
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {npcs.map((npc) => (
            <div key={npc.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {npc.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFactionColor(npc.faction || 'neutral')}`}>
                      {npc.faction || 'Neutral'}
                    </span>
                    <div className="flex items-center text-sm text-gray-600">
                      {getRoleIcon(npc.role || '')}
                      <span className="ml-2">{npc.role}</span>
                    </div>
                  </div>
                  
                  {npc.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {npc.description}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditNPC(npc)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Edit NPC"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onSelectNPC(npc)}
                    className="p-2 text-blue-600 hover:text-blue-700"
                    title="View NPC details"
                  >
                    <Users className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNPC(npc)}
                    className="p-2 text-red-600 hover:text-red-700"
                    title="Delete NPC"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* NPC Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 border-t pt-4">
                <div>
                  <strong>Stats:</strong>
                  <div className="mt-1">{getStatSummary(npc.statBlock)}</div>
                </div>
                <div>
                  <strong>Tags:</strong>
                  <div className="mt-1">
                    {Array.isArray(npc.tags) && npc.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {npc.tags.map((tag, index) => (
                          <span key={`${tag}-${index}`} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No tags</span>
                    )}
                  </div>
                </div>
                {npc.notes && (
                  <div className="md:col-span-3">
                    <strong>Notes:</strong>
                    <div className="mt-1 text-gray-700">{npc.notes}</div>
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
