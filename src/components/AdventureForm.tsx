// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Save, MapPin } from 'lucide-react';
import type { Adventure, AdventureFormData, AdventureStatus, Scene } from '@/types';
import { AdventureFormSchema, validateAdventureForm } from '@/schemas';
import { getDatabaseManager } from '@/database/connection';
import { SceneRepository } from '@/repositories/scene';

interface AdventureFormProps {
  adventure?: Adventure;
  onSave: (adventure: AdventureFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AdventureForm({ adventure, onSave, onCancel, isLoading = false }: AdventureFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [availableScenes, setAvailableScenes] = useState<Scene[]>([]);
  const [scenesLoading, setScenesLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<AdventureFormData>({
    resolver: zodResolver(AdventureFormSchema),
    defaultValues: adventure ? {
      title: adventure.title,
      description: adventure.description || '',
      // Handle tags as either array or JSON string
      tags: Array.isArray(adventure.tags) 
        ? adventure.tags 
        : (typeof adventure.tags === 'string' && adventure.tags 
            ? JSON.parse(adventure.tags) 
            : []),
      status: adventure.status,
      author: adventure.author || '',
      startingSceneId: adventure.startingSceneId || ''
    } : {
      title: '',
      description: '',
      tags: [],
      status: 'draft',
      author: '',
      startingSceneId: ''
    }
  });

  const watchedStatus = watch('status');

  const onSubmit = async (data: AdventureFormData) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      console.log('🚀 AdventureForm - Submitting data:', data);
      
      const validation = validateAdventureForm(data);
      if (!validation.success) {
        const errorMessage = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.error('❌ AdventureForm - Validation failed:', validation.error);
        setSaveError(errorMessage);
        return;
      }

      console.log('✅ AdventureForm - Validation passed, calling onSave...');
      await onSave(data);
      console.log('✅ AdventureForm - Save completed successfully');
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save adventure';
      console.error('❌ AdventureForm - Save failed:', error);
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
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

  // Load available scenes and reset form when editing an existing adventure
  useEffect(() => {
    console.log('📝 AdventureForm - useEffect triggered', {
      hasAdventure: !!adventure,
      adventureId: adventure?.id,
      startingSceneId: adventure?.startingSceneId,
      startingSceneIdType: typeof adventure?.startingSceneId
    });
    
    if (adventure) {
      const formData = {
        title: adventure.title,
        description: adventure.description || '',
        tags: Array.isArray(adventure.tags) 
          ? adventure.tags 
          : (typeof adventure.tags === 'string' && adventure.tags 
              ? JSON.parse(adventure.tags) 
              : []),
        status: adventure.status,
        author: adventure.author || '',
        startingSceneId: adventure.startingSceneId || ''
      };
      
      console.log('📝 AdventureForm - Resetting form with data:', formData);
      reset(formData);
      
      // Load scenes after resetting form
      if (adventure.id) {
        loadScenesForAdventure(adventure.id).then(() => {
          // Reset form again after scenes are loaded to ensure dropdown updates
          console.log('📝 AdventureForm - Resetting form after scenes loaded');
          reset(formData);
        });
      }
    }
  }, [adventure, reset]);

  const loadScenesForAdventure = async (adventureId: string) => {
    setScenesLoading(true);
    try {
      const dbManager = getDatabaseManager();
      if (dbManager.isReady()) {
        const sceneRepo = new SceneRepository(dbManager.getConnection());
        const result = await sceneRepo.findByAdventureId(adventureId);
        if (result.success && result.data) {
          setAvailableScenes(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load scenes:', error);
    } finally {
      setScenesLoading(false);
    }
  };

  const statusOptions: { value: AdventureStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'completed', label: 'Completed' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">
            {adventure ? 'Edit Adventure' : 'Create New Adventure'}
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
              form="adventure-form"
              className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isSaving || isLoading}
            >
              <Save className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form id="adventure-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              id="title"
              type="text"
              {...register('title', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter adventure title..."
              disabled={isSaving}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter adventure description..."
              disabled={isSaving}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Author */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              id="author"
              type="text"
              {...register('author')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter author name..."
              disabled={isSaving}
            />
            {errors.author && (
              <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>

          {/* Starting Scene - only show when editing and scenes exist */}
          {adventure?.id && (
            <div>
              <label htmlFor="startingSceneId" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Starting Scene
              </label>
              <select
                id="startingSceneId"
                {...register('startingSceneId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving || scenesLoading || availableScenes.length === 0}
              >
                <option value="">
                  {scenesLoading 
                    ? 'Loading scenes...' 
                    : availableScenes.length === 0 
                      ? 'No scenes available - create scenes first' 
                      : 'Select starting scene...'}
                </option>
                {availableScenes.map(scene => (
                  <option key={scene.id} value={scene.id}>
                    {scene.name} ({scene.type})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                This scene will be loaded when you click "Play" on this adventure.
              </p>
              {errors.startingSceneId && (
                <p className="mt-1 text-sm text-red-600">{errors.startingSceneId.message}</p>
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const tagsValue = watch('tags');
                  const tagsArray = Array.isArray(tagsValue) 
                    ? tagsValue 
                    : (typeof tagsValue === 'string' && tagsValue 
                        ? JSON.parse(tagsValue) 
                        : []);
                  return tagsArray.map((tag: string, index: number) => (
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
                  ));
                })()}
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

          {/* Error Display */}
          {saveError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{saveError}</p>
            </div>
          )}

          {/* Loading State */}
          {(isSaving || isLoading) && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800">
                {isSaving ? 'Saving adventure...' : 'Loading...'}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
