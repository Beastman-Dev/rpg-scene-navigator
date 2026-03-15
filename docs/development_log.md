# RPG Scene Navigator - Development Log

## Project Overview
RPG Scene Navigator is a web-based tool for Dungeon Masters to create, manage, and run tabletop RPG adventures with scene-based navigation.

## Implementation Approach
- **Frontend:** React + TypeScript + Vite
- **Database:** IndexedDB with localStorage fallback for production
- **Styling:** Tailwind CSS + Lucide icons
- **Form Management:** React Hook Form + Zod validation
- **Architecture:** Repository pattern with base classes

## Phase 1: Core Infrastructure ✅
### Database Layer
- **IndexedDB Implementation:** Created production database with localStorage bridge
- **Mock Database:** Maintained for testing and development
- **Schema Definition:** Complete SQLite-compatible schema for all entities
- **Repository Pattern:** BaseRepository with entity-specific implementations

### Core Features
- **Adventure CRUD:** Create, read, update, delete adventures
- **Scene Management:** Full scene lifecycle with exits and NPCs
- **Navigation:** Multi-view application state management
- **Form Validation:** Zod schemas for all data types

## Phase 2: Scene Management ✅
### Key Implementation Decisions

#### Data Storage Strategy
**Decision:** JSON storage for exits/NPCs in scenes (Option 2)
**Rationale:**
- IndexedDB doesn't support complex JOIN queries
- Single query performance for MVP
- Simpler codebase for initial release
- Can migrate to relational model later

**Trade-offs:**
- ✅ Pros: Fast loading, simple implementation, works with IndexedDB
- ❌ Cons: Denormalized data, no foreign key constraints

#### Technical Fixes Applied
1. **Entity Mapping Fix:** Fixed `entityToRow` to only include present fields
   - Problem: Partial updates set missing fields to `undefined`
   - Solution: Conditional field assignment in repositories
   - Files: `scene.ts`, `adventure.ts`

2. **WHERE Clause Filtering:** Added WHERE clause parsing to IndexedDB
   - Problem: Scenes from all adventures showing in list
   - Solution: Parse and filter by `adventure_id` in `handleSelectAll`
   - File: `indexeddb-connection.ts`

3. **Scene Loading Fix:** Load exits/NPCs when editing
   - Problem: Exits/NPCs saved but not loaded in editor
   - Solution: `useEffect` to populate state from existing scene
   - File: `SceneEditor.tsx`

4. **Scene Reordering:** Added list refresh after sort order changes
   - Problem: Visual order not updating after arrow clicks
   - Solution: Call `loadScenes()` after swapping sort orders
   - File: `SceneList.tsx`

## Database Schema Updates
### JSON Fields Added to Scenes
```sql
-- Added to JSON_FIELDS in schema.ts
exit_options,
scene_npcs
```

### Entity Mapping Updates
```typescript
// Scene entityToRow now includes:
if (entity.exitOptions !== undefined) row.exit_options = entity.exitOptions;
if (entity.sceneNpcRefs !== undefined) row.scene_npcs = entity.sceneNpcRefs;
```

## Files Modified
### Core Infrastructure
- `src/database/connection.ts` - Database manager exports
- `src/database/indexeddb-connection.ts` - Production implementation
- `src/database/mock-connection.ts` - Testing implementation
- `src/database/schema.ts` - Schema definitions
- `src/repositories/base.ts` - Base repository class

### Entity Repositories
- `src/repositories/adventure.ts` - Adventure operations
- `src/repositories/scene.ts` - Scene operations
- `src/types/index.ts` - TypeScript interfaces

### UI Components
- `src/App.tsx` - Main application state and routing
- `src/components/AdventureForm.tsx` - Adventure create/edit form
- `src/components/SceneEditor.tsx` - Scene create/edit form
- `src/pages/AdventureList.tsx` - Adventure listing
- `src/pages/SceneList.tsx` - Scene listing and management

### Validation Schemas
- `src/schemas/index.ts` - Zod validation schemas

## Testing Status
### ✅ Working Features
- Adventure CRUD operations
- Scene CRUD operations
- Exit options and NPC references (JSON storage)
- Scene filtering and sorting
- Navigation between views
- Data persistence

### ⚠️ Known Issues
- Scene reordering arrows (see Known Bugs below)

## Performance Considerations
- IndexedDB initialization adds ~300ms startup time
- JSON parsing for complex fields on every load
- Single query approach reduces database calls
- LocalStorage fallback ensures data availability

## Future Architecture Notes
### Migration Path to Relational Storage
When moving to real SQL database:
1. Keep current JSON fields for backward compatibility
2. Add migration script to extract exits/NPCs to separate tables
3. Update repositories to use JOINs
4. Remove JSON storage fields

### Scalability Considerations
- Current approach suitable for <100 scenes per adventure
- JSON blobs may impact performance at scale
- Consider pagination for large adventure lists
- Add indexing strategies for search functionality

## Development Tools
- **Build System:** Vite with TypeScript
- **Package Manager:** npm
- **Code Quality:** ESLint + TypeScript strict mode
- **Testing:** Manual UAT (automated tests future scope)

---
*Last Updated: March 15, 2026*
*Phase: Scene Management Complete*
