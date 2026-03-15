// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Plus, X, Users, Search } from 'lucide-react';
import type { NPC, SceneNpcRef } from '@/types';
import { NPCRepository } from '@/repositories';
import { getDatabaseManager } from '@/database/connection';

interface NPCSelectorProps {
  adventureId: string;
  selectedNPCs: SceneNpcRef[];
  onNPCsChange: (npcs: SceneNpcRef[]) => void;
  className?: string;
}

export function NPCSelector({ adventureId, selectedNPCs, onNPCsChange, className = '' }: NPCSelectorProps) {
  const [availableNPCs, setAvailableNPCs] = useState<NPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadAvailableNPCs();
  }, [adventureId]);

  const loadAvailableNPCs = async () => {
    try {
      setLoading(true);
      
      const dbManager = getDatabaseManager();
      if (!dbManager.isReady()) {
        throw new Error('Database not initialized');
      }

      const npcRepo = new NPCRepository(dbManager.getConnection());
      const result = await npcRepo.findByAdventure(adventureId);
      
      if (result.success) {
        setAvailableNPCs(result.data || []);
      } else {
        console.error('Failed to load NPCs:', result.error);
      }
    } catch (err) {
      console.error('Load NPCs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addNPC = (npc: NPC) => {
    // Check if NPC is already selected
    const existingIndex = selectedNPCs.findIndex(ref => ref.npcId === npc.id);
    if (existingIndex !== -1) {
      // NPC already selected, don't add duplicate
      return;
    }

    const newNPCRef: SceneNpcRef = {
      npcId: npc.id,
      presenceRole: '',
      isHostile: false,
      notes: ''
    };

    onNPCsChange([...selectedNPCs, newNPCRef]);
  };

  const removeNPC = (index: number) => {
    const updatedNPCs = selectedNPCs.filter((_, i) => i !== index);
    onNPCsChange(updatedNPCs);
  };

  const updateNPCRef = (index: number, field: keyof SceneNpcRef, value: any) => {
    const updatedNPCs = [...selectedNPCs];
    updatedNPCs[index] = {
      ...updatedNPCs[index],
      [field]: value
    };
    onNPCsChange(updatedNPCs);
  };

  const getNPCById = (npcId: string): NPC | undefined => {
    return availableNPCs.find(npc => npc.id === npcId);
  };

  const filteredNPCs = availableNPCs.filter(npc => {
    const searchLower = searchTerm.toLowerCase();
    return (
      npc.name.toLowerCase().includes(searchLower) ||
      npc.role?.toLowerCase().includes(searchLower) ||
      npc.description?.toLowerCase().includes(searchLower)
    );
  });

  // Filter out already selected NPCs from the available list
  const selectableNPCs = filteredNPCs.filter(npc => 
    !selectedNPCs.some(ref => ref.npcId === npc.id)
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected NPCs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          NPCs in Scene
        </label>
        
        {selectedNPCs.length === 0 ? (
          <div className="text-gray-500 text-sm italic">
            No NPCs selected for this scene
          </div>
        ) : (
          <div className="space-y-3">
            {selectedNPCs.map((npcRef, index) => {
              const npc = getNPCById(npcRef.npcId);
              return (
                <div key={npcRef.npcId} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{npc?.name || 'Unknown NPC'}</span>
                      {npc?.role && (
                        <span className="text-sm text-gray-500">({npc.role})</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeNPC(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Remove NPC"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Presence Role
                      </label>
                      <input
                        type="text"
                        value={npcRef.presenceRole || ''}
                        onChange={(e) => updateNPCRef(index, 'presenceRole', e.target.value)}
                        placeholder="e.g., Guard, Merchant, Quest Giver"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`hostile-${npcRef.npcId}`}
                        checked={npcRef.isHostile || false}
                        onChange={(e) => updateNPCRef(index, 'isHostile', e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`hostile-${npcRef.npcId}`} className="text-sm text-gray-700">
                        Hostile
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={npcRef.notes || ''}
                      onChange={(e) => updateNPCRef(index, 'notes', e.target.value)}
                      placeholder="GM notes about this NPC in the scene..."
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add NPC Button */}
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add NPC to Scene
        </button>
      </div>

      {/* NPC Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select NPCs for Scene</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search NPCs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* NPC List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">Loading NPCs...</div>
              ) : selectableNPCs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {availableNPCs.length === 0 
                    ? "No NPCs available. Create NPCs first."
                    : searchTerm 
                      ? "No NPCs match your search."
                      : "All NPCs have been added to this scene."
                  }
                </div>
              ) : (
                <div className="space-y-2">
                  {selectableNPCs.map((npc) => (
                    <div
                      key={npc.id}
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => addNPC(npc)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{npc.name}</div>
                          {npc.role && (
                            <div className="text-sm text-gray-500">{npc.role}</div>
                          )}
                          {npc.faction && (
                            <div className="text-xs text-gray-400">Faction: {npc.faction}</div>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
