// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { ShiftOrganizationRepository } from '@/src/core/interfaces/ShiftOrganizationRepository';

// Entities
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { DayOperation } from '@/src/core/entities/DayOperation';

// Database
import EMBEDDED_TABLES from '../../database/embeddedTables';

// DataSources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteShiftOrganizationRepository implements ShiftOrganizationRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

    insertWorkDay(workDay: WorkDayInformation): void {
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            db.runSync(`
                INSERT INTO ${EMBEDDED_TABLES.ROUTE_DAY} (
                    id_work_day,
                    start_date,
                    end_date,
                    start_petty_cash,
                    end_petty_cash,
                    id_route,
                    route_name,
                    description,
                    route_status,
                    id_day,
                    id_route_day
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [
                workDay.id_work_day,
                workDay.start_date.toISOString(),
                workDay.finish_date ? workDay.finish_date.toISOString() : null,
                workDay.start_petty_cash,
                workDay.final_petty_cash,
                workDay.id_route,
                workDay.route_name,
                workDay.description,
                workDay.route_status,
                workDay.id_day,
                workDay.id_route_day
            ]);
        } catch (error) {
            throw new Error('Failed to insert work day.');
        }
    }

    deleteWorkDay(workDay: WorkDayInformation): void {
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            db.runSync(
                `DELETE FROM ${EMBEDDED_TABLES.ROUTE_DAY} WHERE id_work_day = ?;`,
                [workDay.id_work_day]
            );
        } catch (error) {
            throw new Error('Failed to delete work day.');
        }
    }

    updateWorkDay(workDay: WorkDayInformation): void {
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            db.runSync(`
                UPDATE ${EMBEDDED_TABLES.ROUTE_DAY} SET
                    start_date = ?,
                    end_date = ?,
                    start_petty_cash = ?,
                    end_petty_cash = ?,
                    id_route = ?,
                    route_name = ?,
                    description = ?,
                    route_status = ?,
                    id_day = ?,
                    id_route_day = ?
                WHERE id_work_day = ?;
            `, [
                workDay.start_date.toISOString(),
                workDay.finish_date ? workDay.finish_date.toISOString() : null,
                workDay.start_petty_cash,
                workDay.final_petty_cash,
                workDay.id_route,
                workDay.route_name,
                workDay.description,
                workDay.route_status,
                workDay.id_day,
                workDay.id_route_day,
                workDay.id_work_day
            ]);
        } catch (error) {
            throw new Error('Failed to update work day.');
        }
    }

    listWorkDays(): WorkDayInformation[] {
        const workDays: WorkDayInformation[] = [];
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            const result = db.getAllSync<any>(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_DAY};`);
            
            for (const row of result) {
                workDays.push(new WorkDayInformation(
                    row.id_work_day,
                    new Date(row.start_date),
                    row.end_date ? new Date(row.end_date) : null,
                    row.start_petty_cash,
                    row.end_petty_cash,
                    row.id_route,
                    row.route_name,
                    row.description,
                    row.route_status,
                    row.id_day,
                    row.id_route_day
                ));
            }
            
            return workDays;
        } catch (error) {
            throw new Error('Failed to list work days.');
        }
    }

    insertDayOperations(day_operations: DayOperation[]): void {
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            for (const operation of day_operations) {
                db.runSync(`
                    INSERT INTO ${EMBEDDED_TABLES.DAY_OPERATIONS} (
                        id_day_operation,
                        id_item,
                        operation_type,
                        created_at
                    ) VALUES (?, ?, ?, ?);
                `, [
                    operation.id_day_operation,
                    operation.id_item,
                    operation.operation_type,
                    operation.created_at.toISOString()
                ]);
            }
        } catch (error) {
            throw new Error('Failed to insert day operations.');
        }
    }

    updateDayOperation(day_operation: DayOperation): void {
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            db.runSync(`
                UPDATE ${EMBEDDED_TABLES.DAY_OPERATIONS} SET
                    id_item = ?,
                    operation_type = ?,
                    created_at = ?
                WHERE id_day_operation = ?;
            `, [
                day_operation.id_item,
                day_operation.operation_type,
                day_operation.created_at.toISOString(),
                day_operation.id_day_operation
            ]);
        } catch (error) {
            throw new Error('Failed to update day operation.');
        }
    }

    listDayOperations(): DayOperation[] {
        const dayOperations: DayOperation[] = [];
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            const result = db.getAllSync<any>(`SELECT * FROM ${EMBEDDED_TABLES.DAY_OPERATIONS};`);
            
            for (const row of result) {
                dayOperations.push(new DayOperation(
                    row.id_day_operation,
                    row.id_item,
                    row.operation_type,
                    new Date(row.created_at)
                ));
            }
            
            return dayOperations;
        } catch (error) {
            throw new Error('Failed to list day operations.');
        }
    }

    deleteAllDayOperations(day_operations: DayOperation[]): void {
        try {
            const db: SQLiteDatabase = this.dataSource.getClient();
            for (const operation of day_operations) {
                db.runSync(
                    `DELETE FROM ${EMBEDDED_TABLES.DAY_OPERATIONS} WHERE id_day_operation = ?;`,
                    [operation.id_day_operation]
                );
            }
        } catch (error) {
            throw new Error('Failed to delete day operations.');
        }
    }
}
