// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';

// Entities
import { Product } from '@/src/core/entities/Product';
import { ProductPrice } from '@/src/core/object-values/ProductPrice';

// DataSources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import { TOKENS } from '@/src/infrastructure/di/tokens';

@injectable()
export class SQLiteProductRepository implements ProductRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

    async insertProduct(product: Product): Promise<void> {
        try {
            console.log("Inserting product locally: ", product)
            await this.dataSource.initialize();
            const db: SQLiteDatabase = this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`
                    INSERT INTO ${EMBEDDED_TABLES.PRODUCTS} (
                        id_product,
                        product_name,
                        cost,
                        product_status,
                        quantity_presentation,
                        order_to_show,
                        id_measurement_unit,
                        barcode
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                `, [
                    product.id_product,
                    product.product_name,
                    product.cost,
                    product.product_status,
                    product.quantity_presentation,
                    product.order_to_show,
                    product.id_measurement_unit,
                    product.barcode,
                ]);

                for (const price of product.price) {
                    await tx.runAsync(`
                        INSERT INTO ${EMBEDDED_TABLES.PRODUCTS_PRICES} (
                            id_product_price,
                            price,
                            create_at,
                            id_client,
                            id_location,
                            id_route_day
                        ) VALUES (?, ?, ?, ?, ?, ?);
                    `, [
                        price.id_product_price,
                        price.price,
                        price.created_at.toISOString(),
                        price.id_client,
                        price.id_location,
                        price.id_route_day,
                    ]);
                }
            });
        } catch (error) {
            throw new Error('Failed to create product: ' + error);
        }
    }

    async updateProduct(product: Product): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`
                    UPDATE ${EMBEDDED_TABLES.PRODUCTS} SET
                        product_name = ?,
                        cost = ?,
                        product_status = ?,
                        quantity_presentation = ?,
                        order_to_show = ?,
                        id_measurement_unit = ?,
                        barcode = ?
                    WHERE id_product = ?;
                `, [
                    product.product_name,
                    product.cost,
                    product.product_status,
                    product.quantity_presentation,
                    product.order_to_show,
                    product.id_measurement_unit,
                    product.barcode,
                    product.id_product,
                ]);
            });
        } catch (error) {
            throw new Error('Failed to update product.');
        }
    }

    async retrieveAllProducts(): Promise<Product[]> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = this.dataSource.getClient();

            const statement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS};`);
            const result = statement.executeSync<any>();

            const products: Product[] = [];

            for (const row of result) {
                const prices = await this.retrieveProductPrices(db, row.id_product);
                products.push(new Product(
                    row.id_product,
                    row.product_name,
                    row.cost,
                    row.product_status,
                    row.quantity_presentation,
                    row.order_to_show,
                    row.id_measurement_unit ?? null,
                    prices,
                    row.barcode ?? null,
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
                for (const price of product.price) {
                    await tx.runAsync(`
                        DELETE FROM ${EMBEDDED_TABLES.PRODUCTS_PRICES} WHERE id_product_price = ?;
                    `, [price.id_product_price]);
                }
                await tx.runAsync(`
                    DELETE FROM ${EMBEDDED_TABLES.PRODUCTS} WHERE id_product = ?;
                `, [product.id_product]);
            });
        } catch (error) {
            throw new Error('Failed to delete product.');
        }
    }

    private async retrieveProductPrices(db: SQLiteDatabase, id_product: string): Promise<ProductPrice[]> {
        // Note: PRODUCTS_PRICES table does not have an id_product FK column.
        // All prices are returned. Consider adding id_product to the schema for proper filtering.
        const statement = await db.prepareAsync(`
            SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS_PRICES};
        `);

        const result = statement.executeSync<any>();
        const prices: ProductPrice[] = [];
        for (const row of result) {
            prices.push(new ProductPrice(
                row.id_product_price,
                row.price,
                new Date(row.create_at),
                row.id_client,
                row.id_location,
                row.id_route_day,
            ));
        }
        return prices;
    }
}
