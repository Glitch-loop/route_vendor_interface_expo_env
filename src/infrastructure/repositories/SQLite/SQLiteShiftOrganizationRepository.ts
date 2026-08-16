// Libraries
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { ShiftOrganizationRepository } from '@/src/core/interfaces/ShiftOrganizationRepository';
import { SyncWorkdayInformationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncWorkdayInformationRepository';

// Entities
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';

// Models
import WorkDayInformationLocalModel from '@/src/infrastructure/persitence/model/local-models/WorkdayInformationLocalModel';

// Database
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';


@injectable()
export class SQLiteShiftOrganizationRepository implements ShiftOrganizationRepository, SyncWorkdayInformationRepository {
  private readonly db: SQLiteDatabase;
  
  constructor(db: SQLiteDatabase);
  constructor(dataSource: SQLiteDataSource);
  constructor(@inject(TOKENS.SQLiteDataSource) dbOrDataSource?: SQLiteDatabase | SQLiteDataSource) {
    if (!dbOrDataSource) {
      throw new Error(
        'SQLiteDayOperationRepository requires a Database or DataSource instance.'
      );
    }

    if (
      'getClient' in dbOrDataSource &&
      typeof dbOrDataSource.getClient === 'function'
    ) {
      this.db = dbOrDataSource.getClient();
    } else {
      this.db = dbOrDataSource as SQLiteDatabase;
    }
  }

  async insertWorkDay(workDay: WorkDayInformation): Promise<void> {
    try {
      const stmt = await this.db.prepareAsync(`
        INSERT INTO ${EMBEDDED_TABLES.ROUTE_DAY} (
            id_work_day,
            start_date,
            finish_date,
            start_petty_cash,
            final_petty_cash,
            id_route,
            route_name,
            description,
            route_status,
            id_day,
            id_user,
            id_route_day
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);
      try {
        await stmt.executeAsync([
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
          workDay.id_user,
          workDay.id_route_day,
        ]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to insert work day', { cause: error });
    }
  }

  async listPendingWorkdayInformationToSync(): Promise<WorkDayInformationLocalModel[]> {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_DAY} WHERE is_synced = 0 OR is_deleted = 1;`
      );
      try {
        const result = await stmt.executeAsync<any>();
        const rows = await result.getAllAsync();
        return rows as WorkDayInformationLocalModel[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to list pending workday information to sync', {
        cause: error,
      });
    }
  }

  async markWorkdayInformationAsSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    try {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `UPDATE ${EMBEDDED_TABLES.ROUTE_DAY} SET is_synced = 1 WHERE id_work_day IN (${placeholders});`
      );
      try {
        await stmt.executeAsync(ids);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to mark workday information as synced', {
        cause: error,
      });
    }
  }

  async deleteWorkDay(workDay: WorkDayInformation): Promise<void> {
    try {
      const stmt = await this.db.prepareAsync(
        `DELETE FROM ${EMBEDDED_TABLES.ROUTE_DAY} WHERE id_work_day = ?;`
      );
      try {
        await stmt.executeAsync([workDay.id_work_day]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to delete work day', { cause: error });
    }
  }

  async updateWorkDay(workDay: WorkDayInformation): Promise<void> {
    try {
      const stmt = await this.db.prepareAsync(`
        UPDATE ${EMBEDDED_TABLES.ROUTE_DAY} SET
            start_date = ?,
            finish_date = ?,
            start_petty_cash = ?,
            final_petty_cash = ?,
            id_route = ?,
            route_name = ?,
            description = ?,
            route_status = ?,
            id_day = ?,
            id_route_day = ?,
            is_synced = ?,
            updated_at = ?    
        WHERE id_work_day = ?;
      `);
      try {
        await stmt.executeAsync([
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
          0, // Mark as not synced
          new Date().toISOString(),
          workDay.id_work_day,
        ]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to update work day', { cause: error });
    }
  }

  async listWorkDays(): Promise<WorkDayInformation[]> {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_DAY};`
      );
      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>();
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      return rows.map(
        (row) =>
          new WorkDayInformation(
            row.id_work_day,
            new Date(row.start_date),
            row.finish_date ? new Date(row.finish_date) : null,
            row.start_petty_cash,
            row.final_petty_cash,
            row.id_route,
            row.route_name,
            row.description,
            row.route_status,
            row.id_day,
            row.id_user,
            row.id_route_day
          )
      );
    } catch (error) {
      throw new Error('Failed to list work days', { cause: error });
    }
  }
}