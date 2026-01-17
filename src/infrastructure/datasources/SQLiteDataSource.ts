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
    
    async initialize(): Promise<SQLiteDatabase> {
        if (!this.client) {
            try {
                return await SQLite.openDatabaseAsync('mydb.db');
            } catch(error) {
                throw new Error('Failed to make connection to SQLite database.');
            }
        } else {
            return this.client;
        }
    }

    /**
     * Get the SQLite database client
     * Throws error if not initialized
     */
    async getClient(): Promise<SQLiteDatabase> {
        if (!this.client) {
            throw new Error('SQLiteDataSource not initialized. Call initialize() first.');
        }
        return this.client;
    }
}
