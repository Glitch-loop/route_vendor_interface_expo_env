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
    private example: number = 0;

    constructor() { 
        console.log('SQLiteDataSource constructor called');
    }
    
    async initialize(): Promise<void> {
        if (!this.client) {
            try {
                this.client = await SQLite.openDatabaseAsync('mydb.db');
            } catch(error) {
                throw new Error('Failed to make connection to SQLite database: ' + error);
            }
        }
        // console.log("Example again: ", this.example);
        // this.example += 1;
        // return this.client!;
    }

    /**
     * Get the SQLite database client
     * Automatically initializes if needed
     */
    async getClient(): Promise<SQLiteDatabase> {
        if (!this.client) {
            throw new Error('SQLiteDataSource not initialized. Call initialize() first.');
        }
        return this.client!;
    }
}
