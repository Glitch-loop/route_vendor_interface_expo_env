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
export class SupabaseProductRepository implements ProductRepository {
  constructor(
    @inject(TOKENS.SupabaseDataSource) private supabaseDataSource: SupabaseDataSource
  ) { }

  async insertProduct(product: Product): Promise<void> {
    // Note (06-18-26): Vendor's app must not perform this operation.
    return;
  }

  async updateProduct(product: Product): Promise<void> {
    // Note (06-18-26): Vendor's app must not perform this operation.
    return;
  }

  async retrieveAllProducts(): Promise<Product[]> {
    const { data, error } = await this.supabaseDataSource
      .getClient()
      .from(SERVER_DATABASE_ENUM.PRODUCTS)
      .select('*')
      .eq('product_status', 1);

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
    // Note (06-18-26): Vendor's app must not perform this operation.
    return;
  }
}
