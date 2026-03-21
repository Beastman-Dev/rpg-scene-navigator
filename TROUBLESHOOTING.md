# Troubleshooting Guide for RPG Scene Navigator

## 🚨 Quick Start: First Steps When Issues Occur

### Immediate Actions
1. **Open Debug Panel**: Press `Ctrl+Shift+D` (development only)
2. **Check Recent Logs**: Look for ERROR or FATAL level messages
3. **Run Tests**: Execute `npm run test:run` to check for test failures
4. **Export Debug Info**: Use debug panel to download complete logs

### Debug Panel Navigation
- **Logs Tab**: View real-time and historical logs
- **Health Tab**: System status and error counts
- **Filters**: Filter by level (DEBUG, INFO, WARN, ERROR, FATAL) and category
- **Export**: Download logs for external analysis

## 🔧 Common Issue Categories

### 🗄️ Database Issues

#### Symptoms
- Operations failing with "Database connection" errors
- Data not persisting between sessions
- Slow query performance
- "Entity not found" errors

#### Troubleshooting Steps
1. **Check Database Initialization Logs**
   ```typescript
   // Look for these log messages:
   log.info('database', '🗄️ Initializing IndexedDB database...');
   log.info('database', '✅ IndexedDB initialized successfully');
   ```

2. **Verify Database Schema**
   - Open browser dev tools (F12)
   - Go to Application > IndexedDB
   - Check for object stores: adventures, scenes, npcs, sessions, etc.

3. **Test Database Operations**
   ```bash
   npm run test:run src/test/repositories/session.test.ts
   npm run test:run src/test/repositories/sceneRunState.test.ts
   ```

4. **Check Connection State**
   ```typescript
   import { getDatabaseManager } from '@/database/connection';
   const dbManager = getDatabaseManager();
   console.log('Database ready:', dbManager.isReady());
   ```

#### Common Solutions
- **Browser Compatibility**: Ensure IndexedDB is supported
- **Storage Quota**: Check if localStorage/IndexedDB is full
- **Schema Mismatch**: Clear browser storage and reinitialize
- **Connection Timing**: Ensure database is initialized before operations

### 🎭 Session Management Issues

#### Symptoms
- Sessions not starting or ending properly
- Resume functionality not working
- Session state not persisting
- Navigation history lost

#### Troubleshooting Steps
1. **Check Session Logs**
   ```typescript
   // Look for session lifecycle events:
   log.session('starting', adventureId, details);
   log.session('ending', sessionId, details);
   log.session('resuming', sessionId, details);
   ```

2. **Verify Session Repository Operations**
   ```bash
   npm run test:run src/test/repositories/session-core.test.ts
   ```

3. **Check Session State in UI**
   - Open debug panel
   - Filter by category "session"
   - Look for session creation and update events

4. **Test Session Creation**
   ```typescript
   // In browser console:
   import { log } from '@/utils/logger';
   log.info('debug', 'Manual session test', { timestamp: Date.now() });
   ```

#### Common Solutions
- **Session ID Conflicts**: Ensure unique session generation
- **State Synchronization**: Check React state updates
- **Database Transactions**: Verify atomic operations
- **Navigation State**: Check history management

### 🧪 Test Failures

#### Symptoms
- Repository tests failing with mock issues
- Data conversion tests failing
- Integration tests not working
- Test coverage dropping

#### Troubleshooting Steps
1. **Identify Failing Tests**
   ```bash
   npm run test:run -- --reporter=verbose
   ```

2. **Check Mock Setup**
   ```typescript
   // Verify mock connection returns promises:
   const mockConnection = {
     all: vi.fn().mockResolvedValue([]),
     get: vi.fn().mockResolvedValue(undefined),
     prepare: vi.fn().mockReturnValue({
       run: vi.fn().mockResolvedValue({ changes: 1 })
     }),
   };
   ```

3. **Test Data Conversion Separately**
   ```typescript
   // Test rowToEntity and entityToRow:
   const repo = new SessionRepository(mockConnection);
   const entity = repo.rowToEntity(mockRow);
   const row = repo.entityToRow(entity);
   ```

4. **Check Abstract Method Implementation**
   ```typescript
   // Ensure all abstract methods are implemented:
   protected getTableName(): string {
     return 'sessions';
   }
   ```

#### Common Solutions
- **Mock Promise Issues**: Ensure all mock methods return promises
- **Abstract Methods**: Implement all required abstract methods
- **Type Mismatches**: Check TypeScript types in tests
- **Constructor Issues**: Verify repository constructor parameters

### 🎨 UI Component Issues

#### Symptoms
- Components not rendering
- State not updating
- Event handlers not working
- Navigation issues

#### Troubleshooting Steps
1. **Check UI Logs**
   ```typescript
   // Look for UI interaction logs:
   log.ui('ComponentName', 'methodName', { props, state });
   ```

2. **Verify Component Props**
   - Check React DevTools
   - Verify prop types and values
   - Check for missing required props

3. **Test State Management**
   ```typescript
   // Check React state updates:
   console.log('Component state:', state);
   console.log('Props:', props);
   ```

