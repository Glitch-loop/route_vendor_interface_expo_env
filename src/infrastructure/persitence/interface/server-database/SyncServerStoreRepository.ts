import StoreServerModel from "@/src/infrastructure/persitence/model/server-models/StoreServerModel";

export abstract class SyncServerStoreRepository {
    abstract upsertStores(stores: StoreServerModel[]): Promise<void>;
}