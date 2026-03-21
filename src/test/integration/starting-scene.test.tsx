import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'
import type { Adventure, Scene } from '@/types'

// Mock the database manager and connections
const mockAdventures: Adventure[] = []
const mockScenes: Scene[] = []

vi.mock('@/database/connection', () => ({
  getDatabaseManager: () => ({
    isReady: () => true,
    getConnection: () => ({
      // Mock AdventureRepository methods
      prepare: vi.fn((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('adventures')) {
          return {
            all: vi.fn(() => mockAdventures.map(a => ({
              id: a.id,
              title: a.title,
              description: a.description,
              starting_scene_id: a.startingSceneId,
              tags: JSON.stringify(a.tags),
              status: a.status,
              author: a.author,
              created_at: a.createdAt,
              updated_at: a.updatedAt
            }))),
            get: vi.fn((id: string) => {
              const adventure = mockAdventures.find(a => a.id === id)
              return adventure ? {
                id: adventure.id,
                title: adventure.title,
                description: adventure.description,
                starting_scene_id: adventure.startingSceneId,
                tags: JSON.stringify(adventure.tags),
                status: adventure.status,
                author: adventure.author,
                created_at: adventure.createdAt,
                updated_at: adventure.updatedAt
              } : undefined
            })
          }
        }
        if (sql.includes('SELECT') && sql.includes('scenes')) {
          return {
            all: vi.fn(() => mockScenes.map(s => ({
              id: s.id,
              name: s.name,
              type: s.type,
              location: s.location,
              tags: JSON.stringify(s.tags),
              summary: s.summary,
              gm_description: s.gmDescription,
              read_aloud: s.readAloud,
              atmosphere: s.atmosphere,
              entry_conditions: JSON.stringify(s.entryConditions),
              objectives: JSON.stringify(s.objectives),
              complications: JSON.stringify(s.complications),
              clues: JSON.stringify(s.clues),
              interactive_elements: JSON.stringify(s.interactiveElements),
              failure_states: JSON.stringify(s.failureStates),
              success_states: JSON.stringify(s.successStates),
              rewards: JSON.stringify(s.rewards),
              factions: JSON.stringify(s.factions),
              can_end_session_here: s.canEndSessionHere ? 1 : 0,
              sort_order: s.sortOrder,
              adventure_id: s.adventureId,
              exit_options: JSON.stringify(s.exitOptions),
              scene_npcs: JSON.stringify(s.sceneNpcRefs),
              created_at: s.createdAt,
              updated_at: s.updatedAt
            }))),
            get: vi.fn((id: string) => {
              const scene = mockScenes.find(s => s.id === id)
              return scene ? {
                id: scene.id,
                name: scene.name,
                type: scene.type,
                adventure_id: scene.adventureId,
                read_aloud: scene.readAloud,
                gm_description: scene.gmDescription
              } : undefined
            })
          }
        }
        if (sql.includes('INSERT') && sql.includes('adventures')) {
          return {
            run: vi.fn((...args) => {
              const [id, title, description, startingSceneId, tags, status, author, createdAt, updatedAt] = args
              mockAdventures.push({
                id,
                title,
                description,
                startingSceneId,
                tags: JSON.parse(tags),
                status,
                author,
                createdAt,
                updatedAt
              })
              return { lastInsertRowid: 0, changes: 1 }
            })
          }
        }
        if (sql.includes('INSERT') && sql.includes('scenes')) {
          return {
            run: vi.fn((...args) => {
              const [id, name, type, location, tags, summary, gmDescription, readAloud, atmosphere, entryConditions, objectives, complications, clues, interactiveElements, failureStates, successStates, rewards, factions, canEndSessionHere, sortOrder, adventureId, exitOptions, sceneNpcs, createdAt, updatedAt] = args
              mockScenes.push({
                id,
                name,
                type,
                location,
                tags: JSON.parse(tags),
                summary,
                gmDescription,
                readAloud,
                atmosphere,
                entryConditions: JSON.parse(entryConditions),
                objectives: JSON.parse(objectives),
                complications: JSON.parse(complications),
                clues: JSON.parse(clues),
                interactiveElements: JSON.parse(interactiveElements),
                failureStates: JSON.parse(failureStates),
                successStates: JSON.parse(successStates),
                rewards: JSON.parse(rewards),
                factions: JSON.parse(factions),
                canEndSessionHere: Boolean(canEndSessionHere),
                sortOrder,
                adventureId,
                exitOptions: JSON.parse(exitOptions),
                sceneNpcRefs: JSON.parse(sceneNpcs),
                createdAt,
                updatedAt
              })
              return { lastInsertRowid: 0, changes: 1 }
            })
          }
        }
        if (sql.includes('UPDATE') && sql.includes('adventures')) {
          return {
            run: vi.fn((...args) => {
              // Extract the ID from the last parameter
              const id = args[args.length - 1]
              const adventureIndex = mockAdventures.findIndex(a => a.id === id)
              if (adventureIndex >= 0) {
                // Update the adventure with new values
                mockAdventures[adventureIndex] = {
                  ...mockAdventures[adventureIndex],
                  title: args[0],
                  description: args[1],
                  startingSceneId: args[2],
                  tags: JSON.parse(args[3]),
                  status: args[4],
                  author: args[5],
                  updatedAt: args[6]
                }
              }
              return { lastInsertRowid: 0, changes: 1 }
            })
          }
        }
        return { run: vi.fn(), all: vi.fn(), get: vi.fn() }
      }),
      exec: vi.fn()
    }),
    autoSave: vi.fn()
  })
}))

