import { IInventory } from '../../../core/interfaces/InventoryRepository';
import { createSQLiteConnection } from './SQLite';
import { IProductInventory } from '../../../../interfaces/interfaces';
import EMBEDDED_TABLES from '@/utils/embeddedTables';

export class sql_lite_inventory_repository implements IInventory {
  async createInventory(inventory: IProductInventory[]): Promise<void> {
    try {
      const sqlite = await createSQLiteConnection();
      await sqlite.withExclusiveTransactionAsync(async (tx) => {
        for (const product of inventory) {
          await tx.runAsync(
            `INSERT INTO ${EMBEDDED_TABLES.PRODUCTS} (
              id_product, 
              product_name, 
              barcode, 
              weight, 
              unit, 
              comission, 
              price, 
              product_status, 
              amount, 
              order_to_show) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              product.id_product,
              product.product_name,
              product.barcode,
              product.weight,
              product.unit,
              product.comission,
              product.price,
              product.product_status,
              product.amount,
              product.order_to_show,
            ]
          );
        }
      });
      sqlite.closeSync();
    } catch (error) {
      throw new Error('Failed to create inventory.');
    }
  }

  async updateInventory(inventory: IProductInventory[]): Promise<void> {
    try {
      const sqlite = await createSQLiteConnection();
      await sqlite.withExclusiveTransactionAsync(async (tx) => {
        for (const product of inventory) {
          await tx.runAsync(
            `UPDATE ${EMBEDDED_TABLES.PRODUCTS} SET 
              product_name = ?, 
              barcode = ?, 
              weight = ?, 
              unit = ?, 
              comission = ?, 
              price = ?, 
              product_status = ?, 
              amount = ?, 
              order_to_show = ? 
              WHERE id_product = ?;`,
            [
              product.product_name,
              product.barcode,
              product.weight,
              product.unit,
              product.comission,
              product.price,
              product.product_status,
              product.amount,
              product.order_to_show,
              product.id_product,
            ]
          );
        }
      });
      sqlite.closeSync();
    } catch (error) {
      throw new Error('Failed to update inventory.');
    }
  }

  async retrieveInventory(): Promise<IProductInventory[]> {
    try {
      const inventoryOperation:IProductInventory[] = [];
      const sqlite = await createSQLiteConnection();
      const statement = await sqlite.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS};`);
      const result = statement.executeSync<IProductInventory>();

      sqlite.closeSync();

      for(let row of result) {
        inventoryOperation.push(row);
      }

      return inventoryOperation;
    } catch (error) {
      throw new Error('Failed to retrieve inventory.');
    }
  }

  async deleteInventory(inventory: IProductInventory[]): Promise<void> {
    try {
      const sqlite = await createSQLiteConnection();
      await sqlite.withExclusiveTransactionAsync(async (tx) => {
        for (const product of inventory) {
          await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.PRODUCTS} WHERE id_product = ?;`, [product.id_product]);
        }
      });
      sqlite.closeSync();
    } catch (error) {
      throw new Error('Failed to delete inventory.');
    }
  }
}