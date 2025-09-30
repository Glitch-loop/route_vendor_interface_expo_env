import { IProductInventory } from '../../../interfaces/interfaces';

export abstract class IInventory {
  abstract createInventory(inventory: IProductInventory[]): Promise<void>;
  abstract updateInventory(inventory: IProductInventory[]): Promise<void>;
  abstract retrieveInventory(): Promise<IProductInventory[]>;
  abstract deleteInventory(inventory: IProductInventory[]): Promise<void>;
}