import InventoryOperationLocalModel from "@/src/infrastructure/persitence/model/local-models/InventoryOperationLocalModel";
import InventoryOperationDescriptionLocalModel from "@/src/infrastructure/persitence/model/local-models/InventoryOperationDescriptionLocalModel";
import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export abstract class SyncInventoryOperationRepository {
    abstract listPendingInventoryOperationToSync(): Promise<(InventoryOperationLocalModel&ReplicationDataInterface)[]>;
    abstract listPendingInventoryOperationDescriptionToSync(): Promise<(InventoryOperationDescriptionLocalModel&ReplicationDataInterface)[]>;
    abstract markInventoryOperationsAsSynced(ids: string[]): Promise<void>;
    abstract markInventoryOperationDescriptionsAsSynced(ids: string[]): Promise<void>;
}