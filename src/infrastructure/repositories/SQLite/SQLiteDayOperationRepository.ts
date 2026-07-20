// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces - Core
import { DayOperationRepository } from '@/src/core/interfaces/DayOperationRepository';

// Interface - Infrastructure
import { SyncDayOperationInformationRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncDayOperationRepository';

// Entities
import { DayOperation } from '@/src/core/entities/DayOperation';

// DataSources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Container
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Models
import DayOperationLocalModel from '@/src/infrastructure/persitence/model/local-models/DayOperationLocalModel';
import { ReplicationDataInterface } from '@/src/infrastructure/persitence/data-replication/ReplicationDataInterface';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";


@injectable()
export class SQLiteDayOperationRepository extends DayOperationRepository implements SyncDayOperationInformationRepository {
  constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {
    super();
  }

  async insertDayOperations(day_operations: DayOperation[]): Promise<void> {    
    try {
      await this.dataSource.initialize();
      const db: SQLiteDatabase = await this.dataSource.getClient();
      await db.withExclusiveTransactionAsync(async (tx) => {
        for (const dayOperation of day_operations) {
            const latitude = dayOperation.latitude ? dayOperation.latitude : null;
            const longitude = dayOperation.longitude ? dayOperation.longitude : null;

          await tx.runAsync(`
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
          `, [
              dayOperation.id_day_operation,
              dayOperation.id_item,
              dayOperation.id_route_day,
              dayOperation.operation_type,
              dayOperation.created_at.toISOString(),
              dayOperation.id_dependency,
              latitude,
              longitude
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

      await db.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync(`
            UPDATE ${EMBEDDED_TABLES.DAY_OPERATIONS} SET 
              id_item = ?, 
              operation_type = ?, 
              created_at = ?, id_dependency = ?
              WHERE id_day_operation = ?;
        `, [
            day_operation.id_item,
            day_operation.operation_type,
            day_operation.created_at.toISOString(),
            day_operation.id_day_operation
        ]);
      });
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
          row.id_route_day,
          row.operation_type,
          new Date(row.created_at),
          row.id_dependency,
          row.latitude === null ? undefined : row.latitude,
          row.longitude === null ? undefined : row.longitude,
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

  async listPendingDayOperationToSync(): Promise<(DayOperationLocalModel&ReplicationDataInterface)[]> {
    try {
      await this.dataSource.initialize();
      const db: SQLiteDatabase = await this.dataSource.getClient();

      const rows = await db.getAllAsync<any>(`
        SELECT *
        FROM ${EMBEDDED_TABLES.DAY_OPERATIONS}
        WHERE is_synced = 0 OR is_deleted = 1;
      `);

      return rows.map((row) => {
        return {
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
        } as DayOperationLocalModel&ReplicationDataInterface;
      } );
    } catch (error) {
      throw new Error(`Failed to list pending day operations to sync: ${error}`);
    }
  }

  async markDayOperationAsSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    try {
      await this.dataSource.initialize();
      const db: SQLiteDatabase = await this.dataSource.getClient();

      await db.withExclusiveTransactionAsync(async (tx) => {
        const placeholders = ids.map(() => '?').join(',');
        await tx.runAsync(
          `UPDATE ${EMBEDDED_TABLES.DAY_OPERATIONS}
            SET is_synced = 1,
                updated_at = datetime('now')
            WHERE id_day_operation IN (${placeholders});`,
          ids
        );
      });
    } catch (error) {
      throw new Error(`Failed to mark day operations as synced: ${error}`);
    }
  }
}
