---

# Modular RPG Scene Navigator

### Product Requirements & Architecture Document

---

# 1. Project Overview

## Purpose

The **Modular RPG Scene Navigator** is a Game Master (GM) support application designed to help run branching tabletop RPG adventures composed of modular scenes.

Instead of preparing a rigid linear adventure, the GM constructs an adventure as a **network of scenes** connected by possible exit paths. During play, the GM selects the next scene dynamically based on player decisions and outcomes.

The application provides:

* Adventure authoring
* Scene linking and navigation
* NPC and stat block reference
* Live session note tracking
* Save/resume between sessions
* Automated session summaries
* Adventure completion summaries
* Campaign lore update tracking

The goal is to **support live play**, not replace tabletop gameplay mechanics.

---

# 2. Core Design Philosophy

The system should prioritize:

### Speed During Play

The GM must be able to navigate scenes quickly with minimal clicks.

### Modular Adventure Design

Scenes function as **independent modules** that can connect dynamically.

### GM Control

The system should not attempt to automate the story.
It should provide **tools, not restrictions**.

### Local-First Reliability

The application should work **offline** and avoid reliance on external services.

### Incremental Complexity

Version 1 focuses on core functionality. Advanced features can be added later.

---

# 3. Core Use Cases

## 3.1 Adventure Authoring

The GM can:

* Create a new adventure
* Define scenes
* Link scenes through exit paths
* Define NPCs and stat blocks
* Define narrative elements
* Set the starting scene

---

## 3.2 Live Play Mode

During a session the GM can:

* Load an adventure
* View the current scene
* Display read-aloud text
* Reference NPC stat blocks
* Record notes
* Track decisions and outcomes
* Choose exit paths to move to the next scene

---

## 3.3 Session End

When ending a session:

The system asks:

> Is the adventure complete?

### If NO

* Save current scene
* Save notes and state
* Generate session summary
* Resume next session from this scene

### If YES

* Generate session summary
* Generate adventure summary
* Generate campaign lore updates

---

# 4. Functional Requirements

---

# 4.1 Adventure Management

The system must allow the GM to:

* Create adventures
* Edit adventures
* Duplicate adventures
* Archive adventures
* Delete adventures
* Set starting scene
* Load existing adventures
* Resume unfinished adventures

---

# 4.2 Scene Management

An adventure may contain **any number of scenes**.

Each scene represents a modular gameplay situation.

---

## Scene Core Fields

### Identity

| Field      | Description                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------- |
| Scene ID   | Unique identifier                                                                           |
| Scene Name | Display name                                                                                |
| Scene Type | Exploration, Combat, Social, Travel, Investigation, Puzzle, Hazard, Revelation, Climax, etc |
| Tags       | Freeform keywords                                                                           |

---

### Context

| Field           | Description                  |
| --------------- | ---------------------------- |
| Location        | Where the scene occurs       |
| In-World Time   | Optional time reference      |
| Scene Summary   | Short overview               |
| GM Description  | Intent and internal guidance |
| Read Aloud Text | Narration text               |
| Atmosphere      | Tone or sensory notes        |

---

### Participants

| Field               | Description                |
| ------------------- | -------------------------- |
| NPCs Present        | Characters in scene        |
| Creatures / Enemies | Combatants                 |
| Linked Stat Blocks  | NPC or creature statistics |
| Factions            | Groups involved            |

---

### Gameplay Structure

| Field                | Description                     |
| -------------------- | ------------------------------- |
| Entry Conditions     | Requirements for scene to begin |
| Objectives           | Possible player goals           |
| Complications        | Obstacles                       |
| Secrets / Clues      | Discoverable information        |
| Interactive Elements | Objects, hazards, devices       |
| Failure States       | Costs of failure                |
| Success States       | Rewards or outcomes             |

---

### Flow Control

| Field                | Description          |
| -------------------- | -------------------- |
| Exit Options         | Possible next scenes |
| Default Exit         | Fallback exit        |
| Can End Session Here | Boolean              |

---

### Session Tracking

| Field               | Description        |
| ------------------- | ------------------ |
| GM Notes            | Live notes         |
| Player Decisions    | Important choices  |
| Outcome             | Result of scene    |
| Unresolved Threads  | Hooks for later    |
| Lore Updates        | Campaign effects   |
| Loot / Rewards      | Items gained       |
| World State Changes | Persistent changes |

---

# 4.3 Exit Path System

Scenes can have **multiple exit paths**.

Each exit contains:

