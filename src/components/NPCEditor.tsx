// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Plus, Trash2, Sword } from 'lucide-react';
import type { NPC, NPCFormData, StatBlock } from '@/types';
import { NPCFormSchema } from '@/schemas';

interface NPCEditorProps {
  npc?: NPC;
  adventureId: string;
  onSave: (npc: NPCFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NPCEditor({ npc, adventureId, onSave, onCancel, isLoading = false }: NPCEditorProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statBlock, setStatBlock] = useState<StatBlock>({
    abilityScores: {},
    armorClass: 10,
    hitPoints: 10,
    challengeRating: 0.25,
    skills: [],
    savingThrows: {},
    attacks: []
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<NPCFormData>({
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

  const tagsValue = watch('tags') || [];

  const addTag = () => {
    const currentTags = tagsValue || [];
    const newTag = prompt('Enter new tag:');
    if (newTag && !currentTags.includes(newTag)) {
      setValue('tags', [...currentTags, newTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = tagsValue || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addAbilityScore = () => {
    const ability = prompt('Enter ability name (e.g., STR, DEX, CON):');
    const score = prompt('Enter ability score (1-20):');
    if (ability && score) {
      setStatBlock(prev => ({
        ...prev,
        abilityScores: { ...prev.abilityScores, [ability]: parseInt(score) || 10 }
      }));
    }
  };

  const removeAbilityScore = (ability: string) => {
    setStatBlock(prev => {
      const newScores = { ...prev.abilityScores };
      delete newScores[ability];
      return { ...prev, abilityScores: newScores };
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

  const onSubmit = async (data: NPCFormData) => {
    try {
      setSaveError(null);
      
      // Include stat block in save data
      const fullNPCData = {
        ...data,
        statBlock,
        adventureId
      };

      await onSave(fullNPCData);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save NPC');
    }
  };

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
        </div>
      </div>

      {/* Error Display */}
      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700">{saveError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(tagsValue) && tagsValue.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  + Add Tag
                </button>
              </div>
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the NPC's appearance, personality, background..."
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Private notes for the Dungeon Master..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
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
                  className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ability Score
                </button>
              </div>
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
                    step="0.25"
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

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save NPC'}
          </button>
        </div>
      </form>
    </div>
  );
}
