import { ILogger } from './extractor.types';

/**
 * Used to collect statistics for an ILogger implementation.
 */
export class MonitoredLogger implements ILogger {
  /**
   * Number of calls to logError()
   */
  errorCount: number;

  /**
   * Number of calls to logWarning()
   */
  warningCount: number;

  /**
   * Number of calls to any logging method.
   */
  messageCount: number;

  private _innerLogger: ILogger;

  constructor(logger: ILogger) {
    this._innerLogger = logger;
    this.errorCount = 0;
    this.warningCount = 0;
    this.messageCount = 0;
  }

  public logVerbose(message: string): void {
    ++this.messageCount;
    this._innerLogger.logVerbose(message);
  }

  public logInfo(message: string): void {
    ++this.messageCount;
    this._innerLogger.logInfo(message);
  }

  public logWarning(message: string): void {
    ++this.messageCount;
    ++this.warningCount;
    this._innerLogger.logWarning(message);
  }

  public logError(message: string): void {
    ++this.messageCount;
    ++this.errorCount;
    this._innerLogger.logError(message);
  }

  public resetCounters(): void {
    this.errorCount = 0;
    this.warningCount = 0;
    this.messageCount = 0;
  }
}