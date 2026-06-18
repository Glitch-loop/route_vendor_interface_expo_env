import { inject, injectable } from 'tsyringe';

// Interfaces
import { ProductRepository } from '@/src/core/interfaces/ProductRepository';

// Entities
import { Product } from '@/src/core/entities/Product';
import { ProductPrice } from '@/src/core/object-values/ProductPrice';

// DataSources
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

interface ListProductsRequestInterface {
  limit?: string;
  filter?: string;
  next_item?: string;
}

interface ProductPriceResponseInterface {
  id_product_price: string;
  price: number;
  created_at: string;
  id_client?: string;
  id_location?: string;
  id_route_day?: string;
}

interface ProductResponseInterface {
  id_product: string;
  product_name: string;
  cost: number;
  product_status: number;
  quantity_presentation: number;
  order_to_show: number | string | null;
  id_measurement_unit: string | null;
  barcode: string | null;
  product_price?: ProductPriceResponseInterface[];
}

interface PaginatedProductsResponseInterface {
  items?: ProductResponseInterface[];
  data?: ProductResponseInterface[];
  collection?: ProductResponseInterface[];
  products?: ProductResponseInterface[];
}

@injectable()
export class BackendProductRepository implements ProductRepository {
  constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

  async insertProduct(product: Product): Promise<void> {
    // Note (06-18-26): Vendor's app must not perform this operation.
    return;
  }

  async updateProduct(product: Product): Promise<void> {
    // Note (06-18-26): Vendor's app must not perform this operation.
    return;
  }

  async retrieveAllProducts(): Promise<Product[]> {
    try {
      const request: ListProductsRequestInterface = {
        limit: '100',
      };

      const response = await this.dataSource.get<ProductResponseInterface[] | PaginatedProductsResponseInterface>(
        '/products',
        {
          params: request,
        }
      );

      const products = this.extractProductsCollection(response);

      return products.map((product) => this.toProductEntity(product));
    } catch (error) {
      throw new Error('Error fetching products: ' + error);
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    // Note (06-18-26): Vendor's app must not perform this operation.
    return;
  }

  private extractProductsCollection(
    response: ProductResponseInterface[] | PaginatedProductsResponseInterface
  ): ProductResponseInterface[] {
    if (Array.isArray(response)) return response;
    return [];
  }

  private toProductEntity(response: ProductResponseInterface): Product {
    const prices: ProductPrice[] = (response.product_price ?? []).map((price) =>
      this.toProductPriceObjectValue(price)
    ); 

    return new Product(
      response.id_product,
      response.product_name,
      response.cost,
      response.product_status,
      response.quantity_presentation,
      response.order_to_show === null ? null : String(response.order_to_show),
      response.id_measurement_unit,
      prices,
      response.barcode
    );
  }

  private toProductPriceObjectValue(response: ProductPriceResponseInterface): ProductPrice {
    return new ProductPrice(
      response.id_product_price,
      response.price,
      new Date(response.created_at),
      response.id_client ?? '',
      response.id_location ?? '',
      response.id_route_day ?? ''
    );
  }
}
