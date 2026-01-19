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

    async insertWorkDay(workDay: WorkDayInformation): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.runAsync(`
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

    async deleteWorkDay(workDay: WorkDayInformation): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.runAsync(
                `DELETE FROM ${EMBEDDED_TABLES.ROUTE_DAY} WHERE id_work_day = ?;`,
                [workDay.id_work_day]
            );
        } catch (error) {
            throw new Error('Failed to delete work day.');
        }
    }
    
    async updateWorkDay(workDay: WorkDayInformation): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
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

    async listWorkDays(): Promise<WorkDayInformation[]> {
        const workDays: WorkDayInformation[] = [];
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
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
}

