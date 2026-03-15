````markdown
# Developer Handoff Bundle  
## Modular RPG Scene Navigator

---

# 1. Purpose

This document is a consolidated handoff bundle for building the **Modular RPG Scene Navigator**, a local-first GM support application for running branching tabletop RPG adventures composed of linked scenes.

It combines:

- product intent
- scope and requirements
- architecture direction
- data model guidance
- JSON schema guidance
- seed data references
- implementation priorities

This bundle is intended to be handed to either:

- a coding AI
- a solo developer
- a small implementation team

---

# 2. Product Summary

The app is a **scene navigation and session management tool** for tabletop RPG Game Masters.

A GM should be able to:

- create an adventure made of any number of scenes
- define branching exits from each scene
- manage NPCs and stat blocks
- run the adventure live during play
- take notes during scenes
- pause at any scene
- resume later from the same point
- generate session summaries
- generate adventure summaries
- generate lore update summaries for campaign canon

This is **not** intended to be:

- a full VTT
- a combat automation engine
- a rules adjudication engine
- a multiplayer collaboration platform in V1

---

# 3. Product Goals

## Primary Goal

Support live GM play for branching, modular adventures.

## Secondary Goals

- preserve adventure structure cleanly
- make session pause/resume reliable
- produce useful summaries after play
- keep adventure data portable and durable
- allow import/export through stable JSON files

---

# 4. Version 1 Scope

## In Scope

- Adventure CRUD
- Scene CRUD
- NPC CRUD
- Branching exits
- Starting scene selection
- Play mode
- Live scene notes
- Session save/resume
- Deterministic summary generation
- JSON import/export
- Local-first persistence

## Out of Scope

- Cloud sync
- Multiplayer collaboration
- Initiative tracking
- Combat automation
- Map/VTT integration
- AI-generated summaries
- Campaign-wide lore database beyond exported summaries

---

# 5. Functional Requirements

---

## 5.1 Adventure Management

The system must allow the user to:

- create adventures
- edit adventures
- duplicate adventures
- archive adventures
- delete adventures
- set a starting scene
- mark adventure status as:
  - draft
  - active
  - archived
  - completed
- resume unfinished adventures from the last active scene

---

## 5.2 Scene Management

Each adventure may contain an indefinite number of scenes.

Each scene should support:

### Identity
- `id`
- `name`
- `type`
- `tags`

### Context
- `location`
- `inWorldTime` (optional)
- `summary`
- `gmDescription`
- `readAloud`
- `atmosphere`

### Participants
- `sceneNpcRefs`
- `factions`

### Gameplay Structure
- `entryConditions`
- `objectives`
- `complications`
- `clues`
- `interactiveElements`
- `failureStates`
- `successStates`
- `rewards`

### Flow Control
- `exitOptions`
- `canEndSessionHere`
- `sortOrder`

### Runtime / Session-Oriented Fields
These should generally be stored in session state, not permanent authored scene definition:

- `gmNotes`
- `playerDecisions`
- `outcome`
- `unresolvedThreads`
- `loreUpdates`
- `lootAndRewards`
- `worldStateChanges`

---

## 5.3 NPC Management

NPCs should be centrally managed per adventure.

Each NPC should support:

- `id`
- `name`
- `role`
- `description`
- `faction`
- `statBlock`
- `notes`
- `tags`

Scenes should reference NPCs instead of duplicating them.

---

## 5.4 Exit Path / Branching System

Each scene may have multiple exit options.

Each exit option should support:

- `id`
- `label`
- `destinationSceneId`
- `conditionText`
- `resultText`
- `stateChanges`
- `sortOrder`

---

## 5.5 Play Mode

When running an adventure, the GM should be able to:

- load the adventure
- display the current scene
- view read-aloud text prominently
- open NPC details and stat blocks quickly
- add live notes
- record player decisions and outcomes
- choose an exit path
- move to the next scene
- autosave on change and transition

---

## 5.6 Session End Workflow

The GM should be able to end the session from any scene.

Prompt:

- **Is the adventure complete?**
  - Yes
  - No

### If No
- save current scene as resume point
- save runtime state
- generate session summary

### If Yes
- save final runtime state
- generate session summary
- generate adventure summary
- generate lore updates summary
- mark adventure complete

