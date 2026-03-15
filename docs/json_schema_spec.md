# Scene Data Schema + JSON Adventure Format

### Markdown Specification (V1)

---

# 1. Purpose

This document defines a **portable JSON file format** for RPG adventures built from modular scenes.

The format is intended to support:

* authoring adventures outside the app
* importing adventures into the app
* exporting adventures from the app
* preserving adventures independently of the database
* version control with Git
* future integrations with other tools

This schema is designed for **Version 1** of the Modular RPG Scene Navigator and emphasizes:

* readability
* extensibility
* deterministic structure
* easy validation

---

# 2. Design Principles

## 2.1 Human-Readable

The format should be understandable and editable by a GM.

## 2.2 Stable IDs

All major entities should use stable IDs so scenes, NPCs, and exits can reference one another safely.

## 2.3 Separation of Definition and Runtime State

Adventure content should be kept separate from session-specific state.

## 2.4 Extensible

The format should allow later additions without breaking the core structure.

---

# 3. File Types

V1 should support two main JSON file types:

## 3.1 Adventure Definition File

Stores the adventure itself.

Example:

```text
old_necropolis_patrol.adventure.json
```

## 3.2 Session State File

Stores where play currently stands.

Example:

```text
old_necropolis_patrol.session.json
```

This separation is recommended because:

* the adventure file remains clean and reusable
* the session file tracks current progress
* completed adventures can still preserve play history separately

---

# 4. Top-Level Adventure File Structure

```json
{
  "schemaVersion": "1.0",
  "fileType": "adventure",
  "adventure": {},
  "npcs": [],
  "scenes": []
}
```

---

# 5. Adventure Object

The `adventure` object stores module-level metadata.

## Fields

| Field             | Type     | Required | Description                        |
| ----------------- | -------- | -------: | ---------------------------------- |
| `id`              | string   |      yes | Unique adventure ID                |
| `title`           | string   |      yes | Adventure title                    |
| `description`     | string   |       no | Brief summary                      |
| `startingSceneId` | string   |      yes | ID of the first scene              |
| `tags`            | string[] |       no | Keywords                           |
| `status`          | string   |       no | draft, active, archived, completed |
| `author`          | string   |       no | Creator name                       |
| `createdAt`       | string   |       no | ISO timestamp                      |
| `updatedAt`       | string   |       no | ISO timestamp                      |

## Example

```json
{
  "id": "old_necropolis_patrol",
  "title": "Old Necropolis Patrol",
  "description": "A branching pursuit-and-withdrawal scenario in the Old Necropolis.",
  "startingSceneId": "scene_collapsed_chamber",
  "tags": ["necropolis", "patrol", "combat", "investigation"],
  "status": "active",
  "author": "Bill Eastman",
  "createdAt": "2026-03-14T11:00:00Z",
  "updatedAt": "2026-03-14T11:00:00Z"
}
```

---

# 6. NPC Object

NPCs are centrally defined and then referenced by scenes.

## Fields

| Field         | Type     | Required | Description            |
| ------------- | -------- | -------: | ---------------------- |
| `id`          | string   |      yes | Unique NPC ID          |
| `name`        | string   |      yes | Display name           |
| `role`        | string   |       no | Narrative role         |
| `description` | string   |       no | Appearance/personality |
| `faction`     | string   |       no | Faction name           |
| `statBlock`   | object   |       no | Structured stat block  |
| `notes`       | string   |       no | GM notes               |
| `tags`        | string[] |       no | Keywords               |

## Example

```json
{
  "id": "npc_ilya",
  "name": "Ilya",
  "role": "Retreating patrol leader",
  "description": "A sharp-voiced survivor trying to preserve the rest of the patrol.",
  "faction": "Necropolis Patrol",
  "statBlock": {
    "system": "custom",
    "summary": "Lightly armored skirmisher with whistle signal and crossbow support."
  },
  "notes": "Called Verrin's name before ordering the retreat.",
  "tags": ["patrol", "leader"]
}
```

---

# 7. Scene Object

Scenes are the core building blocks of the adventure.

## Fields

| Field                 | Type     | Required | Description                          |
| --------------------- | -------- | -------: | ------------------------------------ |
| `id`                  | string   |      yes | Unique scene ID                      |
| `name`                | string   |      yes | Scene name                           |
| `type`                | string   |      yes | Scene category                       |
| `location`            | string   |       no | Scene location                       |
| `tags`                | string[] |       no | Keywords                             |
| `summary`             | string   |       no | Short overview                       |
| `gmDescription`       | string   |       no | Internal GM guidance                 |
| `readAloud`           | string   |       no | Read-aloud text                      |
| `atmosphere`          | string   |       no | Tone notes                           |
| `entryConditions`     | string[] |       no | Conditions for entering              |
| `objectives`          | string[] |       no | Scene goals                          |
| `complications`       | string[] |       no | Obstacles                            |
| `clues`               | string[] |       no | Discoverable information             |
| `interactiveElements` | string[] |       no | Props, hazards, interactables        |
| `failureStates`       | string[] |       no | Failure outcomes                     |
| `successStates`       | string[] |       no | Success outcomes                     |
| `rewards`             | string[] |       no | Loot, intel, advantages              |
| `factions`            | string[] |       no | Involved factions                    |
| `sceneNpcRefs`        | array    |       no | Linked NPC references                |
| `exitOptions`         | array    |      yes | Branching exits                      |
| `canEndSessionHere`   | boolean  |       no | Whether session may safely stop here |
| `sortOrder`           | number   |       no | Authoring convenience only           |

