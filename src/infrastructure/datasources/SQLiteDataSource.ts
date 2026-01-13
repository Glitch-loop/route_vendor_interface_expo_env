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

    constructor() {
        this.initialize()
    }
    
    async initialize(): Promise<void> {
        if (!this.client) {
            this.client = await SQLite.openDatabaseAsync('mydb.db');
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
