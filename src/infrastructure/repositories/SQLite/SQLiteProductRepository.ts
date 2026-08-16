// Libraries
import { SQLiteDatabase } from 'expo-sqlite';

// Interfaces
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';

// Entities
import { Product } from '@/src/core/entities/Product';
import { ProductPrice } from '@/src/core/object-values/ProductPrice';

// Utils
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";
import { inject, injectable } from 'tsyringe';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

interface ProductRow {
  id_product: string;
  product_name: string;
  cost: number;
  product_status: string;
  quantity_presentation: number;
  order_to_show: number;
  id_measurement_unit: string | null;
  barcode: string | null;
}

interface ProductPriceRow {
  id_product_price: string;
  price: number;
  create_at: string;
  id_client: string | null;
  id_location: string | null;
  id_route_day: string | null;
}

@injectable()
export class SQLiteProductRepository implements ProductRepository {
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

  async insertProduct(product: Product): Promise<void> {
    const productStmt = await this.db.prepareAsync(`
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
    `);

    const priceStmt = await this.db.prepareAsync(`
      INSERT INTO ${EMBEDDED_TABLES.PRODUCTS_PRICES} (
        id_product_price,
        price,
        create_at,
        id_client,
        id_location,
        id_route_day,
        id_product
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    try {
      await productStmt.executeAsync([
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
        await priceStmt.executeAsync([
          price.id_product_price,
          price.price,
          price.created_at.toISOString(),
          price.id_client,
          price.id_location,
          price.id_route_day,
          product.id_product,
        ]);
      }
    } catch (error) {
      throw new Error('Failed to create product: ' + error);
    } finally {
      await productStmt.finalizeAsync();
      await priceStmt.finalizeAsync();
    }
  }

  async updateProduct(product: Product): Promise<void> {
    const statement = await this.db.prepareAsync(`
      UPDATE ${EMBEDDED_TABLES.PRODUCTS} SET
        product_name = ?,
        cost = ?,
        product_status = ?,
        quantity_presentation = ?,
        order_to_show = ?,
        id_measurement_unit = ?,
        barcode = ?
      WHERE id_product = ?;
    `);

    try {
      await statement.executeAsync([
        product.product_name,
        product.cost,
        product.product_status,
        product.quantity_presentation,
        product.order_to_show,
        product.id_measurement_unit,
        product.barcode,
        product.id_product,
      ]);
    } catch (error) {
      throw new Error('Failed to update product: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async retrieveAllProducts(): Promise<Product[]> {
    const statement = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS};`
    );

    try {
      const result = await statement.executeAsync<ProductRow>();
      const rows = await result.getAllAsync();

      const products: Product[] = [];

      for (const row of rows) {
        const prices = await this.retrieveProductPrices(row.id_product);
        products.push(
          new Product(
            row.id_product,
            row.product_name,
            row.cost,
            Number(row.product_status),
            row.quantity_presentation,
            row.order_to_show,
            row.id_measurement_unit ?? null,
            prices,
            row.barcode ?? null
          )
        );
      }

      return products;
    } catch (error) {
      throw new Error('Failed to retrieve products: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    const priceStmt = await this.db.prepareAsync(
      `DELETE FROM ${EMBEDDED_TABLES.PRODUCTS_PRICES} WHERE id_product_price = ?;`
    );
    const productStmt = await this.db.prepareAsync(
      `DELETE FROM ${EMBEDDED_TABLES.PRODUCTS} WHERE id_product = ?;`
    );

    try {
      for (const price of product.price) {
        await priceStmt.executeAsync([price.id_product_price]);
      }
      await productStmt.executeAsync([product.id_product]);
    } catch (error) {
      throw new Error('Failed to delete product: ' + error);
    } finally {
      await priceStmt.finalizeAsync();
      await productStmt.finalizeAsync();
    }
  }

  private async retrieveProductPrices(id_product: string): Promise<ProductPrice[]> {
    const statement = await this.db.prepareAsync(
      `SELECT * FROM ${EMBEDDED_TABLES.PRODUCTS_PRICES} WHERE id_product = ?;`
    );

    try {
      const result = await statement.executeAsync<ProductPriceRow>([id_product]);
      const rows = await result.getAllAsync();

      return rows.map(
        (row) =>
          new ProductPrice(
            row.id_product_price,
            row.price,
            new Date(row.create_at),
            row.id_client,
            row.id_location,
            row.id_route_day
          )
      );
    } catch (error) {
      throw new Error('Failed to retrieve product prices: ' + error);
    } finally {
      await statement.finalizeAsync();
    }
  }
}