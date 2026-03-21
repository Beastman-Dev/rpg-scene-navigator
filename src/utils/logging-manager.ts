/**
 * Logging configuration and management utilities
 */

import { log, logger, LogLevel, type LoggerConfig } from './logger';

/**
 * Configure logging for different environments
 */
export class LoggingManager {
  static configureForDevelopment(): void {
    logger.configure({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 2000,
      categories: ['app', 'database', 'session', 'ui', 'repository', 'network', 'performance'],
    });
    
    log.info('logging', 'Logging configured for development environment');
  }

  static configureForProduction(): void {
    logger.configure({
      level: LogLevel.WARN,
      enableConsole: false,
      enableStorage: true,
      maxStorageEntries: 500,
      categories: ['app', 'database', 'session', 'ui'],
    });
    
    // Only log configuration in production if there's an issue
    if (logger.getLogs(LogLevel.ERROR).length > 0) {
      log.warn('logging', 'Logging configured for production with existing errors');
    }
  }

  static configureForTesting(): void {
    logger.configure({
      level: LogLevel.ERROR,
      enableConsole: false,
      enableStorage: false,
      maxStorageEntries: 0,
      categories: ['app', 'database', 'session', 'ui', 'repository'],
    });
  }

  /**
   * Get system health report
   */
  static getHealthReport(): {
    timestamp: string;
    environment: string;
    logCounts: Record<string, number>;
    errorCount: number;
    recentErrors: any[];
    storageInfo: {
      used: number;
      max: number;
    };
  } {
    const allLogs = logger.getLogs();
    const errorLogs = logger.getErrorLogs();
    
    const logCounts = allLogs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      logCounts,
      errorCount: errorLogs.length,
      recentErrors: errorLogs.slice(-5),
      storageInfo: {
        used: allLogs.length,
        max: 2000, // Default max
      },
    };
  }

  /**
   * Export logs for debugging
   */
  static exportDebugInfo(): string {
    const healthReport = this.getHealthReport();
    const allLogs = logger.getLogs();
    
    return JSON.stringify({
      healthReport,
      logs: allLogs,
      exportedAt: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    }, null, 2);
  }

  /**
   * Setup global error handlers
   */
  static setupGlobalErrorHandlers(): void {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      log.fatal('app', 'Unhandled JavaScript error', event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        message: event.message,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      log.fatal('app', 'Unhandled promise rejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        promise: event.promise,
      });
    });

    log.info('app', 'Global error handlers configured');
  }

  /**
   * Monitor performance metrics
   */
  static setupPerformanceMonitoring(): void {
    // Monitor page load performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          log.info('performance', 'Page load completed', {
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: navigation.responseStart - navigation.requestStart,
          });
        }
      });
    }

    // Monitor long-running operations
    const originalSetTimeout = window.setTimeout;
    (window as any).setTimeout = (callback: TimerHandler, delay?: number, ...args: any[]) => {
      if (delay && delay > 100) { // Only monitor operations longer than 100ms
        const start = performance.now();
        const timerId = originalSetTimeout(() => {
          const duration = performance.now() - start;
          if (duration > 200) { // Log if it took longer than expected
            const callbackName = typeof callback === 'string' ? callback : 
                              (callback as Function).name || 'anonymous';
            log.warn('performance', 'Long setTimeout operation', {
              expectedDelay: delay,
              actualDuration: duration,
              callbackName,
            });
          }
          if (typeof callback === 'string') {
            // String callbacks are evaluated, so we can't call them directly
            eval(callback);
          } else {
            (callback as Function)(...args);
          }
        }, delay, ...args);
        return timerId;
      }
      return originalSetTimeout(callback, delay, ...args);
    };
  }

  /**
   * Create a debug panel component data
   */
  static getDebugPanelData(): {
    logs: any[];
    health: any;
    config: Partial<LoggerConfig>;
  } {
    return {
      logs: logger.getRecentLogs(100),
      health: this.getHealthReport(),
      config: {
        level: LogLevel.DEBUG, // Default value since we can't access private config
        enableConsole: true,
        enableStorage: true,
        categories: ['app', 'database', 'session', 'ui', 'repository', 'network', 'performance'],
      },
    };
  }

  /**
   * Clear all logs and reset
   */
  static reset(): void {
    logger.clearLogs();
    log.info('logging', 'Logging system reset');
  }
}

// Auto-configure based on environment
if (typeof window !== 'undefined') {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      LoggingManager.configureForProduction();
      break;
    case 'test':
      LoggingManager.configureForTesting();
      break;
    default:
      LoggingManager.configureForDevelopment();
  }
  
  // Setup global error handlers
  LoggingManager.setupGlobalErrorHandlers();
  
  // Setup performance monitoring in development
  if (environment === 'development') {
    LoggingManager.setupPerformanceMonitoring();
  }
}

// Export convenience functions
export const configureLogging = LoggingManager.configureForDevelopment;
export const getHealthReport = LoggingManager.getHealthReport;
export const exportDebugInfo = LoggingManager.exportDebugInfo;
export const getDebugPanelData = LoggingManager.getDebugPanelData;
