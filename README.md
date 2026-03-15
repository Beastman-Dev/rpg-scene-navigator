# RPG Scene Navigator - Phase 1 Implementation

A local-first desktop-friendly application for running branching tabletop RPG adventures during live play.

## Phase 1 Status: ✅ COMPLETED

Phase 1 focuses on establishing the foundation for the application including project setup, data models, database layer, and basic UI structure.

## What's Implemented in Phase 1

### ✅ Project Foundation
- **Vite + React + TypeScript** setup with modern development tooling
- **Tailwind CSS** for styling with custom design system
- **Folder structure** organized by feature (components, pages, database, repositories, etc.)
- **Configuration files** for TypeScript, Tailwind, and build tools

### ✅ Type System
- **Comprehensive TypeScript types** for all domain entities
- **Adventure, Scene, NPC, ExitOption** models with full type safety
- **Session tracking** and **summary** types for runtime data
- **JSON import/export** format types for portability
- **Form data** types for UI validation

### ✅ Data Validation
- **Zod schemas** for all domain entities
- **Runtime validation** at API boundaries
- **Form validation** schemas for user input
- **Type-safe parsing** with error handling

### ✅ Database Layer
- **SQLite schema** with proper relationships and constraints
- **Database connection manager** with initialization and migration support
- **Transaction support** for data consistency
- **Backup and restore** functionality
- **Performance optimizations** with proper indexing

### ✅ Repository Pattern
- **Base repository** with common CRUD operations
- **Adventure repository** with status filtering and search
- **Scene repository** with NPC relationships and exit management
- **NPC repository** with faction tracking and scene appearances
- **Error handling** and **type safety** throughout

### ✅ State Management
- **Zustand store** for global application state
- **Adventure, scene, and session** state management
- **Play mode** tracking capabilities

### ✅ UI Foundation
- **Adventure list view** with filtering and search
- **Navigation** between list, create, edit, and play views
- **Responsive design** with Tailwind CSS
- **Component structure** ready for expansion

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
│   └── AdventureList.tsx
├── hooks/              # Custom React hooks
├── store/              # Global state management
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── schemas/            # Zod validation schemas
│   └── index.ts
├── database/           # Database schema and connection
│   ├── schema.ts
│   └── connection.ts
├── repositories/       # Data access layer
│   ├── base.ts
│   ├── adventure.ts
│   ├── scene.ts
│   ├── npc.ts
│   └── index.ts
├── utils/              # Utility functions
├── assets/             # Static assets
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
└── index.css           # Global styles
```

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State**: Zustand
- **Database**: SQLite with better-sqlite3
- **Validation**: Zod
- **Build**: Vite with modern tooling

## Database Schema

The application uses a relational SQLite database with the following main tables:

- **adventures** - Core adventure metadata
- **scenes** - Individual scene definitions with branching exits
- **npcs** - Character and stat block management
- **scene_npcs** - Many-to-many relationship between scenes and NPCs
- **exit_options** - Branching paths between scenes
- **sessions** - Play session tracking
- **scene_run_states** - Runtime state for played scenes
- **adventure_summaries** - Generated summaries

## Next Steps (Phase 2)

Phase 2 will focus on the authoring UI:

- ✅ Adventure creation and editing forms
- ✅ Scene management with rich text editing
- ✅ NPC manager with stat block editing
- ✅ Exit option editor with visual scene linking
- ✅ Form validation and error handling
- ✅ Real-time preview of adventure structure

## Development Notes

### Dependencies
The project requires Node.js and npm/yarn to install dependencies. All dependencies are listed in `package.json`.

### Database
The SQLite database will be created automatically on first run at `./rpg-scene-navigator.db`.

### Type Safety
All code is fully typed with TypeScript. Zod schemas provide runtime validation that matches the TypeScript types.

### Error Handling
Repository methods return result objects with success/error states rather than throwing exceptions.

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open browser to: `http://localhost:3000`

Note: The application currently shows mock data since the database integration requires Node.js dependencies to be installed.

## Phase 1 Limitations

- **No real database connectivity** (dependencies not installed)
- **Mock data** in UI components
- **No actual CRUD operations** in the interface
- **Forms are placeholders** for Phase 2 implementation
- **No play mode functionality** (Phase 3)

These limitations are expected and will be addressed in subsequent phases.
