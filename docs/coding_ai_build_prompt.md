# Combined Build Prompt for Coding AI

### Markdown Document

---

# Purpose

Use the following prompt as a **single, consolidated build brief** for a coding AI such as Claude, ChatGPT, Cursor, Windsurf, or another implementation-oriented assistant.

This prompt combines:

* product intent
* app requirements
* architecture recommendations
* data model expectations
* JSON adventure/schema requirements
* phased build instructions

It is designed to reduce ambiguity and help the coding AI move directly into implementation.

---

# Copy/Paste Prompt

````text
I want you to help me design and build a local-first desktop-friendly application for running branching tabletop RPG adventures during live play.

The app is for a Game Master running modular adventures composed of linked scenes. During a session, I want to start on one scene, track what happens, then choose the next scene based on player decisions and outcomes. I want to be able to pause at any scene, resume later from that point, and generate summaries when the session ends or when the adventure is completed.

Do not stop to ask clarifying questions unless absolutely necessary. Where requirements are ambiguous, make sensible defaults and continue. Prefer practical implementation over abstract discussion.

---

## Product Goal

Build a GM support app that allows me to:

- Create adventures composed of an indefinite number of scenes
- Define scene metadata and branching exits
- Manage NPCs and associated stat blocks
- Run adventures during live play from one scene to the next
- Enter live notes during scenes
- Open NPC stat blocks quickly while playing
- End a session at any scene
- Save and resume incomplete adventures
- Generate structured session summaries
- Generate final adventure summaries
- Generate lore update summaries for campaign canon

This is not a rules engine or VTT. It is a scene-navigation and session-management tool for a GM.

---

## Version 1 Scope

### In Scope
- Adventure CRUD
- Scene CRUD
- NPC CRUD
- Branching exit links between scenes
- Starting scene selection
- Play mode for scene navigation
- Live notes and outcome tracking
- Save/resume current progress
- Template-based summary generation
- Import/export via JSON files
- Local-first persistence

### Out of Scope for V1
- Multiplayer collaboration
- Cloud sync
- Combat automation
- Initiative tracking
- Maps/VTT integration
- AI-generated summaries inside the app
- Campaign-wide lore database beyond exported summaries

---

## Technical Direction

Build this as a local-first single-user application.

### Preferred Stack
- React
- TypeScript
- Vite
- Zustand for state management
- React Hook Form for forms
- shadcn/ui for components
- Electron or Tauri wrapper for desktop use
- SQLite for persistence
- Better-sqlite3 or equivalent SQLite library
- Zod for validation
- React Router if route-based UI is useful

If Electron/Tauri complicates initial delivery too much, start with a web app architecture that can be wrapped later, but keep file and persistence structure compatible with desktop packaging.

---

## Core Product Requirements

### 1. Adventure Management
The app must allow the user to:
- Create an adventure
- Edit an adventure
- Duplicate an adventure
- Delete or archive an adventure
- Set a starting scene
- Mark an adventure as draft, active, archived, or completed
- Load an existing adventure
- Resume an unfinished adventure at the last active scene

### 2. Scene Management
Each adventure can contain any number of scenes.

Each scene should support these fields:

#### Identity
- id
- name
- type
- tags

#### Context
- location
- inWorldTime (optional)
- summary
- gmDescription
- readAloud
- atmosphere

#### Participants
- NPC references
- factions
- linked stat blocks through NPCs

#### Gameplay Structure
- entryConditions
- objectives
- complications
- clues
- interactiveElements
- failureStates
- successStates
- rewards

#### Flow Control
- exitOptions
- canEndSessionHere
- sortOrder

#### Session Tracking / Runtime-Friendly Fields
- gmNotes
- playerDecisions
- outcome
- unresolvedThreads
- loreUpdates
- lootAndRewards
- worldStateChanges

### 3. NPC Management
NPCs should be centrally managed per adventure.

Each NPC should include:
- id
- name
- role
- description
- faction
- statBlock
- notes
- tags

