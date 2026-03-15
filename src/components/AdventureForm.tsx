// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Save } from 'lucide-react';
import type { Adventure, AdventureFormData, AdventureStatus } from '@/types';
import { AdventureFormSchema, validateAdventureForm } from '@/schemas';

interface AdventureFormProps {
  adventure?: Adventure;
  onSave: (adventure: AdventureFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AdventureForm({ adventure, onSave, onCancel, isLoading = false }: AdventureFormProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      tags: adventure.tags || [],
      status: adventure.status,
      author: adventure.author || ''
    } : {
      title: '',
      description: '',
      tags: [],
      status: 'draft',
      author: ''
    }
  });

  const watchedStatus = watch('status');

  const onSubmit = async (data: AdventureFormData) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      
      const validation = validateAdventureForm(data);
      if (!validation.success) {
        setSaveError(validation.error);
        return;
      }

      await onSave(data);
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save adventure';
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
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