describe('Starting Scene Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear mock data
    mockAdventures.length = 0
    mockScenes.length = 0
  })

  it('should save and load starting scene correctly', async () => {
    const user = userEvent.setup()
    
    render(<App />)

    // Step 1: Create an adventure
    await waitFor(() => {
      expect(screen.getByText('Create Adventure')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Create Adventure'))

    // Fill in adventure details
    const titleInput = screen.getByLabelText(/Title/)
    await user.type(titleInput, 'Test Adventure')

    const descriptionInput = screen.getByLabelText(/Description/)
    await user.type(descriptionInput, 'Test Description')

    // Save the adventure
    await user.click(screen.getByRole('button', { name: /save/i }))

    // Step 2: Create scenes for the adventure
    await waitFor(() => {
      expect(screen.getByText('Create Scene')).toBeInTheDocument()
    })

    // Create first scene
    await user.click(screen.getByText('Create Scene'))
    const sceneNameInput = screen.getByLabelText(/Name/)
    await user.type(sceneNameInput, 'Scene 1')
    await user.click(screen.getByRole('button', { name: /save/i }))

    // Create second scene
    await waitFor(() => {
      expect(screen.getByText('Create Scene')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Create Scene'))
    await user.type(screen.getByLabelText(/Name/), 'Scene 2')
    await user.click(screen.getByRole('button', { name: /save/i }))

    // Step 3: Edit the adventure and select starting scene
    await waitFor(() => {
      expect(screen.getByText('Test Adventure')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Edit'))

    // Wait for scenes to load and select starting scene
    await waitFor(() => {
      const dropdown = screen.getByLabelText(/Starting Scene/)
      expect(dropdown).toBeInTheDocument()
    })

    const startingSceneDropdown = screen.getByLabelText(/Starting Scene/)
    await user.selectOptions(startingSceneDropdown, 'Scene 1')

    // Save the adventure with starting scene
    await user.click(screen.getByRole('button', { name: /save/i }))

    // Step 4: Verify starting scene is saved
    await waitFor(() => {
      expect(screen.getByText('Test Adventure')).toBeInTheDocument()
    })

    // Edit again to verify starting scene is preserved
    await user.click(screen.getByText('Edit'))

    await waitFor(() => {
      const dropdown = screen.getByLabelText(/Starting Scene/)
      expect(dropdown).toBeInTheDocument()
    })

    // Should show "Scene 1" as selected
    const dropdown = screen.getByLabelText(/Starting Scene/) as HTMLSelectElement
    expect(dropdown.value).toBe(mockScenes[0].id) // Should be Scene 1's ID
  })

  it('should load starting scene in Play mode', async () => {
    const user = userEvent.setup()
    
    // Set up test data
    const testAdventure: Adventure = {
      id: 'adventure-123',
      title: 'Test Adventure',
      description: 'Test Description',
      startingSceneId: 'scene-123',
      tags: ['test'],
      status: 'draft',
      author: 'Test Author',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    const testScene: Scene = {
      id: 'scene-123',
      name: 'Starting Scene',
      type: 'exploration',
      location: 'Test Location',
      tags: [],
      summary: 'Test Summary',
      gmDescription: 'GM Description',
      readAloud: 'Read Aloud Text',
      atmosphere: 'Test Atmosphere',
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
      sortOrder: 0,
      adventureId: 'adventure-123',
      exitOptions: [],
      sceneNpcRefs: [],
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }

    mockAdventures.push(testAdventure)
    mockScenes.push(testScene)

    render(<App />)

    // Wait for adventure list to load
    await waitFor(() => {
      expect(screen.getByText('Test Adventure')).toBeInTheDocument()
    })

    // Click Play button
    await user.click(screen.getByText('Play'))

    // Should load the starting scene
    await waitFor(() => {
      expect(screen.getByText('Starting Scene')).toBeInTheDocument()
      expect(screen.getByText('Read Aloud Text')).toBeInTheDocument()
      expect(screen.getByText('GM Description')).toBeInTheDocument()
    })
  })
})
