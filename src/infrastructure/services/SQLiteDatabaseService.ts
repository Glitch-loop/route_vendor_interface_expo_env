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
  productPricesEmbeddedTable,
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
      productPricesEmbeddedTable,
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

      await db.withExclusiveTransactionAsync(async (tx) => {
        const createTablePromises:any[] = tablesToCreate
        .map((queryToCreateTable:string) => {
          // console.log(queryToCreateTable) // Database creation
          return tx.runAsync(queryToCreateTable);
        });
        await Promise.all(createTablePromises);
      });
    } catch (error) {
        throw new Error('Failed to create embedded database tables: ' + error);
    }
  }

  async dropDatabase(): Promise<void> { 
    console.log("Dropping database...")
    const tablesToDelete:string[] = [
      EMBEDDED_TABLES.USER,
      EMBEDDED_TABLES.ROUTE_DAY,
      EMBEDDED_TABLES.STORES,
      EMBEDDED_TABLES.PRODUCTS,
      EMBEDDED_TABLES.PRODUCTS_PRICES,
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
      

      await db.withExclusiveTransactionAsync(async (tx) => {
        const dropTablePromises:any[] = tablesToDelete
        .map((tableName:string) => {
            return tx.runAsync(`DROP TABLE IF EXISTS ${tableName};`);
        });
        await Promise.all(dropTablePromises);
      });

    } catch(error) {
      throw new Error('Failed to drop embedded database tables.');
    }
  }

  async cleanDatabase(excludeTable?: EMBEDDED_TABLES[]): Promise<void> { 
    const excludeTableSet: Set<string> = new Set<string>(
      excludeTable === undefined ? [] : excludeTable
    );

    const tablesToDelete:string[] = [
      EMBEDDED_TABLES.USER,
      EMBEDDED_TABLES.ROUTE_DAY,
      EMBEDDED_TABLES.STORES,
      EMBEDDED_TABLES.PRODUCTS,
      EMBEDDED_TABLES.PRODUCTS_PRICES,
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
      const db = this.dataSource.getClient();

      await db.withExclusiveTransactionAsync(async (tx) => { 
        const cleanTablePromises:any[] = tablesToDelete.map((tableName:string) => {
          if (!excludeTableSet.has(tableName)) return tx.runAsync(`DELETE FROM ${tableName};`);
        });
  
        await Promise.all(cleanTablePromises);
      });
    } catch (error) {
      throw new Error('Failed to clean embedded database tables: ' + error);
    }
  }
}
