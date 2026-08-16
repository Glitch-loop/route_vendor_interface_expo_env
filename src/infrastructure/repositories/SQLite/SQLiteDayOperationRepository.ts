// Libraries
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces - Core
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';

// Interface - Infrastructure
import { SyncDayOperationInformationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncDayOperationRepository';

// Entities
import { DayOperation } from '@/src/core/entities/DayOperation';

// Models
import DayOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/DayOperationLocalModel';
import { ReplicationDataInterface } from '@/src/infrastructure/persitence/data-replication/ReplicationDataInterface';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { inject, injectable } from 'tsyringe';

@injectable()
export class SQLiteDayOperationRepository extends DayOperationRepository implements SyncDayOperationInformationRepository {
  private readonly db: SQLiteDatabase;
  
  constructor(db: SQLiteDatabase);
  constructor(dataSource: SQLiteDataSource);
  constructor(@inject(TOKENS.SQLiteDataSource) dbOrDataSource?: SQLiteDatabase | SQLiteDataSource) {
    super();
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
  
  async insertDayOperations(day_operations: DayOperation[]): Promise<void> {
    if (day_operations.length === 0) return;

    const statement = await this.db.prepareAsync(`
      INSERT INTO ${EMBEDDED_TABLES.DAY_OPERATIONS}
          (id_day_operation,
          id_item,
          id_route_day,
          operation_type,
          created_at,
          id_dependency,
          latitude,
          longitude)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `);

    try {
      for (const dayOperation of day_operations) {
        await statement.executeAsync([
          dayOperation.id_day_operation,
          dayOperation.id_item,
          dayOperation.id_route_day,
          dayOperation.operation_type,
          dayOperation.created_at.toISOString(),
          dayOperation.id_dependency ?? null,
          dayOperation.latitude ?? null,
          dayOperation.longitude ?? null,
        ]);
      }
    } catch (error) {
      throw new Error('Failed to insert day operations.', { cause: error });
    } finally {
      await statement.finalizeAsync();
    }
  }

  async updateDayOperation(day_operation: DayOperation): Promise<void> {
    const statement = await this.db.prepareAsync(`
      UPDATE ${EMBEDDED_TABLES.DAY_OPERATIONS} SET
        id_item = ?,
        operation_type = ?,
        created_at = ?,
        id_dependency = ?
      WHERE id_day_operation = ?;
    `);

    try {
      await statement.executeAsync([
        day_operation.id_item,
        day_operation.operation_type,
        day_operation.created_at.toISOString(),
        day_operation.id_dependency ?? null,
        day_operation.id_day_operation,
      ]);
    } catch (error) {
      throw new Error('Failed to update day operation.', { cause: error });
    } finally {
      await statement.finalizeAsync();
    }
  }

  async listDayOperations(): Promise<DayOperation[]> {
    const statement = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.DAY_OPERATIONS};`
    );

    try {
      const result = await statement.executeAsync<DayOperationLocalModel>();
      const rows = await result.getAllAsync();

      return rows.map(
        (row) =>
          new DayOperation(
            row.id_day_operation,
            row.id_item,
            row.id_route_day,
            row.operation_type as DAY_OPERATIONS,
            new Date(row.created_at),
            row.id_dependency,
            row.latitude ?? undefined,
            row.longitude ?? undefined
          )
      );
    } catch (error) {
      throw new Error('Failed to list day operations.', { cause: error });
    } finally {
      await statement.finalizeAsync();
    }
  }

  async deleteDayOperatons(day_operations: DayOperation[]): Promise<void> {
    if (day_operations.length === 0) return;

    const statement = await this.db.prepareAsync(`
      DELETE FROM ${EMBEDDED_TABLES.DAY_OPERATIONS}
      WHERE id_day_operation = ?;
    `);

    try {
      for (const dayOperation of day_operations) {
        await statement.executeAsync([dayOperation.id_day_operation]);
      }
    } catch (error) {
      throw new Error('Failed to delete day operations.', { cause: error });
    } finally {
      await statement.finalizeAsync();
    }
  }

  async listPendingDayOperationToSync(): Promise<(DayOperationLocalModel & ReplicationDataInterface)[]> {
    const statement = await this.db.prepareAsync(`
      SELECT *
      FROM ${EMBEDDED_TABLES.DAY_OPERATIONS}
      WHERE is_synced = 0 OR is_deleted = 1;
    `);

    try {
      type SyncModel = DayOperationLocalModel & ReplicationDataInterface;
      const result = await statement.executeAsync<SyncModel>();
      const rows = await result.getAllAsync();

      return rows.map((row) => ({
        id_day_operation: row.id_day_operation,
        id_item: row.id_item,
        id_route_day: row.id_route_day,
        operation_type: row.operation_type,
        created_at: row.created_at,
        id_dependency: row.id_dependency,
        latitude: row.latitude,
        longitude: row.longitude,
        is_synced: row.is_synced,
        updated_at: row.updated_at,
        is_deleted: row.is_deleted,
      }));
    } catch (error) {
      throw new Error('Failed to list pending day operations to sync.', { cause: error });
    } finally {
      await statement.finalizeAsync();
    }
  }

  async markDayOperationAsSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    const statement = await this.db.prepareAsync(`
      UPDATE ${EMBEDDED_TABLES.DAY_OPERATIONS}
      SET is_synced = 1,
          updated_at = datetime('now')
      WHERE id_day_operation = ?;
    `);

    try {
      for (const id of ids) {
        await statement.executeAsync([id]);
      }
    } catch (error) {
      throw new Error('Failed to mark day operations as synced.', { cause: error });
    } finally {
      await statement.finalizeAsync();
    }
  }
}