Scenes should reference NPCs instead of duplicating them.

### 4. Exit Paths / Branching
Each scene can have multiple exits.

Each exit should include:
- id
- label
- destinationSceneId
- conditionText (optional)
- resultText (optional)
- stateChanges (optional)
- sortOrder

### 5. Play Mode
When running an adventure:
- Load the adventure
- Display the current scene
- Show scene content in a GM-friendly layout
- Show read-aloud text distinctly
- Allow opening NPC details/stat blocks quickly
- Allow entering live notes
- Allow marking decisions and outcomes
- Allow selecting an exit to move to the next scene
- Autosave on note changes and transitions

### 6. Session End Workflow
I should be able to end the session from any scene.

When ending the session, prompt:
- Is the adventure complete? Yes / No

If No:
- Save current scene as the resume point
- Save current runtime state
- Generate a session summary

If Yes:
- Save final runtime state
- Generate a session summary
- Generate an adventure summary
- Generate a lore updates summary
- Mark the adventure completed

### 7. Resume Behavior
When reopening an unfinished adventure:
- resume at the last active scene
- show most recent session context if available

### 8. Summary Generation
Use deterministic template-based summary generation in V1.

Generate:
- session summary
- adventure summary
- lore updates summary

---

## UX Guidance

The UI should be optimized for live GM use.

### Scene View
Use a two-panel or three-panel layout where practical:
- main scene content
- supporting NPC/stat block panel
- notes / runtime tracking panel

### Prioritization
Make these fields highly visible in play mode:
- scene name
- type
- location
- summary
- read-aloud
- NPCs present
- exits
- live notes

Less-critical sections can be collapsible:
- objectives
- complications
- clues
- rewards
- lore updates
- world state changes

### Safety and Reliability
Implement:
- autosave on changes
- autosave on scene transition
- session restore after unexpected close if possible

---

## Data Model Expectations

At minimum, define types and storage for:

- Adventure
- NPC
- Scene
- SceneNpcRef
- ExitOption
- Session
- SceneRunState
- AdventureSummary

Use strong TypeScript types and runtime validation with Zod.

---

## JSON Adventure Format Requirement

I want the app to support import/export using a portable JSON file format.

There should be at least two file types:

### Adventure Definition File
Stores static adventure content.

Example filename:
old_necropolis_patrol.adventure.json

### Session State File
Stores runtime progress and session history.

Example filename:
old_necropolis_patrol.session.json

Keep definition data separate from runtime state.

---

## JSON Schema / Shape Requirements