---

# 8. Scene NPC Reference Object

A scene references NPCs through `sceneNpcRefs`.

## Fields

| Field          | Type    | Required | Description                         |
| -------------- | ------- | -------: | ----------------------------------- |
| `npcId`        | string  |      yes | Referenced NPC ID                   |
| `presenceRole` | string  |       no | How the NPC functions in this scene |
| `isHostile`    | boolean |       no | Current hostility default           |
| `notes`        | string  |       no | Scene-specific notes                |

## Example

```json
{
  "npcId": "npc_ilya",
  "presenceRole": "retreating leader",
  "isHostile": true,
  "notes": "Attempts to withdraw rather than hold ground."
}
```

---

# 9. Exit Option Object

Each scene contains one or more exits.

## Fields

| Field                | Type     | Required | Description                     |
| -------------------- | -------- | -------: | ------------------------------- |
| `id`                 | string   |      yes | Unique exit ID within adventure |
| `label`              | string   |      yes | What the GM selects             |
| `destinationSceneId` | string   |      yes | Next scene ID                   |
| `conditionText`      | string   |       no | Optional availability condition |
| `resultText`         | string   |       no | Transition text                 |
| `stateChanges`       | string[] |       no | Manual state reminders          |
| `sortOrder`          | number   |       no | Display order                   |

## Example

```json
{
  "id": "exit_pursue_patrol",
  "label": "Pursue the retreating patrol",
  "destinationSceneId": "scene_fallback_berm",
  "conditionText": "Available if the party chooses immediate pursuit.",
  "resultText": "The party drives forward over broken stone in pursuit of the withdrawing survivors.",
  "stateChanges": [
    "Mark patrol as scattered",
    "Mark reinforcements as incoming"
  ],
  "sortOrder": 1
}
```

---

# 10. Recommended Scene Type Values

Use controlled values in V1 where possible:

```json
[
  "exploration",
  "social",
  "combat",
  "travel",
  "investigation",
  "puzzle",
  "hazard",
  "transition",
  "revelation",
  "downtime",
  "climax",
  "other"
]
```

---

# 11. Recommended Adventure Status Values

```json
[
  "draft",
  "active",
  "archived",
  "completed"
]
```

---

# 12. Full Adventure Example

```json
{
  "schemaVersion": "1.0",
  "fileType": "adventure",
  "adventure": {
    "id": "old_necropolis_patrol",
    "title": "Old Necropolis Patrol",
    "description": "A modular branching encounter involving a retreating patrol and approaching reinforcements.",
    "startingSceneId": "scene_collapsed_chamber",
    "tags": ["necropolis", "combat", "pursuit"],
    "status": "active",
    "author": "Bill Eastman"
  },
  "npcs": [
    {
      "id": "npc_ilya",
      "name": "Ilya",
      "role": "Patrol survivor",
      "description": "A hard-pressed retreat leader trying to preserve the surviving fighters.",
      "faction": "Necropolis Patrol",
      "statBlock": {
        "system": "custom",
        "summary": "Light skirmisher leader."
      },
      "notes": "Called out Verrin's name before ordering the retreat."
    },
    {
      "id": "npc_verrin",
      "name": "Verrin",
      "role": "Fallen patrol fighter",
      "description": "A tough frontline patrol member killed early in the engagement.",
      "faction": "Necropolis Patrol",
      "statBlock": {
        "system": "custom",
        "summary": "Frontline melee bruiser."
      }
    }
  ],
  "scenes": [
    {
      "id": "scene_collapsed_chamber",
      "name": "Collapsed Chamber Skirmish",
      "type": "combat",
      "location": "Old Necropolis - Rubble Chamber",
      "tags": ["opening", "retreat", "combat"],
      "summary": "The patrol breaks contact while the PCs press the attack.",
      "gmDescription": "Opening combat scene transitioning into pursuit or regrouping.",
      "readAloud": "Dust drifts through the chamber as armed figures scramble backward over the rubble berm.",
      "atmosphere": "Dim light, confusion, immediate tactical urgency.",
      "objectives": [
        "Defeat or pressure the patrol",
        "Decide whether to pursue, search, or regroup"
      ],
      "complications": [
        "Limited visibility",
        "Reinforcements have already been signaled"
      ],
      "clues": [
        "The enemy is not making a final stand",
        "The retreat is organized, not panicked"
      ],
      "factions": ["Necropolis Patrol"],
      "sceneNpcRefs": [
        {
          "npcId": "npc_ilya",
          "presenceRole": "retreating leader",
          "isHostile": true
        },
        {
          "npcId": "npc_verrin",
          "presenceRole": "fallen combatant",
          "isHostile": true
        }
      ],
      "exitOptions": [
        {
          "id": "exit_pursue_patrol",
          "label": "Pursue the retreating patrol",
          "destinationSceneId": "scene_fallback_berm",
          "conditionText": "Choose immediate pursuit.",
          "resultText": "The party surges after the surviving patrol members.",
          "sortOrder": 1
        },
        {
          "id": "exit_search_chamber",
          "label": "Search the chamber before moving",
          "destinationSceneId": "scene_aftermath_search",
          "conditionText": "Choose caution over pursuit.",
          "resultText": "The party pauses to inspect the chamber and fallen enemy.",
          "sortOrder": 2
        }
      ],
      "canEndSessionHere": true,
      "sortOrder": 1
    }
  ]
}
```

