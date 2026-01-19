// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';

// Entities
import { DayOperation } from '@/src/core/entities/DayOperation';

// DataSources
import { SQLiteDataSource } from '../../datasources/SQLiteDataSource';

// Utils
import EMBEDDED_TABLES from '@/utils/embeddedTables';
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteDayOperationRepository extends DayOperationRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {
        super();
    }

    async insertDayOperations(day_operations: DayOperation[]): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            
            await db.withExclusiveTransactionAsync(async (tx) => {
                for (const dayOperation of day_operations) {
                    await tx.runAsync(`
                        INSERT INTO ${EMBEDDED_TABLES.DAY_OPERATIONS}
                            (id_day_operation, id_item, operation_type, created_at)
                            VALUES (?, ?, ?, ?);
                    `, [
                        dayOperation.id_day_operation,
                        dayOperation.id_item,
                        dayOperation.operation_type,
                        dayOperation.created_at.toISOString()
                    ]);
                }
            });
        } catch (error) {
            throw new Error(`Failed to insert day operations: ${error}`);
        }
    }

    async updateDayOperation(day_operation: DayOperation): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            
            await db.runAsync(`
                UPDATE ${EMBEDDED_TABLES.DAY_OPERATIONS}
                    SET id_item = ?, operation_type = ?, created_at = ?
                    WHERE id_day_operation = ?;
            `, [
                day_operation.id_item,
                day_operation.operation_type,
                day_operation.created_at.toISOString(),
                day_operation.id_day_operation
            ]);
        } catch (error) {
            throw new Error(`Failed to update day operation: ${error}`);
        }
    }

    async listDayOperations(): Promise<DayOperation[]> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            
            const result = await db.getAllAsync<any>(`
                SELECT * FROM ${EMBEDDED_TABLES.DAY_OPERATIONS};
            `);

            return result.map(row => 
                new DayOperation(
                    row.id_day_operation,
                    row.id_item,
                    row.operation_type,
                    new Date(row.created_at)
                )
            );
        } catch (error) {
            throw new Error(`Failed to list day operations: ${error}`);
        }
    }

    async deleteDayOperatons(day_operations: DayOperation[]): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            
            await db.withExclusiveTransactionAsync(async (tx) => {
                for (const dayOperation of day_operations) {
                    await tx.runAsync(`
                        DELETE FROM ${EMBEDDED_TABLES.DAY_OPERATIONS}
                            WHERE id_day_operation = ?;
                    `, [dayOperation.id_day_operation]);
                }
            });
        } catch (error) {
            throw new Error(`Failed to delete day operations: ${error}`);
        }
    }
}
