# AI Agent Instructions for RPG Scene Navigator

## Overview
This document provides comprehensive instructions for AI agents working on the RPG Scene Navigator codebase. It includes troubleshooting strategies, logging utilization, and testing best practices.

## 🎯 Primary Objectives

### Core Responsibilities
1. **Maintain Code Quality** - Ensure TypeScript best practices and clean architecture
2. **Troubleshoot Issues** - Use logging and testing to identify and fix problems
3. **Implement Features** - Follow established patterns and conventions
4. **Test Thoroughly** - Maintain high test coverage and prevent regressions

## 🔧 Troubleshooting Methodology

### Step 1: Reproduce the Issue
- **Always attempt to reproduce** the reported problem first
- **Use the debug panel** (`Ctrl+Shift+D`) to view real-time logs
- **Check recent logs** for error patterns and context
- **Verify test status** - run `npm run test:run` to check for failures

### Step 2: Analyze Logs
```typescript
// Use the logging system to investigate
import { log, logger } from '@/utils/logger';

// Check recent error logs
const errorLogs = logger.getErrorLogs();
const recentLogs = logger.getRecentLogs(50);

// Filter by category for specific issues
const databaseLogs = logger.getLogs(undefined, 'database');
const sessionLogs = logger.getLogs(undefined, 'session');
```

### Step 3: Run Targeted Tests
```bash
# Test specific repositories
npm run test:run src/test/repositories/session.test.ts
npm run test:run src/test/repositories/sceneRunState.test.ts
npm run test:run src/test/repositories/adventureSummary.test.ts

# Test core functionality
npm run test:run src/test/repositories/session-core.test.ts
```

### Step 4: Check Database State
- **Use browser dev tools** to inspect IndexedDB
- **Check localStorage** for persisted data
- **Verify schema integrity** and data consistency

## 📊 Logging System Usage

### When to Log
**ALWAYS log in these situations:**
- Repository operations (create, update, delete, find)
- Session lifecycle events (start, end, resume)
- UI state changes that affect user experience
- Error conditions with context
- Performance-sensitive operations
- Database operations with SQL and parameters

### Logging Patterns
```typescript
// Repository operations
log.repository('create', 'sessions', { sessionId: '123', adventureId: '456' });
log.repository('findByAdventureId', 'sessions', { adventureId: '456', count: 2 });

// Session lifecycle
log.session('starting', adventureId, { adventureTitle: 'Dragon Quest' });
log.session('ending', sessionId, { duration: '2h 30m', scenesVisited: 12 });

// Database operations
log.database('insert', 'sessions', { sql: 'INSERT INTO sessions...', values: [...] });
log.database('select', 'scenes', { sql: 'SELECT * FROM scenes...', count: 5 });

// UI interactions
log.ui('SceneDisplay', 'handleExitClick', { sceneId: '123', exitOptionId: '456' });

// Performance timing
const timer = log.startTimer('database', 'complexQuery');
// ... operation ...
timer(); // Automatically logs completion time

// Error handling
log.error('repository', 'Create failed for sessions', error, { entityData });
```

### Log Levels Guide
- **DEBUG**: Detailed development information, SQL queries, state changes
- **INFO**: Important business events, session lifecycle, user actions
- **WARN**: Recoverable issues, performance problems, deprecated usage
- **ERROR**: Failed operations, database errors, validation failures
- **FATAL**: Critical system failures, data corruption, security issues

## 🧪 Testing Strategy

### Test Categories
1. **Unit Tests** - Individual function and method testing
2. **Integration Tests** - Repository and database interaction testing
3. **Component Tests** - UI component behavior and state management
4. **End-to-End Tests** - Complete user workflows

### Test File Organization
```
src/test/
├── repositories/       # Repository layer tests
│   ├── session.test.ts
│   ├── sceneRunState.test.ts
│   └── adventureSummary.test.ts
├── components/         # UI component tests
├── integration/        # Cross-component tests
└── setup.ts           # Test configuration
```

### Repository Testing Patterns
```typescript
// Mock database connection
const mockConnection = {
  all: vi.fn().mockResolvedValue([]),
  get: vi.fn().mockResolvedValue(undefined),
  prepare: vi.fn().mockReturnValue({
    run: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 'test-id' })
  }),
};

// Test data conversion
it('should convert snake_case to camelCase', () => {
  const row = { adventure_id: '123', session_number: 1 };
  const entity = repo.rowToEntity(row);
  expect(entity).toEqual({ adventureId: '123', sessionNumber: 1 });
});

// Test error handling
it('should handle database errors gracefully', async () => {
  mockConnection.all.mockRejectedValue(new Error('Database error'));
  const result = await repo.findByAdventureId('123');
  expect(result.success).toBe(false);
  expect(result.error).toContain('Failed to find sessions');
});
```

### Test Best Practices
- **Mock database connections** for repository tests
- **Test both success and failure** scenarios
- **Verify data conversion** between entities and database rows
- **Use proper assertions** with meaningful messages
- **Maintain test independence** - don't rely on shared state

