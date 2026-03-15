// @ts-nocheck
import { useEffect, useState } from 'react';
import { getDatabaseManager, initializeDatabase } from '@/database/connection';
import type { Adventure } from '@/types';

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const dbManager = await initializeDatabase();
        setIsInitialized(true);
        console.log('Database initialized successfully');
        
        // Test basic database functionality - use mock data directly
        const dbConnection = dbManager.getConnection();
        const adventures = dbConnection.prepare('SELECT * FROM adventures').all();
        console.log('Mock database connection type:', typeof dbConnection);
        console.log('Adventures found:', adventures);
        console.log('Adventures length:', adventures?.length || 0);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
        setError(errorMessage);
        console.error('Database initialization failed:', error);
      }
    };

    initDatabase();
  }, []);

  return {
    isInitialized,
    error,
    retryInitialization: () => {
      setIsInitialized(false);
      setError(null);
      // Re-trigger initialization
      setTimeout(() => {
        const initDatabase = async () => {
          try {
            const dbManager = await initializeDatabase();
            setIsInitialized(true);
            setError(null);
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
            setError(errorMessage);
          }
        };
        initDatabase();
      }, 100);
    }
  };
}
