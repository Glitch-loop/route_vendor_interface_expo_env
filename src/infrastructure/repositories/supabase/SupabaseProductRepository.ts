import { inject, injectable } from 'tsyringe';

// Interfaces
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';

// Entities
import { Product } from '@/src/core/entities/Product';

// DataSources
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SERVER_DATABASE_ENUM } from '@/src/infrastructure/persitence/enums/serverTablesEnum';

@injectable()
export class SupabaseProductRepository extends ProductRepository {
  constructor(
    @inject(TOKENS.SupabaseDataSource) private supabaseDataSource: SupabaseDataSource
  ) {
    super();
  }

  async insertProduct(product: Product): Promise<void> {
    const { data, error } = await this.supabaseDataSource
      .getClient()
      .from(SERVER_DATABASE_ENUM.PRODUCTS)
      .insert([
        {
          id_product: product.id_product,
          product_name: product.product_name,
          barcode: product.barcode,
          weight: product.weight,
          unit: product.unit,
          comission: product.comission,
          price: product.price,
          product_status: product.product_status,
          order_to_show: product.order_to_show,
        },
      ]);

    if (error) {
      throw new Error(`Failed to insert product: ${error.message}`);
    }
  }

  async updateProduct(product: Product): Promise<void> {
    const { data, error } = await this.supabaseDataSource
      .getClient()
      .from(SERVER_DATABASE_ENUM.PRODUCTS)
      .update({
        product_name: product.product_name,
        barcode: product.barcode,
        weight: product.weight,
        unit: product.unit,
        comission: product.comission,
        price: product.price,
        product_status: product.product_status,
        order_to_show: product.order_to_show,
      })
      .eq('id_product', product.id_product);

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async retrieveAllProducts(): Promise<Product[]> {
    const { data, error } = await this.supabaseDataSource
      .getClient()
      .from(SERVER_DATABASE_ENUM.PRODUCTS)
      .select('*');

    if (error) {
      throw new Error(`Failed to retrieve products: ${error.message}`);
    }

    return (data || []).map(
      (row: any) =>
        new Product(
          row.id_product,
          row.product_name,
          row.barcode,
          row.weight,
          row.unit,
          row.comission,
          row.price,
          row.product_status,
          row.order_to_show
        )
    );
  }

  async deleteProduct(product: Product): Promise<void> {
    const { data, error } = await this.supabaseDataSource
      .getClient()
      .from(SERVER_DATABASE_ENUM.PRODUCTS)
      .delete()
      .eq('id_product', product.id_product);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}
