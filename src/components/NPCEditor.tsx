// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Plus, Trash2, Users, Shield, Sword, Heart } from 'lucide-react';
import type { NPC, StatBlock, NPCFormData } from '@/types';
import { NPCFormSchema, validateNPCForm } from '@/schemas';

interface NPCEditorProps {
  npc?: NPC;
  adventureId: string;
  onSave: (data: NPCFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NPCEditor({ npc, adventureId, onSave, onCancel, isLoading = false }: NPCEditorProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statBlock, setStatBlock] = useState<StatBlock>({
    abilityScores: {},
    armorClass: 10,
    hitPoints: 10,
    challengeRating: 1,
    skills: [],
    savingThrows: {},
    attacks: []
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<NPCFormData>({
    resolver: zodResolver(NPCFormSchema),
    defaultValues: npc ? {
      name: npc.name,
      role: npc.role || '',
      description: npc.description || '',
      faction: npc.faction || '',
      notes: npc.notes || '',
      tags: npc.tags || []
    } : {
      name: '',
      role: '',
      description: '',
      faction: '',
      notes: '',
      tags: []
    }
  });

  // Load stat block when editing existing NPC
  useEffect(() => {
    if (npc && npc.statBlock) {
      setStatBlock(npc.statBlock);
    }
  }, [npc]);

  const onSubmit = async (data: NPCFormData) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const validation = validateNPCForm(data);
      if (!validation.success) {
        setSaveError(validation.error);
        return;
      }

      // Include stat block in the save data
      const fullNPCData = {
        ...data,
        statBlock,
        adventureId
      };

      await onSave(fullNPCData);
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save NPC';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const addAbilityScore = () => {
    const ability = prompt('Enter ability name (e.g., STR, DEX, CON):');
    if (ability) {
      const score = prompt(`Enter ${ability} score:`);
      if (score !== null) {
        setStatBlock(prev => ({
          ...prev,
          abilityScores: {
            ...prev.abilityScores,
            [ability]: parseInt(score) || 0
          }
        }));
      }
    }
  };

  const removeAbilityScore = (ability: string) => {
    setStatBlock(prev => {
      const newAbilityScores = { ...prev.abilityScores };
      delete newAbilityScores[ability];
      return {
        ...prev,
        abilityScores: newAbilityScores
      };
    });
  };

  const addSkill = () => {
    const skill = prompt('Enter skill name:');
    if (skill) {
      setStatBlock(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const removeSkill = (index: number) => {
    setStatBlock(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addAttack = () => {
    const attack = prompt('Enter attack description:');
    if (attack) {
      setStatBlock(prev => ({
        ...prev,
        attacks: [...prev.attacks, attack]
      }));
    }
  };

  const removeAttack = (index: number) => {
    setStatBlock(prev => ({
      ...prev,
      attacks: prev.attacks.filter((_, i) => i !== index)
    }));
  };

  const tagsValue = watch('tags') || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          {npc ? 'Edit NPC' : 'Create NPC'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => reset()}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Reset form"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="submit"
            form="npc-form"
            disabled={isSaving || isLoading}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            title="Save NPC"
          >
            <Save className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Display */}
      {saveError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700">{saveError}</p>
        </div>
      )}

      <form id="npc-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                id="role"
                type="text"
                {...register('role')}
                placeholder="e.g., Villain, Merchant, Guard"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="faction" className="block text-sm font-medium text-gray-700 mb-2">
                Faction
              </label>
              <select
                id="faction"
                {...register('faction')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select faction...</option>
                <option value="players">Players</option>
                <option value="enemies">Enemies</option>
                <option value="neutral">Neutral</option>
                <option value="allies">Allies</option>
                <option value="merchants">Merchants</option>
                <option value="guild">Guild</option>
              </select>
              {errors.faction && (
                <p className="mt-1 text-sm text-red-600">{errors.faction.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                id="tags"
                type="text"
                {...register('tags')}
                placeholder="Enter tags separated by commas"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
              )}
              {Array.isArray(tagsValue) && tagsValue.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tagsValue.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              placeholder="Describe the NPC's appearance, personality, and background..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              placeholder="Private notes for the Dungeon Master..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
          </div>
        </div>

        {/* Stat Block */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Stat Block</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Ability Scores</h4>
              <div className="space-y-2">
                {Object.entries(statBlock.abilityScores).map(([ability, score]) => (
                  <div key={ability} className="flex items-center justify-between">
                    <span className="font-medium">{ability}:</span>
                    <span className="font-mono">{score}</span>
                    <button
                      type="button"
                      onClick={() => removeAbilityScore(ability)}
                      className="ml-2 p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAbilityScore}
                  className="mt-2 w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ability Score
                </button>
              </div>

            <div>
              <h4 className="font-medium mb-3">Combat Stats</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Armor Class
                  </label>
                  <input
                    type="number"
                    value={statBlock.armorClass}
                    onChange={(e) => setStatBlock(prev => ({ ...prev, armorClass: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hit Points
                  </label>
                  <input
                    type="number"
                    value={statBlock.hitPoints}
                    onChange={(e) => setStatBlock(prev => ({ ...prev, hitPoints: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Challenge Rating
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={statBlock.challengeRating}
                    onChange={(e) => setStatBlock(prev => ({ ...prev, challengeRating: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">Skills</h4>
            <div className="space-y-2">
              {statBlock.skills.map((skill, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex-1">{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSkill}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </button>
            </div>
          </div>
        </div>

          <div className="mt-6">
            <h4 className="font-medium mb-3">Attacks</h4>
            <div className="space-y-2">
              {statBlock.attacks.map((attack, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Sword className="h-4 w-4 text-gray-500" />
                  <span className="flex-1">{attack}</span>
                  <button
                    type="button"
                    onClick={() => removeAttack(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addAttack}
                className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Attack
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
