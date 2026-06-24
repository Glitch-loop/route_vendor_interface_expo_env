import StoreLocalModel from "@/src/infrastructure/persitence/model/local-models/StoreLocalModel";

export abstract class SyncStoreRepository {
    abstract listPendingStoreToSync(): Promise<StoreLocalModel[]>;
    abstract markStoreAsSynced(ids: string[]): Promise<void>;
}