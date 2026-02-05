import InventoryOperationModel from "@/src/infrastructure/persitence/model/InventoryOperationModel";
import InventoryOperationDescriptionModel from "@/src/infrastructure/persitence/model/InventoryOperationDescriptionModel";

export abstract class SyncInventoryOperationRepository {
    abstract listPendingInventoryOperationToSync(): Promise<InventoryOperationModel[]>;
    abstract listPendingInventoryOperationDescriptionToSync(): Promise<InventoryOperationDescriptionModel[]>;
    abstract markInventoryOperationsAsSynced(ids: string[]): Promise<void>;
    abstract markInventoryOperationDescriptionsAsSynced(ids: string[]): Promise<void>;
}