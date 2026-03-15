// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Plus, ArrowUp, ArrowDown, Users, MapPin, Link, Eye, EyeOff, Settings } from 'lucide-react';
import type { Scene, SceneType, SceneFormData, SceneNpcRef, ExitOption } from '@/types';
import { SceneFormSchema, validateSceneForm } from '@/schemas';

interface SceneEditorProps {
  scene?: Scene;
  adventureId: string;
  onSave: (scene: SceneFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const sceneTypeOptions: { value: SceneType; label: string }[] = [
  { value: 'exploration', label: 'Exploration' },
  { value: 'social', label: 'Social' },
  { value: 'combat', label: 'Combat' },
  { value: 'travel', label: 'Travel' },
  { value: 'investigation', label: 'Investigation' },
  { value: 'puzzle', label: 'Puzzle' },
  { value: 'hazard', label: 'Hazard' },
  { value: 'transition', label: 'Transition' },
  { value: 'revelation', label: 'Revelation' },
  { value: 'downtime', label: 'Downtime' },
  { value: 'climax', label: 'Climax' },
  { value: 'other', label: 'Other' }
];

export function SceneEditor({ scene, adventureId, onSave, onCancel, isLoading = false }: SceneEditorProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [exitOptions, setExitOptions] = useState<ExitOption[]>([]);
  const [npcRefs, setNpcRefs] = useState<SceneNpcRef[]>([]);

  // Load exits and NPCs when editing an existing scene
  useEffect(() => {
    if (scene) {
      setExitOptions(scene.exitOptions || []);
      setNpcRefs(scene.sceneNpcRefs || []);
    }
  }, [scene]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<SceneFormData>({
    resolver: zodResolver(SceneFormSchema),
    defaultValues: scene ? {
      name: scene.name,
      type: scene.type,
      location: scene.location || '',
      tags: scene.tags || [],
      summary: scene.summary || '',
      gmDescription: scene.gmDescription || '',
      readAloud: scene.readAloud || '',
      atmosphere: scene.atmosphere || '',
      entryConditions: scene.entryConditions || [],
      objectives: scene.objectives || [],
      complications: scene.complications || [],
      clues: scene.clues || [],
      interactiveElements: scene.interactiveElements || [],
      failureStates: scene.failureStates || [],
      successStates: scene.successStates || [],
      rewards: scene.rewards || [],
      factions: scene.factions || [],
      canEndSessionHere: scene.canEndSessionHere || false,
      sortOrder: scene.sortOrder || 0
    } : {
      name: '',
      type: 'exploration',
      location: '',
      tags: [],
      summary: '',
      gmDescription: '',
      readAloud: '',
      atmosphere: '',
      entryConditions: [],
      objectives: [],
      complications: [],
      clues: [],
      interactiveElements: [],
      failureStates: [],
      successStates: [],
      rewards: [],
      factions: [],
      canEndSessionHere: false,
      sortOrder: 0
    }
  });

  const onSubmit = async (data: SceneFormData) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const validation = validateSceneForm(data);
      if (!validation.success) {
        setSaveError(validation.error);
        return;
      }

      // Include exitOptions and npcRefs in the save data
      const fullSceneData = {
        ...data,
        exitOptions,
        sceneNpcRefs: npcRefs,
        adventureId
      };

      await onSave(fullSceneData);
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save scene';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const addExitOption = () => {
    const newExit: ExitOption = {
      id: crypto.randomUUID(),
      label: '',
      destinationSceneId: '',
      conditionText: '',
      resultText: '',
      stateChanges: [],
      sortOrder: exitOptions.length
    };
    setExitOptions([...exitOptions, newExit]);
  };

  const updateExitOption = (id: string, updates: Partial<ExitOption>) => {
    setExitOptions(exitOptions.map(exit => 
      exit.id === id ? { ...exit, ...updates } : exit
    ));
  };

  const removeExitOption = (id: string) => {
    setExitOptions(exitOptions.filter(exit => exit.id !== id));
  };

  const addNpcRef = () => {
    const newNpc: SceneNpcRef = {
      npcId: '',
      presenceRole: '',
      isHostile: false,
      notes: ''
    };
    setNpcRefs([...npcRefs, newNpc]);
  };

  const updateNpcRef = (index: number, updates: Partial<SceneNpcRef>) => {
    setNpcRefs(npcRefs.map((npc, i) => 
      i === index ? { ...npc, ...updates } : npc
    ));
  };

  const removeNpcRef = (index: number) => {
    setNpcRefs(npcRefs.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const currentTags = watch('tags') || [];
    const newTag = prompt('Enter new tag:');
    if (newTag && !currentTags.includes(newTag)) {
      setValue('tags', [...currentTags, newTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const addArrayItem = (fieldName: keyof SceneFormData) => {
    const currentValue = watch(fieldName) as string[] || [];
    const newItem = prompt(`Enter new ${fieldName}:`);
    if (newItem && !currentValue.includes(newItem)) {
      setValue(fieldName, [...currentValue, newItem]);
    }
  };

  const removeArrayItem = (fieldName: keyof SceneFormData, index: number) => {
    const currentValue = watch(fieldName) as string[] || [];
    setValue(fieldName, currentValue.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {scene ? 'Edit Scene' : 'Create New Scene'}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-gray-500 hover:text-gray-700"
              disabled={isSaving}
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="submit"
              form="scene-form"
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving}
            >
              <Save className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form id="scene-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Scene Name *
              </label>
              <input
                id="name"
                type="text"
                {...register('name', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter scene name..."
                disabled={isSaving}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Scene Type *
              </label>
              <select
                id="type"
                {...register('type', { required: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              >
                {sceneTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter scene location..."
                disabled={isSaving}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <input
                id="sortOrder"
                type="number"
                {...register('sortOrder', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                disabled={isSaving}
              />
              {errors.sortOrder && (
                <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(watch('tags') || []).map((tag, index) => (
                  <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          disabled={isSaving}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                ))}
              </div>
              <button
                type="button"
                onClick={addTag}
                className="inline-flex items-center px-3 py-1 border border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                disabled={isSaving}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Tag
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                Summary
              </label>
              <textarea
                id="summary"
                rows={3}
                {...register('summary')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief scene summary..."
                disabled={isSaving}
              />
              {errors.summary && (
                <p className="mt-1 text-sm text-red-600">{errors.summary.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="atmosphere" className="block text-sm font-medium text-gray-700 mb-2">
                Atmosphere
              </label>
              <textarea
                id="atmosphere"
                rows={2}
                {...register('atmosphere')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Scene atmosphere and mood..."
                disabled={isSaving}
              />
              {errors.atmosphere && (
                <p className="mt-1 text-sm text-red-600">{errors.atmosphere.message}</p>
              )}
            </div>
          </div>

          {/* GM Content */}
          <div className="space-y-6">
            <div>
              <label htmlFor="gmDescription" className="block text-sm font-medium text-gray-700 mb-2">
                GM Description
              </label>
              <textarea
                id="gmDescription"
                rows={6}
                {...register('gmDescription')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description for the game master..."
                disabled={isSaving}
              />
              {errors.gmDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.gmDescription.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="readAloud" className="block text-sm font-medium text-gray-700 mb-2">
                Read Aloud Text
              </label>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Text to read directly to players</span>
              </div>
              <textarea
                id="readAloud"
                rows={4}
                {...register('readAloud')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Text to read aloud to players..."
                disabled={isSaving}
              />
              {errors.readAloud && (
                <p className="mt-1 text-sm text-red-600">{errors.readAloud.message}</p>
              )}
            </div>
          </div>

          {/* Exit Options */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Exit Options</h3>
              <button
                type="button"
                onClick={addExitOption}
                className="inline-flex items-center px-3 py-2 border border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                disabled={isSaving}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Exit
              </button>
            </div>
            <div className="space-y-4">
              {exitOptions.map((exit, index) => (
                <div key={exit.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Label
                      </label>
                      <input
                        type="text"
                        value={exit.label}
                        onChange={(e) => updateExitOption(exit.id, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Exit button text..."
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destination Scene
                      </label>
                      <select
                        value={exit.destinationSceneId}
                        onChange={(e) => updateExitOption(exit.id, { destinationSceneId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        <option value="">Select destination...</option>
                        {/* TODO: Load actual scenes from database */}
                        <option value="scene-1">Scene 1</option>
                        <option value="scene-2">Scene 2</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition Text
                      </label>
                      <textarea
                        rows={2}
                        value={exit.conditionText}
                        onChange={(e) => updateExitOption(exit.id, { conditionText: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Conditions for this exit..."
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Result Text
                      </label>
                      <textarea
                        rows={2}
                        value={exit.resultText}
                        onChange={(e) => updateExitOption(exit.id, { resultText: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What happens when this exit is taken..."
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => removeExitOption(exit.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={isSaving}
                    >
                      Remove Exit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPC References */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">NPCs in Scene</h3>
              <button
                type="button"
                onClick={addNpcRef}
                className="inline-flex items-center px-3 py-2 border border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
                disabled={isSaving}
              >
                <Users className="h-3 w-3 mr-1" />
                Add NPC
              </button>
            </div>
            <div className="space-y-4">
              {npcRefs.map((npcRef, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NPC
                      </label>
                      <select
                        value={npcRef.npcId}
                        onChange={(e) => updateNpcRef(index, { npcId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSaving}
                      >
                        <option value="">Select NPC...</option>
                        {/* TODO: Load actual NPCs from database */}
                        <option value="npc-1">Guard Captain</option>
                        <option value="npc-2">Merchant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Presence Role
                      </label>
                      <input
                        type="text"
                        value={npcRef.presenceRole}
                        onChange={(e) => updateNpcRef(index, { presenceRole: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="How does this NPC appear in the scene..."
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={npcRef.isHostile}
                        onChange={(e) => updateNpcRef(index, { isHostile: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isSaving}
                      />
                      <label className="ml-2 text-sm text-gray-700">Hostile</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        rows={2}
                        value={npcRef.notes}
                        onChange={(e) => updateNpcRef(index, { notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Notes about this NPC in this scene..."
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeNpcRef(index)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={isSaving}
                    >
                      Remove NPC
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {saveError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{saveError}</p>
            </div>
          )}

          {/* Loading State */}
          {isSaving && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">Saving scene...</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
