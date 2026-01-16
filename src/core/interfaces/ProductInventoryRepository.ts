import { ProductInventory } from '@/src/core/entities/ProductInventory';

export abstract class ProductInventoryRepository {
  abstract createInventory(inventory: ProductInventory[]): Promise<void>;
  abstract updateInventory(inventory: ProductInventory[]): Promise<void>;
  abstract retrieveInventory(): Promise<ProductInventory[]>;
  abstract deleteInventory(inventory: ProductInventory[]): Promise<void>;
}