4. **Check Event Handlers**
   ```typescript
   // Add debugging to event handlers:
   const handleClick = (event) => {
     log.ui('Component', 'handleClick', { eventType: event.type });
     // ... existing logic
   };
   ```

#### Common Solutions
- **State Updates**: Use proper React state update patterns
- **Event Binding**: Ensure event handlers are properly bound
- **Prop Drilling**: Check prop passing through component hierarchy
- **Lifecycle Issues**: Verify useEffect and dependency arrays

### ⚡ Performance Issues

#### Symptoms
- Slow UI response
- Long-running operations
- Memory leaks
- Browser freezing

#### Troubleshooting Steps
1. **Check Performance Logs**
   ```typescript
   // Look for performance warnings:
   log.warn('performance', 'Long setTimeout operation', details);
   log.info('performance', 'Page load completed', metrics);
   ```

2. **Use Browser Performance Tools**
   - Open dev tools (F12)
   - Go to Performance tab
   - Record and analyze performance

3. **Check Operation Timing**
   ```typescript
   // Use performance timers:
   const timer = log.startTimer('category', 'operation');
   // ... operation
   timer(); // Logs completion time
   ```

4. **Monitor Memory Usage**
   - Check dev tools Memory tab
   - Look for memory leaks
   - Verify cleanup in useEffect

#### Common Solutions
- **Database Optimization**: Add proper indexing and query optimization
- **State Management**: Avoid unnecessary re-renders
- **Memory Leaks**: Clean up subscriptions and event listeners
- **Large Data Sets**: Implement pagination or virtualization

## 🔍 Advanced Debugging Techniques

### Log Analysis
```typescript
// Export and analyze logs:
import { logger, getHealthReport } from '@/utils/logging-manager';

// Get specific log categories
const errorLogs = logger.getLogs(LogLevel.ERROR);
const databaseLogs = logger.getLogs(LogLevel.DEBUG, 'database');
const sessionLogs = logger.getLogs(LogLevel.INFO, 'session');

// Get health report
const health = getHealthReport();
console.log('System health:', health);
```

### Database Inspection
```javascript
// In browser console:
// Check IndexedDB contents
const db = indexedDB.open('rpg-scene-navigator');
db.onsuccess = (event) => {
  const database = event.target.result;
  const transaction = database.transaction(['sessions'], 'readonly');
  const store = transaction.objectStore('sessions');
  const request = store.getAll();
  request.onsuccess = () => console.log('Sessions:', request.result);
};
```

### State Debugging
```typescript
// Add state debugging to components:
useEffect(() => {
  log.ui('ComponentName', 'stateChange', { 
    prevState, 
    newState, 
    props 
  });
}, [state]);
```

## 🚨 Emergency Procedures

### Complete System Failure
1. **Export All Debug Data**
   - Open debug panel (Ctrl+Shift+D)
   - Click "Export" button
   - Save debug information

2. **Clear Browser Storage**
   ```javascript
   // In browser console:
   localStorage.clear();
   indexedDB.deleteDatabase('rpg-scene-navigator');
   ```

3. **Reset Application State**
   - Refresh browser with Ctrl+Shift+R
   - Reinitialize application

### Data Corruption
1. **Stop Application Use**
   - Close browser tabs
   - Prevent further data writes

2. **Export Database**
   - Use debug panel to export data
   - Check logs for corruption events

3. **Restore from Backup**
   - Check for localStorage backups
   - Restore from previous export if available

### Critical Performance Issues
1. **Monitor Resources**
   - Check CPU and memory usage
   - Identify bottlenecks

2. **Disable Features**
   - Temporarily disable non-critical features
   - Implement performance fixes

3. **Optimize Database**
   - Add missing indexes
   - Optimize queries
   - Clear old data

## 📋 Prevention Checklist

### Before Deployment
- [ ] All tests passing
- [ ] No error logs in development
- [ ] Performance acceptable
- [ ] Documentation updated

### During Development
- [ ] Logging added to new features
- [ ] Tests written for new code
- [ ] Performance considered
- [ ] Error handling implemented

### Regular Maintenance
- [ ] Review error logs weekly
- [ ] Check test coverage
- [ ] Monitor performance metrics
- [ ] Update documentation

## 🆘 Getting Help

### Internal Resources
- **AI_INSTRUCTIONS.md**: Comprehensive AI agent guide
- **Debug Panel**: Real-time system monitoring
- **Test Suite**: Verify functionality
- **Log Exports**: Share debug information

### External Resources
- **Browser Dev Tools**: Built-in debugging capabilities
- **TypeScript Compiler**: Type checking and errors
- **React DevTools**: Component inspection
- **Network Tab**: API and resource monitoring

### Issue Reporting
When reporting issues, include:
1. **Debug export** from debug panel
2. **Steps to reproduce** the issue
3. **Browser and version** information
4. **Console errors** and warnings
5. **Expected vs actual behavior**

---

**Remember**: The logging system and debug panel are your primary tools for troubleshooting. Use them proactively to identify issues early and reactively to solve problems efficiently.
