// Libraries
import { injectable } from 'tsyringe';

// Interfaces
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";

// Entities
import { Store } from "@/src/core/entities/Store";

// Database
import { createSQLiteConnection } from "./SQLite";
import EMBEDDED_TABLES from "../../database/embeddedTables";

@injectable()
export class SQLiteStoreRepository implements StoreRepository {
    async insertStores(stores: Store[]): Promise<void> {
        try {
            const sqlite = await createSQLiteConnection();
            await sqlite.withExclusiveTransactionAsync(async (tx) => {
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
                        status_store,
                        route_day_state,
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
                        status_store, 
                        route_day_state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
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
                        route_day_state,
                    ]); 
                }
            });
            sqlite.closeSync();
        } catch (error) {
            throw new Error("Failed to insert stores.");
        }
    }

    async updateStore(store: Store): Promise<void> {
      try {
        const sqlite = await createSQLiteConnection();
        await sqlite.withExclusiveTransactionAsync(async (tx) => {
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
            route_day_state,
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
            longuitude = ?, 
            id_creator = ?, 
            creation_date = ?, 
            creation_context = ?, 
            status_store = ?, 
            route_day_state = ? 
            WHERE id_store = '${id_store}';`, 
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
                route_day_state,
            ]);
        });

        sqlite.closeSync();
        } catch(error) {
            throw new Error('Failed to update store.');
        }
    }

    async retrieveStore(id_stores: string[]): Promise<Store[]> {
      try {
        const stores: Store[] = [];

        const sqlite = await createSQLiteConnection();
        const statement = await sqlite.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.STORES} WHERE id_store IN (${id_stores.map((id_store) => `'${id_store}'`).join(',')});`);
        const result = statement.executeSync<Store>();

        sqlite.closeSync();
        
        for(let row of result) {
            stores.push(row);
        }

        return stores;

      } catch (error) {
        return []
      }
    }

    async listStores(): Promise<Store[]> {
      try {
        const stores: Store[] = [];

        const sqlite = await createSQLiteConnection();
        const statement = await sqlite.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.STORES};`);
        const result = statement.executeSync<Store>();

        sqlite.closeSync();
        
        for(let row of result) {
            stores.push(row);
        }

        return stores;

      } catch (error) {
        return []
      }
    }

    async deleteStores(stores: Store[]): Promise<void> {
      try {
        const sqlite = await createSQLiteConnection();
        await sqlite.withExclusiveTransactionAsync(async (tx) => {
          for (const store of stores) {
            await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.STORES} WHERE id_store = ?;`, [store.id_store]);
          }
        });
        sqlite.closeSync();
      } catch (error) {
        throw new Error('Failed to delete stores.');
      }
      
    }
}