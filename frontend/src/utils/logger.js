/**
 * Logger Utility
 * 
 * Centralized logging system with log levels and environment-based behavior.
 * Replaces console.* statements throughout the application.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

const LOG_LEVEL_NAMES = {
  [LOG_LEVELS.DEBUG]: 'DEBUG',
  [LOG_LEVELS.INFO]: 'INFO',
  [LOG_LEVELS.WARN]: 'WARN',
  [LOG_LEVELS.ERROR]: 'ERROR',
};

class Logger {
  constructor() {
    // Set log level based on environment
    if (process.env.NODE_ENV === 'production') {
      this.level = LOG_LEVELS.ERROR; // Only show errors in production
    } else {
      this.level = LOG_LEVELS.DEBUG; // Show all logs in development
    }
  }

  /**
   * Set the minimum log level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Check if a log level should be logged
   */
  shouldLog(level) {
    return level >= this.level;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const levelName = LOG_LEVEL_NAMES[level] || 'LOG';
    return [`[${timestamp}] [${levelName}]`, message, ...args];
  }

  /**
   * Debug log (development only)
   */
  debug(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(...this.formatMessage(LOG_LEVELS.DEBUG, message, ...args));
    }
  }

  /**
   * Info log
   */
  info(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(...this.formatMessage(LOG_LEVELS.INFO, message, ...args));
    }
  }

  /**
   * Warning log
   */
  warn(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(...this.formatMessage(LOG_LEVELS.WARN, message, ...args));
    }
  }

  /**
   * Error log (always shown)
   */
  error(message, ...args) {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(...this.formatMessage(LOG_LEVELS.ERROR, message, ...args));
    }
  }

  /**
   * Log with custom level
   */
  log(level, message, ...args) {
    if (this.shouldLog(level)) {
      console.log(...this.formatMessage(level, message, ...args));
    }
  }

  /**
   * Group logs (useful for debugging)
   */
  group(label) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd() {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.groupEnd();
    }
  }

  /**
   * Table log (useful for debugging arrays/objects)
   */
  table(data) {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.table(data);
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton and class
export default logger;
export { Logger, LOG_LEVELS };

