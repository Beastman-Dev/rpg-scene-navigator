/**
 * Modern logging utility for RPG Scene Navigator
 * Provides structured logging with multiple levels and context
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  sessionId?: string;
  userId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  categories: string[];
}

/**
 * Modern structured logger with context support
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private currentSessionId: string | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeSessionId();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getDefaultConfig(): LoggerConfig {
    return {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      categories: ['app', 'database', 'session', 'ui', 'repository', 'network'],
    };
  }

  private initializeSessionId(): void {
    this.currentSessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  setSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  private shouldLog(level: LogLevel, category: string): boolean {
    return level >= this.config.level && this.config.categories.includes(category);
  }

  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      error,
      sessionId: this.currentSessionId || undefined,
    };
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp;
    const level = LogLevel[entry.level].padEnd(5);
    const category = entry.category.padEnd(12);
    const sessionId = entry.sessionId ? `[${entry.sessionId}]` : '';
    
    let message = `${timestamp} ${level} ${category} ${sessionId} ${entry.message}`;
    
    if (entry.context) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level, entry.category)) {
      return;
    }

    // Console output
    if (this.config.enableConsole) {
      const formattedMessage = this.formatLogEntry(entry);
      
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
        case LogLevel.FATAL:
          console.error(formattedMessage);
          break;
      }
    }

    // Storage
    if (this.config.enableStorage) {
      this.addToStorage(entry);
    }
  }

  private addToStorage(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Maintain buffer size
    if (this.logBuffer.length > this.config.maxStorageEntries) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxStorageEntries);
    }
    
    // Persist to localStorage
    try {
      const logsToStore = this.logBuffer.slice(-100); // Store last 100 entries
      localStorage.setItem('rpg_logs', JSON.stringify(logsToStore));
    } catch (error) {
      console.warn('Failed to persist logs to localStorage:', error);
    }
  }

  // Convenience methods for different log levels
  debug(category: string, message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, context);
    this.log(entry);
  }

  info(category: string, message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, category, message, context);
    this.log(entry);
  }

  warn(category: string, message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, category, message, context);
    this.log(entry);
  }

  error(category: string, message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, category, message, context, error);
    this.log(entry);
  }

  fatal(category: string, message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.FATAL, category, message, context, error);
    this.log(entry);
  }

  // Specialized logging methods
  database(operation: string, table: string, details: Record<string, any>): void {
    this.debug('database', `DB Operation: ${operation}`, { table, ...details });
  }

  session(action: string, sessionId: string, details?: Record<string, any>): void {
    this.info('session', `Session ${action}`, { sessionId, ...details });
  }

  repository(operation: string, repository: string, details: Record<string, any>): void {
    this.debug('repository', `${repository}.${operation}`, details);
  }

  ui(component: string, action: string, details?: Record<string, any>): void {
    this.debug('ui', `${component}.${action}`, details);
  }

  // Query methods
  getLogs(level?: LogLevel, category?: string, sessionId?: string): LogEntry[] {
    let logs = [...this.logBuffer];
    
    if (level !== undefined) {
      logs = logs.filter(log => log.level >= level);
    }
    
    if (category) {
      logs = logs.filter(log => log.category === category);
    }
    
    if (sessionId) {
      logs = logs.filter(log => log.sessionId === sessionId);
    }
    
    return logs;
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  getErrorLogs(): LogEntry[] {
    return this.logBuffer.filter(log => log.level >= LogLevel.ERROR);
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  clearLogs(): void {
    this.logBuffer = [];
    localStorage.removeItem('rpg_logs');
  }

  // Performance monitoring
  startTimer(category: string, operation: string): () => void {
    const startTime = performance.now();
    const startMessage = `Started ${operation}`;
    this.debug(category, startMessage);
    
    return () => {
      const duration = performance.now() - startTime;
      const endMessage = `Completed ${operation}`;
      this.debug(category, endMessage, { duration: `${duration.toFixed(2)}ms` });
    };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (category: string, message: string, context?: Record<string, any>) => 
    logger.debug(category, message, context),
  info: (category: string, message: string, context?: Record<string, any>) => 
    logger.info(category, message, context),
  warn: (category: string, message: string, context?: Record<string, any>) => 
    logger.warn(category, message, context),
  error: (category: string, message: string, error?: Error, context?: Record<string, any>) => 
    logger.error(category, message, error, context),
  fatal: (category: string, message: string, error?: Error, context?: Record<string, any>) => 
    logger.fatal(category, message, error, context),
  database: (operation: string, table: string, details: Record<string, any>) => 
    logger.database(operation, table, details),
  session: (action: string, sessionId: string, details?: Record<string, any>) => 
    logger.session(action, sessionId, details),
  repository: (operation: string, repository: string, details: Record<string, any>) => 
    logger.repository(operation, repository, details),
  ui: (component: string, action: string, details?: Record<string, any>) => 
    logger.ui(component, action, details),
  startTimer: (category: string, operation: string) => 
    logger.startTimer(category, operation),
  getLogs: (level?: LogLevel, category?: string, sessionId?: string) => 
    logger.getLogs(level, category, sessionId),
  getRecentLogs: (count?: number) => 
    logger.getRecentLogs(count),
  getErrorLogs: () => 
    logger.getErrorLogs(),
  exportLogs: () => 
    logger.exportLogs(),
  clearLogs: () => 
    logger.clearLogs(),
  configure: (config: Partial<LoggerConfig>) => 
    logger.configure(config),
  setSessionId: (sessionId: string) => 
    logger.setSessionId(sessionId),
};
