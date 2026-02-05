import StoreModel from "@/src/infrastructure/persitence/model/StoreModel";

export abstract class SyncStoreRepository {
    abstract listPendingStoreToSync(): Promise<StoreModel[]>;
    abstract markStoreAsSynced(ids: string[]): Promise<void>;
}