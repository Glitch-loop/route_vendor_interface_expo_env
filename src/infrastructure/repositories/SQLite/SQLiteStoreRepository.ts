// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from "expo-sqlite";

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";
import { SyncStoreRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncStoreRepository';

// Entities
import { Store } from "@/src/core/entities/Store";

// Models
import StoreModel from '@/src/infrastructure/persitence/model/StoreModel';

// Database

// DataSources
import { SQLiteDataSource } from "@/src/infrastructure/datasources/SQLiteDataSource";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";


@injectable()
export class SQLiteStoreRepository implements StoreRepository, SyncStoreRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

    async insertStores(stores: Store[]): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db:SQLiteDatabase = this.dataSource.getClient();
            
            await db.withExclusiveTransactionAsync(async (tx) => {
                for (const store of stores) {
                    const {
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
                        creation_date,
                        creation_context,
                        status_store
                        } = store;
                    await tx.runAsync(`INSERT INTO ${EMBEDDED_TABLES.STORES} (
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
                        creation_date, 
                        creation_context,
                        status_store) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [
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
                        creation_date,
                        creation_context,
                        status_store,
                    ]); 
                }
            });
        } catch (error) {

          throw new Error("Failed to insert stores: " + error);
        }
    }

    async listPendingStoreToSync(): Promise<StoreModel[]> {
      try {
        await this.dataSource.initialize();
        const db: SQLiteDatabase = await this.dataSource.getClient();
        const pending: StoreModel[] = [];
        const stmt = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.STORES} WHERE is_synced = 0 OR is_deleted = 1;`);
        const rows = stmt.executeSync<any>();
        for (const row of rows) {
          pending.push(row as StoreModel);
        }
        return pending;
      } catch (error) {
        throw new Error('Failed to list pending stores to sync: ' + error);
      }
    }

    async markStoreAsSynced(ids: string[]): Promise<void> {
      if (!ids || ids.length === 0) return;
      try {
        await this.dataSource.initialize();
        const db: SQLiteDatabase = await this.dataSource.getClient();
        await db.withExclusiveTransactionAsync(async (tx) => {
          const placeholders = ids.map(() => '?').join(',');
          await tx.runAsync(
            `UPDATE ${EMBEDDED_TABLES.STORES} SET is_synced = 1 WHERE id_store IN (${placeholders});`,
            ids
          );
        });
      } catch (error) {
        throw new Error('Failed to mark stores as synced: ' + error);
      }
    }

    async updateStore(store: Store): Promise<void> {
      try {
        await this.dataSource.initialize();
        const db: SQLiteDatabase = await this.dataSource.getClient();
        await db.withExclusiveTransactionAsync(async (tx) => {
        const {
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
            creation_date,
            creation_context,
            status_store,
        } = store;

        await tx.runAsync(`UPDATE ${EMBEDDED_TABLES.STORES} SET 
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
            creation_date = ?, 
            creation_context = ?, 
            status_store = ? 
            WHERE id_store = ?;`, 
            [
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
                creation_date,
                creation_context,
                status_store,
                id_store,
            ]);
        });
        } catch(error) {
            throw new Error('Failed to update store: ' + error);
        }
    }

    async retrieveStore(id_stores: string[]): Promise<Store[]> {
      try {
        await this.dataSource.initialize();
        const stores: Store[] = [];

        const db: SQLiteDatabase = await this.dataSource.getClient();
        const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.STORES} WHERE id_store IN (${id_stores.map((id_store) => `'${id_store}'`).join(',')});`);
        const result = statement.executeSync<Store>();
        
        for(let row of result) {
            stores.push(row);
        }

        return stores;

      } catch (error) {
        throw new Error('Failed to retrieve stores: ' + error);
      }
    }

    async listStores(): Promise<Store[]> {
      try {
        await this.dataSource.initialize();
        const stores: Store[] = [];

        const db: SQLiteDatabase = await this.dataSource.getClient();
        const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.STORES};`);
        const result = statement.executeSync<Store>();
        
        for(let row of result) {
            stores.push(row);
        }

        return stores;

      } catch (error) {
        throw new Error('Failed to list stores: ' + error);
      }
    }

    async deleteStores(stores: Store[]): Promise<void> {
      try {
        await this.dataSource.initialize();
        const db: SQLiteDatabase = await this.dataSource.getClient();
        await db.withExclusiveTransactionAsync(async (tx) => {
          for (const store of stores) {
            await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.STORES} WHERE id_store = ?;`, [store.id_store]);
          }
        });
      } catch (error) {
        throw new Error('Failed to delete stores: ' + error);
      }
      
    }
}