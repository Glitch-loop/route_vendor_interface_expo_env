// Libraries
import { inject, injectable } from "tsyringe";

// Interfaces
import { LocalDatabaseService } from "@/src/core/interfaces/LocalDatabaseService";

// DataSources
import { SQLiteDataSource } from "@/src/infrastructure/datasources/SQLiteDataSource";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";


import {
  userEmbeddedTable,
  routeDayEmbeddedTable,
  storesEmbeddedTable,
  productsEmbeddedTable,
  productsInventoryEmbeddedTable,
  dayOperationsEmbeddedTable,
  routeTransactionsEmbeddedTable,
  routeTransactionnDescriptionsEmbeddedTable,
  inventoryOperationsEmbeddedTable,
  productOperationDescriptionsEmbeddedTable,
  syncQueueEmbeddedTable,
  syncHistoricEmbeddedTable,
} from '@/src/infrastructure/database/SQLite/embeddedDatabase';


@injectable()
export class SQLiteDatabaseService implements LocalDatabaseService {
    constructor (@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) { }
    
    async createDatabase(): Promise<void> { 
        const tablesToCreate:string[] = [
            userEmbeddedTable,
            routeDayEmbeddedTable,
            storesEmbeddedTable,
            productsEmbeddedTable,
            productsInventoryEmbeddedTable,
            dayOperationsEmbeddedTable,
            routeTransactionsEmbeddedTable,
            routeTransactionnDescriptionsEmbeddedTable,
            inventoryOperationsEmbeddedTable,
            productOperationDescriptionsEmbeddedTable,
            syncQueueEmbeddedTable,
            syncHistoricEmbeddedTable,
        ];

        try {
            await this.dataSource.initialize();
            const db = await this.dataSource.getClient();
            
            const createTablePromises:any[] = tablesToCreate
            .map((queryToCreateTable:string) => {
                // console.log(queryToCreateTable) // Database creation
                return db.runAsync(queryToCreateTable);
            });

            await Promise.all(createTablePromises);

        } catch (error) {
            console.log(error);
            throw new Error('Failed to create embedded database tables.');
        }
    }

    async dropDatabase(): Promise<void> { 
        const tablesToDelete:string[] = [
            EMBEDDED_TABLES.USER,
            EMBEDDED_TABLES.ROUTE_DAY,
            EMBEDDED_TABLES.STORES,
            EMBEDDED_TABLES.PRODUCTS,
            EMBEDDED_TABLES.PRODUCTS_INVENTORY,
            EMBEDDED_TABLES.DAY_OPERATIONS,
            EMBEDDED_TABLES.ROUTE_TRANSACTIONS,
            EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS,
            EMBEDDED_TABLES.INVENTORY_OPERATIONS,
            EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS,
            EMBEDDED_TABLES.SYNC_QUEUE,
            EMBEDDED_TABLES.SYNC_HISTORIC,
        ];
        try {
            await this.dataSource.initialize();
            const db = await this.dataSource.getClient();
            
            const dropTablePromises:any[] = tablesToDelete
            .map((tableName:string) => {
                return db.runAsync(`DROP TABLE IF EXISTS ${tableName};`);
            });

            await Promise.all(dropTablePromises);

         } catch(error) {
            throw new Error('Failed to drop embedded database tables.');
        }
    }

    async cleanDatabase(): Promise<void> { 
        const tablesToDelete:string[] = [
            EMBEDDED_TABLES.ROUTE_DAY,
            EMBEDDED_TABLES.STORES,
            EMBEDDED_TABLES.PRODUCTS,
            EMBEDDED_TABLES.PRODUCTS_INVENTORY,
            EMBEDDED_TABLES.DAY_OPERATIONS,
            EMBEDDED_TABLES.ROUTE_TRANSACTIONS,
            EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS,
            EMBEDDED_TABLES.INVENTORY_OPERATIONS,
            EMBEDDED_TABLES.PRODUCT_OPERATION_DESCRIPTIONS,
            EMBEDDED_TABLES.SYNC_QUEUE,
            EMBEDDED_TABLES.SYNC_HISTORIC,
        ];

        try {
            await this.dataSource.initialize();
            const db = await this.dataSource.getClient();

            const cleanTablePromises:any[] = tablesToDelete.map((tableName:string) => {
                return db.runAsync(`DELETE FROM ${tableName};`);
            });

            await Promise.all(cleanTablePromises);
        } catch (error) {
            throw new Error('Failed to clean embedded database tables: ' + error);
        }
    }
}
