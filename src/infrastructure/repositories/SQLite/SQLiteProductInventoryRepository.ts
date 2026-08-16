// Libraries
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';

// Entities
import { ProductInventory } from '@/src/core/entities/ProductInventory';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { inject, injectable } from 'tsyringe';

interface ProductInventoryRow {
  id_product_inventory: string;
  stock: number;
  id_product: string;
}

@injectable()
export class SQLiteProductInventoryRepository implements ProductInventoryRepository {
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

  async createInventory(products: ProductInventory[]): Promise<void> {
    if (!products || products.length === 0) return;

    const statement = await this.db.prepareAsync(`
      INSERT INTO ${EMBEDDED_TABLES.PRODUCTS_INVENTORY} (
        id_product_inventory,
        stock,
        id_product
      ) VALUES (?, ?, ?);
    `);

    try {
      for (const product of products) {
        await statement.executeAsync([
          product.get_id_product_inventory(),
          product.get_stock_of_product(),
          product.get_id_product(),
        ]);
      }
    } catch (error) {
      throw new Error('Failed to create inventory: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async updateInventory(products: ProductInventory[]): Promise<void> {
    if (!products || products.length === 0) return;

    const statement = await this.db.prepareAsync(`
      UPDATE ${EMBEDDED_TABLES.PRODUCTS_INVENTORY} SET
        stock = ?,
        id_product = ?
      WHERE id_product_inventory = ?;
    `);

    try {
      for (const product of products) {
        await statement.executeAsync([
          product.get_stock_of_product(),
          product.get_id_product(),
          product.get_id_product_inventory(),
        ]);
      }
    } catch (error) {
      throw new Error('Failed to update inventory: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async retrieveInventory(): Promise<ProductInventory[]> {
    const statement = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS_INVENTORY};`
    );

    try {
      const result = await statement.executeAsync<ProductInventoryRow>();
      const rows = await result.getAllAsync();

      return rows.map(
        (row) =>
          new ProductInventory(
            row.id_product_inventory,
            row.stock,
            row.id_product
          )
      );
    } catch (error) {
      throw new Error('Failed to retrieve inventory: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async deleteInventory(products: ProductInventory[]): Promise<void> {
    if (!products || products.length === 0) return;

    const statement = await this.db.prepareAsync(
      `DELETE FROM ${EMBEDDED_TABLES.PRODUCTS_INVENTORY} WHERE id_product_inventory = ?;`
    );

    try {
      for (const product of products) {
        await statement.executeAsync([product.get_id_product_inventory()]);
      }
    } catch (error) {
      throw new Error('Failed to delete inventory: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }
}