---

## 5.7 Resume Behavior

When reopening an unfinished adventure:

- resume at the last active scene
- show recent session context if available

---

## 5.8 Summary Generation

Version 1 should use deterministic template-based summary generation.

Generate:

- session summary
- adventure summary
- lore update summary

---

# 6. UX Priorities

The UI should be optimized for **live GM use at the table**.

## Most Important Play-Mode Fields
These should be immediately visible:

- scene name
- scene type
- location
- summary
- read-aloud text
- NPCs present
- exit options
- live notes

## Secondary / Collapsible Sections
These can be collapsible:

- objectives
- complications
- clues
- rewards
- lore updates
- world state changes

## Reliability
The UI should support:

- autosave
- reliable resume
- safe transitions
- minimal click count

---

# 7. Recommended Architecture

## Preferred Technical Stack

- React
- TypeScript
- Vite
- Zustand
- React Hook Form
- shadcn/ui
- SQLite
- Zod

## Packaging Recommendation

Preferred target:

- desktop-friendly local-first app

Recommended evolution:

1. build as local-first web app
2. wrap with Electron or Tauri later if needed

This reduces early complexity while preserving desktop viability.

---

# 8. Architectural Layers

## 8.1 UI Layer
Responsible for:

- adventure authoring screens
- scene editor
- NPC editor
- play mode
- session-end flow
- summary display

## 8.2 Domain Layer
Responsible for:

- TypeScript domain models
- validation schemas
- summary generation rules
- scene transition logic
- import/export mapping

## 8.3 Persistence Layer
Responsible for:

- SQLite schema
- database initialization
- repositories / data access
- session state storage

## 8.4 Import / Export Layer
Responsible for:

- reading adventure JSON
- reading session JSON
- validating imported files
- exporting deterministic pretty-printed JSON

---

# 9. Authored Data vs Runtime Data

This separation is critical.

## Authored Data
Permanent adventure definition:

- adventure metadata
- scene definitions
- NPC definitions
- exit links

## Runtime Data
What actually happened during play:

- scene notes
- player decisions
- outcomes
- unresolved threads
- lore updates
- chosen exits
- current scene
- session summaries

Do **not** mix these together casually.

The authored adventure file should stay reusable.  
The session file should track actual play state.

---

# 10. Core Data Entities

Minimum entities:

- `Adventure`
- `Scene`
- `NPC`
- `SceneNpcRef`
- `ExitOption`
- `Session`
- `SceneRunState`
- `AdventureSummary`

---

# 11. JSON File Strategy

There should be at least two file types.

## 11.1 Adventure Definition File

Example filename:

```text
old_necropolis_patrol.adventure.json
````

Stores:

* adventure metadata
* scenes
* NPCs

## 11.2 Session State File

Example filename:

```text
old_necropolis_patrol.session.json
```

Stores:

* current session state
* current scene
* scene run history
* summary data

This separation preserves portability and reuse.

---

# 12. JSON File Shapes

## Adventure File Shape

```json
{
  "schemaVersion": "1.0",
  "fileType": "adventure",
  "adventure": {},
  "npcs": [],
  "scenes": []
}
```

## Session File Shape

```json
{
  "schemaVersion": "1.0",
  "fileType": "session",
  "session": {},
  "sceneRunStates": []
}
```

---

# 13. Validation Rules

At minimum:

* `schemaVersion` must exist
* `fileType` must be `adventure` or `session`
* IDs must be unique
* `startingSceneId` must refer to an existing scene
* every `destinationSceneId` must refer to an existing scene
* every `npcId` in a scene reference must refer to an existing NPC
* import errors should be clear and user-facing

---

# 14. Recommended Enum Values

## Scene Types

* `exploration`
* `social`
* `combat`
* `travel`
* `investigation`
* `puzzle`
* `hazard`
* `transition`
* `revelation`
* `downtime`
* `climax`
* `other`

## Adventure Status

* `draft`
* `active`
* `archived`
* `completed`

---

# 15. SQLite Persistence Expectations

The relational schema should align closely with the JSON model.

Recommended tables:

* `adventures`
* `scenes`
* `npcs`
* `scene_npcs`
* `exit_options`
* `sessions`
* `scene_run_states`
* `summaries` or separate summary tables if desired

The schema should be:

* easy to query
* easy to evolve
* aligned with import/export structures

---

# 16. Suggested Folder Structure

```text
project-root/
  docs/
    product_requirements.md
    json_schema_spec.md
    developer_handoff_bundle.md
    coding_ai_build_prompt.md

  examples/
    seed_adventure_old_necropolis.adventure.json
    seed_adventure_old_necropolis.session.json

  src/
    app/
    components/
    features/
      adventures/
      scenes/
      npcs/
      play/
      sessions/
      summaries/
      import-export/
    domain/
      types/
      schemas/
      services/
    lib/
      db/
      repositories/
      utils/
    routes/

  public/
  package.json
