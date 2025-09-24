import { Store } from '../entities/Store';

export abstract class IStore {
  abstract insertStores(stores: Store[]): void;
  abstract updateStore(store: Store): void;
  abstract retrieveStore(id_store: string): Store;
  abstract listStores(): Store[];
  abstract deleteStores(stores: Store[]): void;
}