### Adventure File Shape
```json
{
  "schemaVersion": "1.0",
  "fileType": "adventure",
  "adventure": {},
  "npcs": [],
  "scenes": []
}
````

### Session File Shape

```json
{
  "schemaVersion": "1.0",
  "fileType": "session",
  "session": {},
  "sceneRunStates": []
}
```

### Adventure Object Fields

* id
* title
* description
* startingSceneId
* tags
* status
* author
* createdAt
* updatedAt

### NPC Object Fields

* id
* name
* role
* description
* faction
* statBlock
* notes
* tags

### Scene Object Fields

* id
* name
* type
* location
* tags
* summary
* gmDescription
* readAloud
* atmosphere
* entryConditions
* objectives
* complications
* clues
* interactiveElements
* failureStates
* successStates
* rewards
* factions
* sceneNpcRefs
* exitOptions
* canEndSessionHere
* sortOrder

### Scene NPC Ref Fields

* npcId
* presenceRole
* isHostile
* notes

### Exit Option Fields

* id
* label
* destinationSceneId
* conditionText
* resultText
* stateChanges
* sortOrder

### Session Object Fields

* id
* adventureId
* sessionNumber
* startedAt
* endedAt
* startingSceneId
* currentSceneId
* endingSceneId
* isAdventureComplete
* summary

### SceneRunState Fields

* sceneId
* enteredAt
* exitedAt
* notes
* playerDecisions
* outcome
* chosenExitOptionId
* unresolvedThreads
* loreUpdates
* npcStateChanges
* lootAndRewards
* worldStateChanges

---

## Validation Rules

Implement validation for:

* schemaVersion presence
* fileType is adventure or session
* unique IDs for entities
* startingSceneId references a valid scene
* destinationSceneId references a valid scene
* npcId references a valid NPC
* invalid imports should produce clear user-facing errors

---

## Recommended Enum Values

### Scene Types

* exploration
* social
* combat
* travel
* investigation
* puzzle
* hazard
* transition
* revelation
* downtime
* climax
* other

### Adventure Status

* draft
* active
* archived
* completed

---

## Database Expectations

Use SQLite for persistence.

I want you to:

1. Propose the relational schema
2. Keep it aligned with the JSON import/export model
3. Handle relationships cleanly between:

   * adventures
   * scenes
   * npcs
   * scene_npcs
   * exit_options
   * sessions
   * scene_run_states
   * summaries if needed

Prefer a schema that is easy to query and easy to evolve.

---

## Architecture Expectations

Please define:

1. overall application architecture
2. folder structure
3. frontend architecture
4. persistence/data access layer
5. import/export layer
6. summary generation layer
7. how runtime state differs from authored adventure data

---

## Output Expectations

I want you to build this in phases.

For each phase:

* explain the goal
* list the files to create or modify
* provide the code
* explain how the pieces connect
* keep moving forward rather than stalling in analysis

Do not just discuss the design. Begin implementation.

---

## Phased Build Plan

### Phase 1: Foundation

Implement:

* project scaffold
* folder structure
* TypeScript domain types
* Zod schemas
* SQLite schema
* database initialization
* repository/data access layer
* adventure CRUD
* scene CRUD
* NPC CRUD
* exit option CRUD
* starting scene selection

### Phase 2: Authoring UI

Implement:

* adventure list screen
* adventure editor
* scene list/editor
* NPC manager
* exit editor
* basic validation in forms

### Phase 3: Play Mode

Implement:

* current scene display
* live notes
* NPC stat block drawer/modal
* exit selection
* scene transition handling
* autosave

### Phase 4: Session Management

Implement:

* start session
* end session flow
* resume from last scene
* scene run state storage
* session history

### Phase 5: Summary Generation

Implement:

* deterministic session summary builder
* deterministic adventure summary builder
* deterministic lore update summary builder
* summary display/export

### Phase 6: JSON Import/Export

Implement:

* export adventure to JSON
* export session state to JSON
* import adventure JSON with validation
* import session JSON with validation
* clear user-facing error reporting

### Phase 7: Polish

Implement:

* usability improvements
* collapsible sections
* keyboard shortcuts where useful
* error states
* seed example adventure
* preparation for desktop packaging

---

## Practical Development Preferences

* Prefer clean, readable code over clever code
* Use strongly typed interfaces
* Use Zod validation at boundaries
* Keep UI components modular
* Separate domain logic from UI logic
* Keep business logic testable
* Add comments where they improve maintainability
* Use sensible naming and folder organization
* Make import/export deterministic and stable
* Pretty-print JSON exports

---

## Important Design Guidance

### Separation of Authored Data vs Runtime Data

Keep authored adventure content separate from runtime session data.
Do not mix permanent scene definition with what happened in a specific play session.

### Stable IDs

IDs must remain stable after creation so imports/exports and references stay reliable.

### Hybrid Structure

Use structured fields plus freeform notes instead of trying to rigidly encode every storytelling detail.

### Manual State Tracking in V1

Do not over-automate. Let the GM enter or confirm important state changes manually.

### Summary Generation

Use deterministic template logic, not AI APIs.

---

## Final Instruction

Start with Phase 1 immediately.

I want:

1. a proposed folder structure
2. the core TypeScript types
3. Zod schemas
4. SQLite schema
5. a repository/data layer
6. starter code for CRUD operations
7. the first UI shell for managing adventures/scenes/NPCs

Be implementation-oriented and concrete.

````