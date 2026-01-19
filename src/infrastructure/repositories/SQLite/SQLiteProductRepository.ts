// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';

// Entities
import { Product } from '@/src/core/entities/Product';

// DataSources
import { SQLiteDataSource } from '../../datasources/SQLiteDataSource';

// Utils
import EMBEDDED_TABLES from '@/utils/embeddedTables';
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteProductRepository implements ProductRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

    async insertProduct(product: Product): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`
                    INSERT INTO ${EMBEDDED_TABLES.PRODUCTS} (
                        id_product,
                        product_name,
                        barcode,
                        weight,
                        unit,
                        comission,
                        price,
                        product_status,
                        order_to_show
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                `, [
                    product.id_product,
                    product.product_name,
                    product.barcode,
                    product.weight,
                    product.unit,
                    product.comission,
                    product.price,
                    product.product_status,
                    product.order_to_show
                ]);
            });
        } catch (error) {
            throw new Error('Failed to create product.');
        }
    }

    async updateProduct(product: Product): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`
                    UPDATE ${EMBEDDED_TABLES.PRODUCTS} SET
                        product_name = ?,
                        barcode = ?,
                        weight = ?,
                        unit = ?,
                        comission = ?,
                        price = ?,
                        product_status = ?,
                        order_to_show = ?
                    WHERE id_product = ?;
                `, [
                    product.product_name,
                    product.barcode,
                    product.weight,
                    product.unit,
                    product.comission,
                    product.price,
                    product.product_status,
                    product.order_to_show,
                    product.id_product
                ]);
            });
        } catch (error) {
            throw new Error('Failed to update product.');
        }
    }

    async retrieveAllProducts(): Promise<Product[]> {
        const products: Product[] = [];
        try { 
            await this.dataSource.initialize();
            const db: SQLiteDatabase = this.dataSource.getClient();
            const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS};`);
            const result = statement.executeSync<any>();
            for (let row of result) {
                products.push(new Product(
                    row.id_product,
                    row.product_name,
                    row.barcode,
                    row.weight,
                    row.unit,
                    row.comission,
                    row.price,
                    row.product_status,
                    row.order_to_show
                ));
            }
            return products;
        } catch (error) {
            throw new Error('Failed to retrieve products.');
        }
    }

    async deleteProduct(product: Product): Promise<void> {
        try { 
            await this.dataSource.initialize();
            const db: SQLiteDatabase = this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`
                    DELETE FROM ${EMBEDDED_TABLES.PRODUCTS} WHERE id_product = ?;
                `, [product.id_product]);
            });
        } catch (error) {
            throw new Error('Failed to delete product.');
        }
    }
}