```

---

# 17. Seed Data Included

Two seed files are already defined for development and testing.

## Seed Adventure File

```text
examples/seed_adventure_old_necropolis.adventure.json
```

Use it to test:

* adventure import
* scene rendering
* NPC references
* branching exits
* play mode navigation
* end-session nodes
* adventure completion

## Seed Session File

```text
examples/seed_adventure_old_necropolis.session.json
```

Use it to test:

* resume behavior
* current scene loading
* prior scene history
* session summary rendering
* unfinished-adventure flow

---

# 18. Implementation Priorities

## Phase 1: Foundation

Build:

* project scaffold
* folder structure
* TypeScript domain types
* Zod schemas
* SQLite schema
* DB init
* repositories / data layer
* adventure CRUD
* scene CRUD
* NPC CRUD
* exit CRUD
* starting scene selection

## Phase 2: Authoring UI

Build:

* adventure list
* adventure editor
* scene list/editor
* NPC manager
* exit editor
* validation handling

## Phase 3: Play Mode

Build:

* current scene view
* NPC stat block display
* notes panel
* exit selection
* scene transition handling
* autosave

## Phase 4: Session Management

Build:

* session start
* session end flow
* resume behavior
* scene run state persistence
* session history

## Phase 5: Summary Generation

Build:

* deterministic session summary builder
* deterministic adventure summary builder
* deterministic lore update summary builder
* summary display/export

## Phase 6: JSON Import / Export

Build:

* export adventure JSON
* export session JSON
* import adventure JSON
* import session JSON
* validation errors

## Phase 7: Polish

Build:

* collapsible sections
* keyboard shortcuts
* better error states
* seed adventure import shortcut
* prep for desktop packaging

---

# 19. Explicit Design Guidance

## Stable IDs

IDs must remain stable once created.

## Hybrid Structure

Use structured fields plus freeform notes.

## Manual State Tracking

Do not over-automate. Let the GM confirm or enter outcomes manually.

## Deterministic Summaries

Use templates, not AI APIs, in V1.

## Keep Business Logic Testable

Avoid burying domain logic directly in UI components.

---

# 20. Recommended First Build Prompt

Use this as the implementation kickoff instruction:

```text
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
```

---

# 21. Definition of Done for Early Milestone

A strong early milestone is reached when the app can:

* create an adventure
* create scenes
* create NPCs
* link scenes via exits
* set a starting scene
* import the seed adventure
* load the seed adventure
* render a current scene in play mode
* open NPC details
* choose an exit and transition
* save runtime state
* resume from session state

---

# 22. Notes for Human Developers

The app should optimize for **clarity and reliability**, not novelty.

The most likely failure modes are:

* mixing authored and runtime data
* overcomplicating the model too early
* building UI before stabilizing the domain model
* making JSON import/export an afterthought

Avoid those mistakes and the project should stay manageable.

---

# 23. Notes for Coding AI

When implementing:

* choose sensible defaults and move forward
* do not stall in analysis
* keep architecture modular
* keep JSON shape aligned with code
* keep the storage model consistent with the schema
* preserve stable IDs
* prioritize a usable Phase 1 over an over-designed foundation

---

# 24. Attached / Referenced Artifacts

This bundle assumes the following companion docs/files exist:

```text
docs/
  product_requirements.md
  json_schema_spec.md
  coding_ai_build_prompt.md
  developer_handoff_bundle.md

examples/
  seed_adventure_old_necropolis.adventure.json
  seed_adventure_old_necropolis.session.json
```
