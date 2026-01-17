import { injectable } from 'tsyringe';
import * as SQLite from 'expo-sqlite';
import { SQLiteDatabase } from 'expo-sqlite';

/**
 * SQLiteDataSource - Manages SQLite connection as singleton
 * One instance shared across all repositories
 */
@injectable()
export class SQLiteDataSource {
    private client: SQLiteDatabase | null = null;

    constructor() { }
    
    async initialize(): Promise<void> {
        if (!this.client) {
            try {
                this.client = await SQLite.openDatabaseAsync('mydb.db');
            } catch(error) {
                throw new Error('Failed to make connection to SQLite database.');
            }
        }
    }

    /**
     * Get the SQLite database client
     * Throws error if not initialized
     */
    getClient(): SQLiteDatabase {
        if (!this.client) {
            throw new Error('SQLiteDataSource not initialized. Call initialize() first.');
        }
        return this.client;
    }
}
