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
  private initPromise: Promise<void> | null = null; // 👈 Guards against concurrent init calls
  
  constructor() {
    console.log('SQLiteDataSource constructor called');
  }
  
  async initialize(): Promise<void> {
    if (!this.client) {
      try {
        console.log("Initializing client")
        this.client = await SQLite.openDatabaseAsync('mydb.db');
      } catch(error) {
        throw new Error('Failed to make connection to SQLite database: ' + error);
      }
    }
  }

  // async initialize(): Promise<void> {
  //     // 1. If already initialized, return immediately
  //     if (this.client) return;

  //     // 2. If initialization is already in progress, await the existing promise
  //     if (this.initPromise) {
  //         return this.initPromise;
  //     }

  //     // 3. Create the initialization promise lock
  //     this.initPromise = (async () => {
  //         try {
  //             console.log("Initializing SQLite client...");
  //             const db = await SQLite.openDatabaseAsync('mydb.db');

  //             // 4. Configure WAL mode and busy timeout to fix "database is locked"
  //             await db.execAsync(`
  //                 PRAGMA journal_mode = WAL;
  //                 PRAGMA busy_timeout = 5000;
  //             `);

  //             this.client = db;
  //             console.log("SQLite client successfully initialized with WAL mode");
  //         } catch (error) {
  //             this.initPromise = null; // Reset promise so retry is possible if it fails
  //             throw new Error('Failed to make connection to SQLite database: ' + error);
  //         }
  //     })();

  //     return this.initPromise;
  // }

  /**
   * Get the SQLite database client
   * Automatically initializes if needed
   */
  getClient(): SQLiteDatabase {
    // console.log('SQLiteDataSource getClient called: ', this.client);
    if (this.client === undefined || this.client === null) {
      throw new Error('SQLiteDataSource not initialized. Call initialize() first.');
    }
    console.log("retrieving SQLite client.")
    return this.client;
  }
}