| Field             | Description          |
| ----------------- | -------------------- |
| Exit Label        | What the GM clicks   |
| Destination Scene | Scene ID             |
| Condition         | Optional requirement |
| Result Text       | Narrative transition |

Example:

```
Chase the scout → Scene 12
Interrogate the prisoner → Scene 14
Withdraw and regroup → Scene 8
```

---

# 4.4 NPC Management

NPCs should be **centrally managed**.

Each NPC record includes:

| Field       | Description              |
| ----------- | ------------------------ |
| NPC ID      | Unique identifier        |
| Name        | Character name           |
| Role        | Narrative role           |
| Description | Appearance / personality |
| Faction     | Group affiliation        |
| Stat Block  | Combat or skill stats    |
| Notes       | GM notes                 |

Scenes **reference NPCs** instead of duplicating them.

---

# 4.5 Play Mode Features 

During play the GM can:

* View scene information
* Expand or collapse sections
* Open NPC stat blocks
* Enter live notes
* Mark clues discovered
* Track NPC states
* Select exit options
* Move to next scene
* Navigate back/forward through scene history
* Jump to any scene via scene list panel
* See navigation breadcrumb trail
* Track enhanced session state (progress, remaining scenes)

## Enhanced Navigation Features (Beyond Requirements)
* **Navigation History**: Back/forward buttons with proper state management
* **Scene List Panel**: Collapsible panel showing all scenes for quick jumping
* **Breadcrumb Navigation**: Visual path showing navigation through scenes
* **Enhanced Session State**: Navigation position, scenes remaining, progress metrics

Autosave should occur when:

* Notes are updated
* Scene transitions occur

---

# 4.6 Session End Workflow

When ending a session:

### Step 1

Prompt:

```
Is the adventure complete?
[ Yes ] [ No ]
```

---

### If NO

System should:

* Save current scene
* Save notes and state
* Generate session summary

---

### If YES

System should:

* Generate session summary
* Generate adventure summary
* Generate lore update summary

---

# 4.7 Summary Generation

Summaries should be **template generated in V1**.

---

## Session Summary

Includes:

* Adventure title
* Session number
* Date
* Starting scene
* Ending scene
* Major events
* Key player choices
* Combat outcomes
* NPC status changes
* Unresolved threads
* Next likely developments

---

## Adventure Summary

Includes:

* Adventure premise
* Major scenes played
* Key branching decisions
* Major NPC outcomes
* Final results
* Rewards gained
* Open consequences

---

## Lore Update Summary

Includes:

* New NPCs
* New factions
* New locations
* Status changes
* Secrets discovered
* Canon updates
* Future plot hooks

---

# 5. Non-Functional Requirements

---

## Usability

The system must:

* Be usable during live sessions
* Avoid clutter
* Support quick navigation
* Use readable layouts

---

## Reliability

The system must:

* Autosave frequently
* Prevent data loss
* Restore state if application closes unexpectedly

---

## Performance

The system must:

* Load adventures quickly
* Handle large adventures with many scenes

---

## Portability

The system should:

* Work offline
* Store data locally
* Use human-readable formats where possible

---

# 6. Recommended Technical Architecture

---

## Preferred Implementation

**Local-first desktop web application**

---

## Frontend

Recommended stack:

* React
* TypeScript
* React Router
* Zustand or Redux Toolkit
* React Hook Form
* shadcn/ui component library

---

## Backend Options

### Option A (Recommended)

Local desktop app.

Technology:

* React frontend
* Electron or Tauri wrapper
* SQLite database

Advantages:

* Offline
* Simple deployment
* Local performance

---

### Option B

Client-server web app.

Technology:

* React
* Node.js
* Express / Fastify
* SQLite

---

# 7. Data Model

---

## Adventure

| Field           | Description    |
| --------------- | -------------- |
| id              | Unique ID      |
| title           | Adventure name |
| description     | Summary        |
| startingSceneId | Entry scene    |
| currentSceneId  | Resume scene   |
| isComplete      | Boolean        |
| createdAt       | Timestamp      |
| updatedAt       | Timestamp      |

---

## Scene

| Field         | Description        |
| ------------- | ------------------ |
| id            | Scene ID           |
| adventureId   | Parent adventure   |
| name          | Scene name         |
| type          | Scene category     |
| location      | Where scene occurs |
| summary       | Scene overview     |
| readAloudText | Narration          |
| atmosphere    | Tone               |
| objectives    | Goals              |
| complications | Obstacles          |
| clues         | Discoveries        |
| rewards       | Rewards            |
| tags          | Keywords           |

