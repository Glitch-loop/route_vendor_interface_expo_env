
// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { ProductInventoryRepository } from '@/src/core/interfaces/ProductInventoryRepository';

// Entities
import { ProductInventory } from '@/src/core/entities/ProductInventory';

// DataSources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteProductInventoryRepository implements ProductInventoryRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

    async createInventory(products: ProductInventory[]): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                for (const product of products) {
                    await tx.runAsync(`
                        INSERT INTO ${EMBEDDED_TABLES.PRODUCTS_INVENTORY} (
                            id_product_inventory,
                            price_at_moment,
                            stock,
                            id_product
                        ) VALUES (?, ?, ?, ?);
                    `, [
                        product['id_product_inventory'],
                        product.get_price_of_product(),
                        product.get_stock_of_product(),
                        product['id_product']
                    ]);
                }
            });
        } catch (error) {
            throw new Error('Failed to create inventory.' + error);
        }
    }

    async updateInventory(products: ProductInventory[]): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                for (const product of products) {
                    await tx.runAsync(`
                        UPDATE ${EMBEDDED_TABLES.PRODUCTS_INVENTORY} SET
                            price_at_moment = ?,
                            stock = ?,
                            id_product = ?
                        WHERE id_product_inventory = ?;
                    `, [
                        product.get_price_of_product(),
                        product.get_stock_of_product(),
                        product['id_product'],
                        product['id_product_inventory']
                    ]);
                }
            });
        } catch (error) {
            throw new Error('Failed to update inventory.' + error);
        }
    }

    async retrieveInventory(): Promise<ProductInventory[]> {
        const inventory: ProductInventory[] = [];
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS_INVENTORY};`);
            const result = statement.executeSync<any>();
            for (let row of result) {
                inventory.push(new ProductInventory(
                    row.id_product_inventory,
                    row.price_at_moment,
                    row.stock,
                    row.id_product
                ));
            }
            return inventory;
        } catch (error) {
            throw new Error('Failed to retrieve inventory.' + error);
        }
    }

    async deleteInventory(products: ProductInventory[]): Promise<void> {
        try { 
            await this.dataSource.initialize();
            const db: SQLiteDatabase = this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                for (const product of products) {
                    await tx.runAsync(`
                        DELETE FROM ${EMBEDDED_TABLES.PRODUCTS_INVENTORY} WHERE id_product_inventory = ?;
                    `, [product['id_product_inventory']]);
                }
            });
        } catch (error) {
            throw new Error('Failed to delete inventory.' + error);
        }
    }
}