## 🐛 Common Issues and Solutions

### Database Connection Issues
**Symptoms**: Operations failing with connection errors
**Debugging Steps**:
1. Check IndexedDB initialization logs
2. Verify database schema creation
3. Test with mock connection
4. Check browser compatibility

**Solution**: Ensure proper database initialization and fallback to localStorage

### Session Management Problems
**Symptoms**: Session state not persisting, resume functionality failing
**Debugging Steps**:
1. Check session logs for lifecycle events
2. Verify session repository operations
3. Test session creation and retrieval
4. Check scene run state tracking

**Solution**: Ensure proper session ID handling and state synchronization

### Test Failures
**Symptoms**: Repository tests failing with mock issues
**Debugging Steps**:
1. Check mock connection setup
2. Verify promise handling in mocks
3. Test data conversion methods separately
4. Check abstract method implementations

**Solution**: Ensure mocks return promises and implement all required abstract methods

### Performance Issues
**Symptoms**: Slow operations, UI lag
**Debugging Steps**:
1. Check performance logs for slow operations
2. Use debug panel to monitor timing
3. Check for unnecessary database queries
4. Verify efficient data structures

**Solution**: Optimize database operations and implement proper caching

## 🔄 Development Workflow

### Before Making Changes
1. **Run existing tests** to ensure baseline functionality
2. **Check debug panel** for any existing errors
3. **Review recent logs** for relevant context
4. **Understand the impact** of proposed changes

### During Development
1. **Add appropriate logging** to new features
2. **Write tests concurrently** with implementation
3. **Use debug panel** to verify behavior in real-time
4. **Check performance** of new operations

### After Implementation
1. **Run full test suite** to ensure no regressions
2. **Test manually** in the browser
3. **Check logs** for proper operation
4. **Update documentation** if needed

## 🚨 Emergency Procedures

### Critical Failures
1. **Export debug information** using debug panel
2. **Check error logs** for root cause
3. **Rollback changes** if necessary
4. **Document the issue** for future reference

### Data Corruption
1. **Stop the application** to prevent further damage
2. **Export database contents** for analysis
3. **Check logs** for corruption events
4. **Restore from backup** if available

### Performance Degradation
1. **Monitor performance logs** for bottlenecks
2. **Check debug panel** for slow operations
3. **Profile the application** using browser tools
4. **Optimize identified issues**

## 📋 Quality Checklist

### Code Quality
- [ ] TypeScript types are properly defined
- [ ] Error handling is comprehensive
- [ ] Logging is appropriate and contextual
- [ ] Code follows established patterns
- [ ] Performance considerations are addressed

### Testing Quality
- [ ] Unit tests cover all public methods
- [ ] Integration tests cover database operations
- [ ] Error scenarios are tested
- [ ] Mock setup is correct and complete
- [ ] Tests are independent and reliable

### Documentation Quality
- [ ] README is updated with new features
- [ ] Code comments explain complex logic
- [ ] API documentation is current
- [ ] Troubleshooting guides are helpful

## 🔍 Debug Tools and Commands

### Development Commands
```bash
# Development server with hot reload
npm run dev

# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Build for production
npm run build
```

### Debug Shortcuts
- **Ctrl+Shift+D**: Toggle debug panel (development only)
- **F12**: Open browser dev tools
- **Ctrl+R**: Refresh with cache clear

### Log Analysis
```typescript
// Get system health report
import { getHealthReport, exportDebugInfo } from '@/utils/logging-manager';

const health = getHealthReport();
const debugData = exportDebugInfo();
```

## 🎯 Success Metrics

### Technical Metrics
- **Test Coverage**: Maintain >90% coverage
- **Build Success**: All builds complete without errors
- **Performance**: Operations complete within acceptable time limits
- **Error Rate**: Minimal errors in production logs

### User Experience Metrics
- **Session Reliability**: Sessions start, track, and resume correctly
- **Data Integrity**: No data loss or corruption
- **Performance**: Responsive UI and quick operations
- **Debugging**: Issues can be quickly identified and resolved

## 📚 Additional Resources

### Code References
- **TypeScript Types**: `src/types/index.ts`
- **Database Schema**: `src/database/schema.ts`
- **Repository Base**: `src/repositories/base.ts`
- **Logging System**: `src/utils/logger.ts`

### Testing References
- **Test Setup**: `src/test/setup.ts`
- **Mock Examples**: `src/test/repositories/`
- **Test Configuration**: `vitest.config.ts`

### Debug References
- **Debug Panel**: `src/components/DebugPanel.tsx`
- **Logging Manager**: `src/utils/logging-manager.ts`
- **Error Handlers**: `src/utils/logging-manager.ts`

---

**Remember**: The logging system and test suite are your primary tools for maintaining code quality and troubleshooting issues. Use them proactively to prevent problems and reactively to solve them efficiently.
