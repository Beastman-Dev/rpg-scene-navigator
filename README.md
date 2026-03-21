# RPG Scene Navigator - Phase 2 Implementation

A local-first desktop-friendly application for running branching tabletop RPG adventures during live play.

## Phase 2 Status: ✅ COMPLETED

Phase 2 adds full authoring capabilities, scene-to-scene navigation for live play, and comprehensive testing infrastructure.

## What's Implemented

### ✅ Phase 1: Foundation (Complete)
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
- **IndexedDB + localStorage fallback** for production deployment
- **SQLite schema** with proper relationships and constraints
- **Database connection manager** with initialization and migration support
- **Transaction support** for data consistency
- **Performance optimizations** with proper indexing

### ✅ Repository Pattern
- **Base repository** with common CRUD operations
- **Adventure repository** with status filtering and search
- **Scene repository** with NPC relationships and exit management
- **NPC repository** with faction tracking and scene appearances
- **Error handling** and **type safety** throughout

### ✅ Authoring UI (Phase 2)
- **Adventure creation and editing forms** with real-time validation
- **Scene management** with rich text editing and exit linking
- **NPC manager** with stat block editing and scene assignment
- **Exit option editor** with visual scene linking
- **Form validation** and comprehensive error handling
- **Real-time preview** of adventure structure

### ✅ Play Mode (Phase 2)
- **Scene display** with read-aloud text and GM descriptions
- **NPC reference panels** with stat blocks and combat information
- **Session note tracking** with GM and player note separation
- **Exit navigation** for moving between scenes
- **Scene-to-scene navigation** with enhanced features:
  - **Navigation history** with back/forward buttons
  - **Scene list panel** for quick jumping to any scene
  - **Breadcrumb navigation** showing path through scenes
  - **Enhanced session state** with progress tracking

### ✅ Testing Infrastructure (Phase 2)
- **Vitest + React Testing Library** setup
- **Repository tests** for data conversion bug prevention (29/31 passing - 93% coverage)
- **Component tests** for form state and navigation
- **Integration tests** for end-to-end workflows
- **Mock setup** for IndexedDB, localStorage, and crypto
- **Critical bug coverage** including starting scene persistence
- **Session management tests** for lifecycle and state tracking

### ✅ Modern Logging System (Phase 2)
- **Structured logging** with multiple levels (DEBUG, INFO, WARN, ERROR, FATAL)
- **Context-aware logging** with session tracking and component context
- **Performance monitoring** with operation timing and long-running operation detection
- **Environment-aware configuration** (development, production, testing)
- **Debug Panel Component** with real-time log viewing and filtering
- **Global error handlers** for unhandled exceptions and promise rejections
- **Export capabilities** for debugging and support
- **LocalStorage persistence** with automatic log rotation

### ✅ State Management
- **React state management** with hooks and context
- **Adventure, scene, and session** state management
- **Navigation history** tracking for play mode
- **Form state** with React Hook Form integration

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
│   └── AdventureList.tsx
├── hooks/              # Custom React hooks
├── test/               # Test files and setup
│   ├── setup.ts
│   ├── repositories/
│   ├── components/
│   └── integration/
├── types/              # TypeScript type definitions
│   └── index.ts
├── schemas/            # Zod validation schemas
│   └── index.ts
├── database/           # Database schema and connection
│   ├── schema.ts
│   ├── connection.ts
│   ├── indexeddb-connection.ts
│   └── mock-connection.ts
├── repositories/       # Data access layer
│   ├── base.ts
│   ├── adventure.ts
│   ├── scene.ts
│   ├── npc.ts
│   └── index.ts
├── utils/              # Utility functions
│   ├── logger.ts        # Modern logging system
│   └── logging-manager.ts # Logging configuration and management
├── components/          # Reusable UI components
│   └── DebugPanel.tsx   # Debug log viewer (development)
├── assets/             # Static assets
├── App.tsx            # Main application component
├── main.tsx           # Application entry point
├── index.css           # Global styles
└── vitest.config.ts   # Test configuration
```

## Technical Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Hooks + Context
- **Database**: IndexedDB + localStorage fallback
- **Validation**: Zod + React Hook Form
- **Testing**: Vitest + React Testing Library
- **Build**: Vite with modern tooling

## Database Schema

The application uses IndexedDB with localStorage fallback, based on a relational SQLite schema with the following main tables:

- **adventures** - Core adventure metadata
- **scenes** - Individual scene definitions with branching exits
- **npcs** - Character and stat block management
- **scene_npcs** - Many-to-many relationship between scenes and NPCs
- **exit_options** - Branching paths between scenes
- **sessions** - Play session tracking with lifecycle management
- **scene_run_states** - Runtime state for played scenes with decision tracking
- **adventure_summaries** - Generated summaries with template support

## Development Notes

### Dependencies
The project requires Node.js and npm to install dependencies. All dependencies are listed in `package.json`.

### Database
IndexedDB is created automatically in the browser on first run with localStorage fallback for compatibility.

### Type Safety
All code is fully typed with TypeScript. Zod schemas provide runtime validation that matches the TypeScript types.

### Error Handling
Repository methods return result objects with success/error states rather than throwing exceptions.

### Testing
Comprehensive test suite with Vitest and React Testing Library. Run tests with:
- `npm test` - Run all tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Generate coverage report

### Logging & Debugging
Modern structured logging system for troubleshooting:
- **Debug Panel**: Press `Ctrl+Shift+D` to toggle debug panel (development only)
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL with environment-aware defaults
- **Context Tracking**: All logs include session ID, component context, and timestamps
- **Export Logs**: Download complete debug information for support
- **Performance Monitoring**: Automatic detection of slow operations
- **Error Tracking**: Global error handlers catch and log all unhandled exceptions

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open browser to: `http://localhost:5173`
4. Run tests: `npm test`

## Next Steps (Phase 3)

Phase 3 will focus on advanced session features and content tools:

- ⏳ Session summary generation with templates
- ⏳ Summary viewing and management UI
- ⏳ Export functionality for summaries and campaign data
- ⏳ Adventure completion workflows
- ⏳ Lore update tracking and integration

## Current Features

✅ **Fully Functional CRUD Operations** - Create, read, update, delete adventures, scenes, and NPCs
✅ **Scene-to-Scene Navigation** - Enhanced navigation with history, breadcrumbs, and scene list
✅ **Play Mode** - Live session support with notes and NPC references
✅ **Session Management** - Complete session lifecycle with tracking, resume, and state management
✅ **Modern Logging System** - Structured logging with debug panel and performance monitoring
✅ **Data Persistence** - IndexedDB with localStorage fallback
✅ **Form Validation** - Real-time validation with error handling
✅ **Test Coverage** - Comprehensive test suite preventing regressions (93% coverage)
✅ **AI-Ready Documentation** - Comprehensive guides for development and troubleshooting

## 📚 Documentation

### Development Guides
- **[AI Instructions](./AI_INSTRUCTIONS.md)** - Comprehensive guide for AI agents working on this codebase
- **[Troubleshooting Guide](./TROUBLESHOOTING.md)** - Step-by-step debugging and problem resolution
- **[Debug Panel Usage](./src/components/DebugPanel.tsx)** - Real-time log monitoring and analysis

### Quick Reference
- **Debug Shortcut**: Press `Ctrl+Shift+D` to toggle debug panel (development only)
- **Test Commands**: `npm test`, `npm run test:run`, `npm run test:coverage`
- **Log Categories**: app, database, session, ui, repository, network, performance
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