---

## NPC

| Field       | Description            |
| ----------- | ---------------------- |
| id          | NPC ID                 |
| adventureId | Parent adventure       |
| name        | Character name         |
| role        | Narrative role         |
| description | Appearance/personality |
| faction     | Affiliation            |
| statBlock   | Stats                  |
| notes       | GM notes               |

---

## SceneNPC

| Field     | Description     |
| --------- | --------------- |
| id        | Relationship ID |
| sceneId   | Scene           |
| npcId     | NPC             |
| role      | Presence role   |
| isHostile | Boolean         |
| notes     | Notes           |

---

## ExitOption

| Field              | Description        |
| ------------------ | ------------------ |
| id                 | Exit ID            |
| sceneId            | Source scene       |
| label              | Exit label         |
| destinationSceneId | Next scene         |
| conditionText      | Optional condition |
| resultText         | Transition text    |
| sortOrder          | Display order      |

---

## Session

| Field               | Description       |
| ------------------- | ----------------- |
| id                  | Session ID        |
| adventureId         | Adventure         |
| sessionNumber       | Numeric           |
| startedAt           | Start time        |
| endedAt             | End time          |
| startingSceneId     | Scene start       |
| endingSceneId       | Scene end         |
| isAdventureComplete | Boolean           |
| summary             | Generated summary |

---

## SceneRunState

Tracks what happened during play.

| Field              | Description      |
| ------------------ | ---------------- |
| id                 | Record ID        |
| sessionId          | Session          |
| sceneId            | Scene            |
| enteredAt          | Time entered     |
| exitedAt           | Time exited      |
| notes              | Notes            |
| outcome            | Result           |
| chosenExitOptionId | Exit chosen      |
| unresolvedThreads  | Story hooks      |
| loreUpdates        | Campaign changes |

---

## AdventureSummary

| Field          | Description       |
| -------------- | ----------------- |
| id             | Summary ID        |
| adventureId    | Adventure         |
| summaryText    | Narrative summary |
| loreUpdateText | Campaign changes  |
| generatedAt    | Timestamp         |

---

# 8. Key Application Screens

---

## Authoring Screens

* Adventure List
* Adventure Editor
* Scene List
* Scene Editor
* NPC Manager

---

## Play Screens

* Adventure Runner
* Current Scene View
* NPC Drawer
* Session Notes Panel
* Exit Selection Panel
* End Session Dialog

---

## Reporting Screens

* Session Summary Viewer
* Adventure Summary Viewer
* Lore Update Export

---

# 9. UX Design Recommendations

---

## Scene View Layout

Two-panel layout:

Left panel:

* Scene description
* Read-aloud text
* Exits

Right panel:

* NPCs
* Notes
* Stat blocks

---

## Authoring Interface

Support:

* List editing
* Graph visualization of scenes

---

## Safety

Implement:

* Autosave on note changes
* Autosave on scene transitions
* Resume session on restart

---

# 10. Future Enhancements

Potential future features:

* Scene graph visualization
* NPC libraries
* Stat block libraries
* Lore export to Markdown
* AI-assisted summary generation
* Initiative tracker
* Map integration
* Campaign knowledge base
* Search/filter tools

---

# 11. Development Roadmap

---

## Phase 1

Core foundation:

* Project scaffold
* Database schema
* Core data models
* Adventure CRUD
* Scene CRUD
* Scene linking

---

## Phase 2 
Gameplay support:

* Play mode with enhanced navigation
* Notes tracking with GM/player separation
* NPC references with stat blocks
* Exit navigation with scene-to-scene transitions
* Navigation history with back/forward buttons
* Scene list panel for quick jumping
* Breadcrumb navigation trail
* Enhanced session state tracking
* Comprehensive test suite
* Starting scene persistence bug fix

---

## Phase 3

Session features:

* Session tracking
* Resume functionality
* Session summary generation

---

## Phase 4

Completion features:

* Adventure summary
* Lore updates
* Export tools

---

# 12. Key Design Decisions

---

## Scene Structure

Use **hybrid structure**:

* structured fields
* freeform notes

---

## State Tracking

Prefer **manual GM updates** in V1.

Automation can be added later.

---

## Summary Generation

Use **template-based summaries** in V1.

AI generation may be added later.

---

## NPC Storage

Use **central NPC library with scene references**.

Prevents duplication.

---

# End of Document