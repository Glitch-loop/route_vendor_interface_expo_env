import { Product } from '@/src/core/entities/Product';

export abstract class ProductRepository {
  abstract insertProduct(product: Product): Promise<void>;
  abstract updateProduct(product: Product): Promise<void>;
  abstract retrieveAllProducts(): Promise<Product[]>;
  abstract deleteProduct(product: Product): Promise<void>;
}