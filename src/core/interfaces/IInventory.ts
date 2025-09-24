import { ProductInventory } from '../entities/ProductInventory';

export abstract class IInventory {
  abstract createInventory(inventory: ProductInventory[]): void;
  abstract updateInventory(inventory: ProductInventory[]): void;
  abstract retrieveInventory(): ProductInventory[];
  abstract deleteInventory(inventory: ProductInventory[]): void;
}