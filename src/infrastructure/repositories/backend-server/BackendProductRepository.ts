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
      const allProducts: ProductResponseInterface[] = await this.recursiveListStore(undefined);      
      /*
        Note (06-25-26):

        Backend doesn't provide a param to list only active ones, so this repo will filter 
        the products to let only the active ones. 

        Active product: product_status = 1
      */
      const products = this.extractProductsCollection(allProducts)
      .filter((store) => { return store.product_status === 1});

      return products.map((product) => this.toProductEntity(product));
    } catch (error) {
      throw new Error('Error fetching products: ' + error);
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    // Note (06-18-26): Vendor's app must not perform this operation.
    return;
  }

  private async recursiveListStore(next_item: string|undefined): Promise<ProductResponseInterface[]> {
    const listedStores:ProductResponseInterface[] = [];
    let urlToRequest:string = `/products?limit=100&next_item=${next_item}`
    try {
      if(next_item === undefined) {
        urlToRequest = `/products?limit=100`
      } else {
        urlToRequest = `/products?limit=100&next_item=${next_item}`
      }

      const response = await this.dataSource.get<ProductResponseInterface[]>(
        urlToRequest
      );

      if (response.meta === undefined) {
        return response.data;
      } else {
        
        if (response.meta.has_next_page === false) {
          return response.data;
        } else {
          return listedStores.concat(
            await this.recursiveListStore(response.meta.next_item)
          )

        }
      }
      
    } catch (error: any) {
      throw new Error(`Failed to list stores: ${error.message}`);
    }
  }

  private extractProductsCollection(
    response: ProductResponseInterface[] | PaginatedProductsResponseInterface
  ): ProductResponseInterface[] {
    if (Array.isArray(response)) return response;
    return [];
  }

  private toProductEntity(response: ProductResponseInterface): Product {
    let order_to_show: number = 0;
    const prices: ProductPrice[] = (response.product_price ?? []).map((price) =>
      this.toProductPriceObjectValue(price)
    ); 

    if (response.order_to_show !== null) {
      if(typeof response.order_to_show === "string") {
        order_to_show = Number(response.order_to_show)
      } else {
        order_to_show = response.order_to_show
      }

    }

    return new Product(
      response.id_product,
      response.product_name,
      response.cost,
      response.product_status,
      response.quantity_presentation,
      order_to_show,
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
      response.id_client ?? null,
      response.id_location ?? null,
      response.id_route_day ?? null
    );
  }
}
