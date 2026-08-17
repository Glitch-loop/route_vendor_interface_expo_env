import { injectable, singleton } from 'tsyringe';
import * as SQLite from 'expo-sqlite';
import { SQLiteDatabase } from 'expo-sqlite';

/**
 * SQLiteDataSource - Manages SQLite connection as singleton
 * One instance shared across all repositories
 */
@singleton()
@injectable()
export class SQLiteDataSource {
  private client: SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initializes the database connection asynchronously.
   * Safe against concurrent callers (returns the in-flight promise).
   */
  async initialize(databaseName: string = 'mydb.db'): Promise<void> {
    // console.log("Initilizing local database connection")
    if (this.client) return;

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          this.client = await SQLite.openDatabaseAsync(databaseName);
        } catch (error) {
          this.initPromise = null; // Reset so retries can be attempted
          throw new Error(
            `Failed to establish connection to SQLite database: ${error}`
          );
        }
      })();
    }

    return this.initPromise;
  }

  /**
   * Returns the initialized SQLite client synchronously.
   * Must be called after initialize() has resolved during app startup.
   */
  getClient(): SQLiteDatabase {
    if (!this.client) {
      throw new Error(
        'SQLiteDataSource is not initialized. Ensure initialize() is called and awaited during application startup before accessing repositories.'
      );
    }

    return this.client;
  }

  /**
   * Utility check for current initialization state.
   */
  isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * Closes the active database connection.
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.closeAsync();
      this.client = null;
      this.initPromise = null;
    }
  }
}