---

# 13. Session State File Structure

The session file stores runtime progress.

```json
{
  "schemaVersion": "1.0",
  "fileType": "session",
  "session": {},
  "sceneRunStates": []
}
```

---

# 14. Session Object

## Fields

| Field                 | Type    | Required | Description                  |
| --------------------- | ------- | -------: | ---------------------------- |
| `id`                  | string  |      yes | Unique session ID            |
| `adventureId`         | string  |      yes | Linked adventure             |
| `sessionNumber`       | number  |      yes | Session number               |
| `startedAt`           | string  |       no | ISO timestamp                |
| `endedAt`             | string  |       no | ISO timestamp                |
| `startingSceneId`     | string  |      yes | Starting scene               |
| `currentSceneId`      | string  |      yes | Current or ending scene      |
| `endingSceneId`       | string  |       no | Final scene at session close |
| `isAdventureComplete` | boolean |      yes | Adventure completion status  |
| `summary`             | string  |       no | Session summary text         |

---

# 15. Scene Run State Object

Stores what actually happened in each played scene.

## Fields

| Field                | Type     | Required | Description                |
| -------------------- | -------- | -------: | -------------------------- |
| `sceneId`            | string   |      yes | Referenced scene           |
| `enteredAt`          | string   |       no | ISO timestamp              |
| `exitedAt`           | string   |       no | ISO timestamp              |
| `notes`              | string   |       no | GM notes                   |
| `playerDecisions`    | string[] |       no | Important decisions        |
| `outcome`            | string   |       no | Scene result               |
| `chosenExitOptionId` | string   |       no | Selected exit              |
| `unresolvedThreads`  | string[] |       no | Carried-forward issues     |
| `loreUpdates`        | string[] |       no | Canon-impacting updates    |
| `npcStateChanges`    | string[] |       no | Deaths, escapes, alliances |
| `lootAndRewards`     | string[] |       no | Gains                      |
| `worldStateChanges`  | string[] |       no | Persistent effects         |

---

# 16. Session Example

```json
{
  "schemaVersion": "1.0",
  "fileType": "session",
  "session": {
    "id": "session_old_necropolis_01",
    "adventureId": "old_necropolis_patrol",
    "sessionNumber": 1,
    "startedAt": "2026-03-14T18:00:00Z",
    "endedAt": "2026-03-14T21:30:00Z",
    "startingSceneId": "scene_collapsed_chamber",
    "currentSceneId": "scene_fallback_berm",
    "endingSceneId": "scene_fallback_berm",
    "isAdventureComplete": false,
    "summary": "The party drove the patrol into withdrawal, killed Verrin, and pursued toward the fallback position while reinforcements closed in."
  },
  "sceneRunStates": [
    {
      "sceneId": "scene_collapsed_chamber",
      "enteredAt": "2026-03-14T18:05:00Z",
      "exitedAt": "2026-03-14T19:10:00Z",
      "notes": "Moon Veil pressed aggressively. Mehmet dropped Verrin with a firebolt.",
      "playerDecisions": [
        "Pressed the patrol instead of negotiating",
        "Chose pursuit over chamber search"
      ],
      "outcome": "Patrol withdrew under pressure.",
      "chosenExitOptionId": "exit_pursue_patrol",
      "unresolvedThreads": [
        "Enemy reinforcements are incoming",
        "Verrin's body was left behind"
      ],
      "loreUpdates": [
        "Ilya was established as a surviving retreat leader"
      ],
      "npcStateChanges": [
        "Verrin killed",
        "Ilya escaped"
      ],
      "worldStateChanges": [
        "Patrol fallback position activated"
      ]
    }
  ]
}
```

---

# 17. Validation Rules

V1 should enforce these rules:

## Required Rules

* `schemaVersion` must exist
* `fileType` must be either `adventure` or `session`
* all IDs must be unique within their entity type
* `startingSceneId` must match a valid scene
* every `destinationSceneId` must match a valid scene
* every `npcId` reference must match a valid NPC

## Recommended Rules

* scene IDs should be stable after creation
* exit IDs should be stable after creation
* tags should be plain strings
* timestamps should be ISO 8601

---

# 18. Import / Export Recommendations

## Import

When importing an adventure file, the app should:

* validate schema version
* validate IDs and references
* reject broken scene links
* show clear errors for missing references

## Export

When exporting, the app should:

* preserve stable IDs
* keep output human-readable
* pretty-print JSON
* avoid embedding transient runtime state in the adventure file

---
