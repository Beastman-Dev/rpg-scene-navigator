# RPG Scene Navigator - Known Bugs

This document tracks identified bugs and their status for future resolution.

## High Priority Bugs

### 1. Scene Reordering Not Working
**Status:** ⚠️ Known Issue
**Priority:** Medium
**Description:** 
- Clicking up/down arrows in scene list does not reorder scenes
- Scenes may disappear from list after clicking arrows
- Manual sort order field changes work correctly

**Affected Component:** `SceneList.tsx`
**Functions:** `moveSceneUp()`, `moveSceneDown()`

**Current Behavior:**
```typescript
// Swaps sort orders and calls loadScenes()
await sceneRepo.update(previousScene.id, { sortOrder: currentScene.sortOrder });
await sceneRepo.update(currentScene.id, { sortOrder: tempOrder });
await loadScenes(); // Reload to reflect changes
```

**Suspected Causes:**
1. Race condition between update operations
2. Sort order values becoming duplicates
3. IndexedDB update not persisting correctly
4. List refresh timing issue

**Workaround:** 
- Manually edit scene and change "Sort Order" field
- Use this for temporary reordering needs

**Investigation Needed:**
- Add debug logging to track sort order values before/after updates
- Verify IndexedDB update operations complete successfully
- Check if sort orders become non-unique
- Test with different numbers of scenes

---

## Medium Priority Bugs

### 2. Form Validation Edge Cases
**Status:** 📝 Documented
**Priority:** Low
**Description:** Some edge cases in form validation may not provide clear error messages

**Affected Components:** All form components
**Workaround:** Follow field requirements in validation messages

---

## Low Priority Issues

### 3. UI Polish
**Status:** 📝 Documented
**Priority:** Low
**Description:** Minor UI inconsistencies and accessibility improvements

---

## Resolved Bugs ✅

### Scenes from Other Adventures Showing
**Status:** ✅ Resolved
**Fix:** Added WHERE clause filtering in `handleSelectAll()`
**File:** `indexeddb-connection.ts`

### Exit Options and NPCs Not Saving
**Status:** ✅ Resolved
**Fix:** Added JSON storage and loading in SceneEditor
**Files:** `schema.ts`, `scene.ts`, `SceneEditor.tsx`, `App.tsx`

### React Key Warnings
**Status:** ✅ Resolved
**Fix:** Added proper keys to list elements
**Files:** `AdventureList.tsx`

### Entity Update "Not Found" Errors
**Status:** ✅ Resolved
**Fix:** Skip `id` column in UPDATE statements
**File:** `indexeddb-connection.ts`

### Tags Parsing Errors
**Status:** ✅ Resolved
**Fix:** JSON parsing with error handling
**File:** `AdventureForm.tsx`

---

## Bug Reporting Template

When reporting new bugs, include:

```markdown
### Bug Title
**Status:** [New/In Progress/Resolved]
**Priority:** [High/Medium/Low]
**Description:** 
- What happens
- Expected behavior
- Actual behavior
- Steps to reproduce

**Affected Component:** 
**Functions:** 
**Workaround:** 
**Investigation Needed:** 
```

---

## Testing Notes

### Regression Testing Checklist
When fixing bugs, verify these still work:
- [ ] Adventure CRUD operations
- [ ] Scene CRUD operations  
- [ ] Navigation between views
- [ ] Data persistence after refresh
- [ ] Form validation
- [ ] Scene filtering and sorting

---

*Last Updated: March 15, 2026*
*Next Phase: NPC Management*
