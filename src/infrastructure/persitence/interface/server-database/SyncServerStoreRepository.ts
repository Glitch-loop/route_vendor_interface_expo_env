import StoreModel from "@/src/infrastructure/persitence/model/StoreModel";

export abstract class SyncServerStoreRepository {
    abstract upsertStores(stores: StoreModel[]): Promise<void>;
}