// Use production IndexedDB database implementation
// The mock database remains available at './mock-connection' for testing
export { IndexedDBManager as DatabaseManager, getDatabaseManager, initializeDatabase } from './indexeddb-connection';
