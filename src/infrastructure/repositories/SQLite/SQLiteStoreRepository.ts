// Libraries
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';
import { SyncStoreRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncStoreRepository';

// Entities
import { Store } from '@/src/core/entities/Store';

// Models
import StoreLocalModel from '@/src/infrastructure/persitence/model/local-models/StoreLocalModel';

// Database
import EMBEDDED_TABLES from '@/src/infrastructure/database/embeddedTables';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteStoreRepository implements StoreRepository, SyncStoreRepository {
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

  async insertStores(stores: Store[]): Promise<void> {
    if (!stores || stores.length === 0) return;

    try {
      const stmt = await this.db.prepareAsync(`
        INSERT INTO ${EMBEDDED_TABLES.STORES} (
          id_store, 
          street, 
          ext_number, 
          colony, 
          postal_code, 
          address_reference, 
          store_name, 
          owner_name, 
          cellphone, 
          latitude, 
          longitude, 
          id_creator, 
          id_client, 
          id_location_type, 
          creation_date, 
          creation_context,
          status_store,
          is_new
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `);

      try {
        await this.db.withExclusiveTransactionAsync(async () => {
          for (const store of stores) {
            await stmt.executeAsync([
              store.id_store,
              store.street,
              store.ext_number,
              store.colony,
              store.postal_code,
              store.address_reference,
              store.store_name,
              store.owner_name,
              store.cellphone,
              store.latitude,
              store.longitude,
              store.id_creator,
              store.id_client,
              store.id_location_type,
              typeof store.creation_date === 'string'
                ? store.creation_date
                : store.creation_date.toISOString(),
              store.creation_context,
              store.status_store,
              store.is_new,
            ]);
          }
        });
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to insert stores', { cause: error });
    }
  }

  async listPendingStoreToSync(): Promise<StoreLocalModel[]> {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.STORES} WHERE status_store = -1 AND is_new = 1;`
      );
      try {
        const result = await stmt.executeAsync<any>();
        const rows = await result.getAllAsync();
        return rows as StoreLocalModel[];
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to list pending stores to sync', {
        cause: error,
      });
    }
  }

  async markStoreAsSynced(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;

    try {
      const placeholders = ids.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `UPDATE ${EMBEDDED_TABLES.STORES} SET is_synced = 1, is_new = 0 WHERE id_store IN (${placeholders});`
      );
      try {
        await stmt.executeAsync(ids);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to mark stores as synced', { cause: error });
    }
  }

  async updateStore(store: Store): Promise<void> {
    try {
      const stmt = await this.db.prepareAsync(`
        UPDATE ${EMBEDDED_TABLES.STORES} SET 
          street = ?, 
          ext_number = ?, 
          colony = ?, 
          postal_code = ?, 
          address_reference = ?, 
          store_name = ?, 
          owner_name = ?, 
          cellphone = ?, 
          latitude = ?, 
          longitude = ?, 
          id_creator = ?, 
          id_client = ?, 
          id_location_type = ?, 
          creation_date = ?, 
          creation_context = ?, 
          status_store = ?,
          is_synced = 0
        WHERE id_store = ?;
      `);
      try {
        await stmt.executeAsync([
          store.street,
          store.ext_number,
          store.colony,
          store.postal_code,
          store.address_reference,
          store.store_name,
          store.owner_name,
          store.cellphone,
          store.latitude,
          store.longitude,
          store.id_creator,
          store.id_client,
          store.id_location_type,
          typeof store.creation_date === 'string'
            ? store.creation_date
            : store.creation_date.toISOString(),
          store.creation_context,
          store.status_store,
          store.id_store,
        ]);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to update store', { cause: error });
    }
  }

  async retrieveStore(id_stores: string[]): Promise<Store[]> {
    if (!id_stores || id_stores.length === 0) return [];

    try {
      const placeholders = id_stores.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.STORES} WHERE id_store IN (${placeholders});`
      );
      let rows: any[];
      try {
        const result = await stmt.executeAsync<any>(id_stores);
        rows = await result.getAllAsync();
      } finally {
        await stmt.finalizeAsync();
      }

      return rows.map(
        (row) =>
          new Store(
            row.id_store,
            row.street,
            row.ext_number,
            row.colony,
            row.postal_code,
            row.address_reference,
            row.store_name,
            row.owner_name,
            row.cellphone,
            row.latitude,
            row.longitude,
            row.id_creator,
            row.id_client,
            row.id_location_type,
            new Date(row.creation_date),
            row.creation_context,
            row.status_store,
            row.is_new
          )
      );
    } catch (error) {
      throw new Error('Failed to retrieve stores', { cause: error });
    }
  }

  async listStores(): Promise<Store[]> {
    try {
      const stmt = await this.db.prepareAsync(
        `SELECT * FROM ${EMBEDDED_TABLES.STORES};`
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
          new Store(
            row.id_store,
            row.street,
            row.ext_number,
            row.colony,
            row.postal_code,
            row.address_reference,
            row.store_name,
            row.owner_name,
            row.cellphone,
            row.latitude,
            row.longitude,
            row.id_creator,
            row.id_client,
            row.id_location_type,
            new Date(row.creation_date),
            row.creation_context,
            row.status_store,
            row.is_new
          )
      );
    } catch (error) {
      throw new Error('Failed to list stores', { cause: error });
    }
  }

  async deleteStores(stores: Store[]): Promise<void> {
    if (!stores || stores.length === 0) return;

    try {
      const ids = stores.map((s) => s.id_store);
      const placeholders = ids.map(() => '?').join(',');
      const stmt = await this.db.prepareAsync(
        `DELETE FROM ${EMBEDDED_TABLES.STORES} WHERE id_store IN (${placeholders});`
      );
      try {
        await stmt.executeAsync(ids);
      } finally {
        await stmt.finalizeAsync();
      }
    } catch (error) {
      throw new Error('Failed to delete stores', { cause: error });
    }
  }
}