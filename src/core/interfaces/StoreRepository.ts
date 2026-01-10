import { Store } from '../entities/Store';

export abstract class StoreRepository {
  abstract insertStores(stores: Store[]): void;
  abstract updateStore(store: Store): void;
  abstract retrieveStore(id_stores: string[]): Promise<Store[]>;
  abstract listStores(): Promise<Store[]>;
  abstract deleteStores(stores: Store[]): void;
}