// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Data sources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Utils
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Interfaces & entities
import { LocalUserRepository } from '@/src/core/interfaces/LocalUserRepository';
import { User } from '@/src/core/entities/User';

@injectable()
export class SQLiteUserRepository implements LocalUserRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

    async insertUser(user: User): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(
                    `INSERT INTO ${EMBEDDED_TABLES.USER} (
                        id_vendor,
                        cellphone,
                        name,
                        password,
                        status
                    ) VALUES (?, ?, ?, ?, ?);`,
                    [
                        user.id_vendor,
                        user.cellphone,
                        user.name,
                        user.password,
                        user.status,
                    ],
                );
            });
        } catch (error) {
            throw new Error('Failed to insert user.');
        }
    }

    async deleteUser(user: User): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(
                    `DELETE FROM ${EMBEDDED_TABLES.USER} WHERE id_vendor = ?;`,
                    [user.id_vendor],
                );
            });
        } catch (error) {
            throw new Error('Failed to delete user.');
        }
    }

    async getUserByPhoneNumber(cellphone: string): Promise<User[]> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const statement = await db.prepareAsync(
                `SELECT * FROM ${EMBEDDED_TABLES.USER} WHERE cellphone = ?;`,
            );
            const rows = statement.executeSync<any>([cellphone]);
            const users: User[] = [];
            for (const row of rows) {
                users.push({
                    id_vendor: row.id_vendor,
                    cellphone: row.cellphone,
                    name: row.name,
                    password: row.password,
                    status: row.status,
                });
            }
            return users;
        } catch (error) {
            throw new Error('Failed to retrieve user by cellphone.');
        }
    }
}