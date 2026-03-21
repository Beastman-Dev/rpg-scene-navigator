import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdventureForm } from '@/components/AdventureForm'
import type { Adventure } from '@/types'

// Mock the database manager
vi.mock('@/database/connection', () => ({
  getDatabaseManager: () => ({
    isReady: () => true,
    getConnection: () => ({
      prepare: vi.fn(),
      exec: vi.fn()
    })
  })
}))

// Mock SceneRepository
vi.mock('@/repositories', () => ({
  SceneRepository: vi.fn().mockImplementation(() => ({
    findByAdventureId: vi.fn().mockResolvedValue({
      success: true,
      data: [
        { id: '73a86232-3c6e-4f28-9a6d-4653de4ad19b', name: 'Scene 1', type: 'exploration' },
        { id: '37a981cb-495b-4f27-91b2-b1cf838a3223', name: 'Scene 2', type: 'combat' }
      ]
    })
  }))
}))

describe('AdventureForm', () => {
  const mockOnSave = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Starting Scene Selection', () => {
    it('should display selected starting scene when editing existing adventure', async () => {
      const mockAdventure: Adventure = {
        id: 'adventure-123',
        title: 'Test Adventure',
        description: 'Test Description',
        startingSceneId: '73a86232-3c6e-4f28-9a6d-4653de4ad19b', // Has starting scene
        tags: ['test'],
        status: 'draft',
        author: 'Test Author',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(
        <AdventureForm
          adventure={mockAdventure}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Wait for scenes to load and form to reset
      await waitFor(() => {
        const dropdown = screen.getByLabelText(/Starting Scene/)
        expect(dropdown).toBeInTheDocument()
      })

      // Check that the dropdown shows the selected scene
      const dropdown = screen.getByLabelText(/Starting Scene/) as HTMLSelectElement
      expect(dropdown.value).toBe('scene-123')
      
      // Check that the correct option is selected
      const selectedOption = dropdown.options[dropdown.selectedIndex]
      expect(selectedOption.text).toBe('Scene 1 (exploration)')
    })

    it('should show "Select starting scene..." when no starting scene is selected', async () => {
      const mockAdventure: Adventure = {
        id: 'adventure-123',
        title: 'Test Adventure',
        description: 'Test Description',
        startingSceneId: undefined, // No starting scene
        tags: ['test'],
        status: 'draft',
        author: 'Test Author',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(
        <AdventureForm
          adventure={mockAdventure}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      await waitFor(() => {
        const dropdown = screen.getByLabelText(/Starting Scene/)
        expect(dropdown).toBeInTheDocument()
      })

      const dropdown = screen.getByLabelText(/Starting Scene/) as HTMLSelectElement
      expect(dropdown.value).toBe('')
      
      const selectedOption = dropdown.options[dropdown.selectedIndex]
      expect(selectedOption.text).toBe('Select starting scene...')
    })

    it('should include startingSceneId in form submission', async () => {
      const user = userEvent.setup()
      
      // Render with an existing adventure to show the starting scene dropdown
      const mockAdventure: Adventure = {
        id: 'adventure-123',
        title: 'Test Adventure',
        description: 'Test Description',
        startingSceneId: undefined,
        tags: ['test'],
        status: 'draft',
        author: 'Test Author',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(
        <AdventureForm
          adventure={mockAdventure}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Fill in required fields (title already filled from adventure)
      // Select a starting scene (wait for scenes to load)
      await waitFor(() => {
        const dropdown = screen.getByLabelText(/Starting Scene/)
        expect(dropdown).toBeInTheDocument()
      })

      const dropdown = screen.getByLabelText(/Starting Scene/)
      await user.selectOptions(dropdown, '73a86232-3c6e-4f28-9a6d-4653de4ad19b')

      // Submit the form (find the save button - it's the first button in the header)
      const saveButtons = screen.getAllByRole('button')
      const saveButton = saveButtons.find(btn => btn.getAttribute('type') === 'submit') || saveButtons[0]
      await user.click(saveButton)

      // Verify that startingSceneId was included in the submission
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Adventure',
          startingSceneId: '73a86232-3c6e-4f28-9a6d-4653de4ad19b',
        })
      )
    })

    it('should reset form when adventure prop changes', async () => {
      const { rerender } = render(
        <AdventureForm
          adventure={undefined}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Initially should have empty form
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Title/)
        expect(titleInput).toHaveValue('')
      })

      // Rerender with adventure data
      const mockAdventure: Adventure = {
        id: 'adventure-123',
        title: 'Updated Adventure',
        description: 'Updated Description',
        startingSceneId: '37a981cb-495b-4f27-91b2-b1cf838a3223',
        tags: ['updated'],
        status: 'draft',
        author: 'Updated Author',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      rerender(
        <AdventureForm
          adventure={mockAdventure}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Form should be reset with new adventure data
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Title/)
        expect(titleInput).toHaveValue('Updated Adventure')
        
        const dropdown = screen.getByLabelText(/Starting Scene/) as HTMLSelectElement
        expect(dropdown.value).toBe('37a981cb-495b-4f27-91b2-b1cf838a3223')
      })
    })
  })

  describe('Form Validation', () => {
    it('should show validation error for empty title', async () => {
      const user = userEvent.setup()
      
      // Render with an adventure that has an empty title
      const mockAdventure: Adventure = {
        id: 'adventure-123',
        title: '', // Empty title should trigger validation
        description: 'Test Description',
        startingSceneId: undefined,
        tags: ['test'],
        status: 'draft',
        author: 'Test Author',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }

      render(
        <AdventureForm
          adventure={mockAdventure}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      )

      // Try to submit without filling required fields
      const saveButtons = screen.getAllByRole('button')
      const saveButton = saveButtons.find(btn => btn.getAttribute('type') === 'submit') || saveButtons[0]
      await user.click(saveButton)

      // Should show validation error
      await waitFor(() => {
        const errorMessage = screen.getByText(/Title is required/)
        expect(errorMessage).toBeInTheDocument()
      })

      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })
})
